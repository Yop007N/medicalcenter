# -*- coding: utf-8 -*-
"""
Synchronization endpoints - Cloud-local sync operations
"""

from decimal import Decimal
import hashlib
import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta, date, timezone
from sqlalchemy.sql.sqltypes import Date as SQLDate, DateTime, Integer, Float, Numeric, Boolean, JSON
from app.models.sync_log import SyncLog
from app.extensions import db
from app.utils.decorators import admin_required

blueprint = Blueprint('sync', __name__, url_prefix='/api/sync')

MAX_SYNC_CHANGES = 500
MAX_SYNC_LOGS_LIMIT = 500


class SyncConflictError(Exception):
    """Raised when client payload loses conflict resolution against server state."""

    def __init__(self, message, server_version=None, client_version=None):
        super().__init__(message)
        self.server_version = server_version or {}
        self.client_version = client_version or {}


@blueprint.route('/push', methods=['POST'])
@jwt_required()
def push_to_cloud():
    """Push local changes to cloud with model-level handlers"""
    _ = int(get_jwt_identity())
    data = request.get_json(silent=True)
    if data is None:
        return jsonify({'msg': 'Invalid JSON body'}), 400
    if not isinstance(data, dict):
        return jsonify({'msg': 'Request body must be an object'}), 400

    changes = data.get('changes', [])
    if not isinstance(changes, list):
        return jsonify({'msg': 'changes must be an array'}), 400
    if len(changes) > MAX_SYNC_CHANGES:
        return jsonify({'msg': f'changes exceeds limit ({MAX_SYNC_CHANGES})'}), 400

    synced = []
    conflicts = []

    for change in changes:
        validation_error = _validate_push_change(change)
        if validation_error:
            conflicts.append({
                'local_id': change.get('entity_id') if isinstance(change, dict) else None,
                'error': validation_error
            })
            continue

        entity_type = change.get('entity_type')
        entity_id = change.get('entity_id')
        operation = (change.get('operation') or '').lower()
        entity_data = change.get('data', {})
        idempotency_key = _build_idempotency_key(change)

        previous = SyncLog.query.filter_by(
            idempotency_key=idempotency_key,
            direction='local_to_cloud',
            status='completed'
        ).order_by(db.desc(SyncLog.id)).first()
        if previous:
            synced.append({
                'local_id': entity_id,
                'server_id': previous.result_entity_id or previous.entity_id,
                'idempotent': True
            })
            continue

        # Create sync log
        sync_log = SyncLog(
            entity_type=entity_type,
            entity_id=_normalize_log_entity_id(entity_id),
            operation=operation,
            direction='local_to_cloud',
            status='pending',
            idempotency_key=idempotency_key,
            external_entity_ref=str(entity_id) if entity_id is not None else None
        )

        try:
            server_id = process_sync_change(entity_type, operation, entity_id, entity_data)

            sync_log.status = 'completed'
            sync_log.completed_at = datetime.utcnow()
            sync_log.result_entity_id = server_id
            db.session.add(sync_log)
            db.session.commit()

            synced.append({
                'local_id': entity_id,
                'server_id': server_id
            })

        except SyncConflictError as e:
            db.session.rollback()
            sync_log.status = 'failed'
            sync_log.error_message = str(e)
            sync_log.conflict_payload = {
                'conflict': True,
                'server_version': e.server_version,
                'client_version': e.client_version,
                'resolution': 'server_wins'
            }
            db.session.add(sync_log)
            db.session.commit()
            conflicts.append({
                'local_id': entity_id,
                'error': str(e),
                'conflict': sync_log.conflict_payload
            })

        except Exception as e:
            db.session.rollback()
            sync_log.status = 'failed'
            sync_log.error_message = str(e)
            db.session.add(sync_log)
            db.session.commit()
            public_error = _public_sync_error_message(e)
            conflicts.append({
                'local_id': entity_id,
                'error': public_error
            })

    return jsonify({
        'synced': synced,
        'conflicts': conflicts
    }), 200


@blueprint.route('/pull', methods=['GET'])
@jwt_required()
def pull_from_cloud():
    """Pull cloud changes to local"""
    _ = int(get_jwt_identity())
    since = request.args.get('since')

    # Parse timestamp
    if since:
        try:
            since_date = _parse_iso_datetime(since)
        except ValueError:
            return jsonify({'msg': 'Invalid date format'}), 400
    else:
        # Default to last 24 hours
        since_date = datetime.utcnow() - timedelta(days=1)

    changes = []
    for entity_type, model in _get_supported_models().items():
        # Keep singular keys in response
        if entity_type.endswith('s'):
            continue
        updated_at_column = getattr(model, 'updated_at', None)
        created_at_column = getattr(model, 'created_at', None)
        if updated_at_column is None and created_at_column is None:
            continue

        if updated_at_column is not None and created_at_column is not None:
            timestamp_expression = db.func.coalesce(updated_at_column, created_at_column)
        else:
            timestamp_expression = updated_at_column or created_at_column

        rows = model.query.filter(timestamp_expression >= since_date).all()
        for row in rows:
            changes.append({
                'entity_type': entity_type,
                'operation': 'update',
                'data': _serialize_model_instance(row)
            })

    return jsonify({
        'changes': changes,
        'timestamp': datetime.utcnow().isoformat()
    }), 200


@blueprint.route('/status', methods=['GET'])
@jwt_required()
def get_sync_status():
    """Get sync status"""
    # Get pending syncs
    pending = SyncLog.query.filter_by(status='pending').count()
    failed = SyncLog.query.filter_by(status='failed').count()
    completed = SyncLog.query.filter_by(status='completed').count()

    # Get last sync time
    last_sync = SyncLog.query.filter_by(status='completed').order_by(
        db.desc(SyncLog.completed_at)
    ).first()

    return jsonify({
        'pending': pending,
        'failed': failed,
        'completed': completed,
        'last_sync': last_sync.completed_at.isoformat() if last_sync else None
    }), 200


@blueprint.route('/logs', methods=['GET'])
@admin_required
def get_sync_logs():
    """Get sync logs (admin only)."""
    limit_raw = request.args.get('limit')
    if limit_raw is None:
        limit = 50
    else:
        try:
            limit = int(limit_raw)
        except (TypeError, ValueError):
            return jsonify({'msg': 'limit must be an integer'}), 400
    if limit < 1 or limit > MAX_SYNC_LOGS_LIMIT:
        return jsonify({'msg': f'limit must be between 1 and {MAX_SYNC_LOGS_LIMIT}'}), 400

    logs = SyncLog.query.order_by(
        db.desc(SyncLog.created_at)
    ).limit(limit).all()

    return jsonify([{
        'id': log.id,
        'entity_type': log.entity_type,
        'entity_id': log.entity_id,
        'external_entity_ref': log.external_entity_ref,
        'result_entity_id': log.result_entity_id,
        'operation': log.operation,
        'direction': log.direction,
        'status': log.status,
        'error_message': log.error_message,
        'conflict_payload': log.conflict_payload,
        'idempotency_key': log.idempotency_key,
        'created_at': log.created_at.isoformat()
    } for log in logs]), 200


def process_sync_change(entity_type, operation, entity_id, data):
    """
    Process a sync change with model-aware create/update/delete handlers.
    """
    if operation not in {'create', 'update', 'delete'}:
        raise ValueError(f'Unsupported operation: {operation}')

    model = _get_model_for_entity(entity_type)

    if operation == 'create':
        create_id = _resolve_entity_id(entity_id, data)
        if create_id:
            existing = model.query.get(create_id)
            if existing:
                _apply_model_data(existing, data or {})
                db.session.flush()
                return existing.id

        entity = model()
        _apply_model_data(entity, data or {})
        db.session.add(entity)
        db.session.flush()
        return entity.id

    resolved_id = _resolve_entity_id(entity_id, data)
    if not resolved_id:
        raise ValueError('entity_id is required for update/delete')

    entity = model.query.get(resolved_id)
    if not entity and operation == 'delete':
        # Idempotent delete: already absent is treated as success.
        return resolved_id
    if not entity:
        raise ValueError(f'{model.__name__} with id {resolved_id} not found')

    if operation == 'delete':
        db.session.delete(entity)
        return resolved_id

    _validate_update_conflict(entity, data or {})
    _apply_model_data(entity, data or {})
    db.session.flush()
    return entity.id


def _validate_push_change(change):
    if not isinstance(change, dict):
        return 'Invalid change payload'

    if not change.get('entity_type'):
        return 'entity_type is required'

    operation = (change.get('operation') or '').lower()
    if operation not in {'create', 'update', 'delete'}:
        return 'operation must be one of create, update, delete'

    if operation in {'create', 'update'}:
        change_data = change.get('data', {})
        if not isinstance(change_data, dict):
            return 'data must be an object for create/update'

    return None


def _get_supported_models():
    from app.models.appointment import Appointment
    from app.models.medical_record import MedicalRecord
    from app.models.budget import Budget
    from app.models.payment import Payment
    from app.models.file import File

    return {
        'appointment': Appointment,
        'appointments': Appointment,
        'medical_record': MedicalRecord,
        'medical_records': MedicalRecord,
        'budget': Budget,
        'budgets': Budget,
        'payment': Payment,
        'payments': Payment,
        'file': File,
        'files': File,
    }


def _get_model_for_entity(entity_type):
    if not entity_type:
        raise ValueError('entity_type is required')

    model = _get_supported_models().get(entity_type.lower())
    if not model:
        supported = ', '.join(sorted({k for k in _get_supported_models().keys() if not k.endswith('s')}))
        raise ValueError(f'Unsupported entity_type: {entity_type}. Supported: {supported}')
    return model


def _resolve_entity_id(entity_id, data):
    raw_id = entity_id
    if raw_id in (None, '') and isinstance(data, dict):
        raw_id = data.get('id')

    if isinstance(raw_id, str) and raw_id.startswith('local-'):
        return None
    if raw_id in (None, ''):
        return None
    try:
        return int(raw_id)
    except (TypeError, ValueError):
        raise ValueError(f'Invalid entity_id: {raw_id}')


def _normalize_log_entity_id(entity_id):
    if entity_id in (None, ''):
        return 0
    if isinstance(entity_id, str) and entity_id.startswith('local-'):
        return 0
    try:
        return int(entity_id)
    except (TypeError, ValueError):
        return 0


def _build_idempotency_key(change):
    provided = change.get('idempotency_key')
    if provided:
        return str(provided)

    payload = {
        'entity_type': change.get('entity_type'),
        'entity_id': change.get('entity_id'),
        'operation': (change.get('operation') or '').lower(),
        'data': change.get('data', {})
    }
    canonical = json.dumps(payload, sort_keys=True, default=str, separators=(',', ':'))
    return hashlib.sha256(canonical.encode('utf-8')).hexdigest()


def _public_sync_error_message(exc):
    """Return a safe error message for API responses."""
    if isinstance(exc, ValueError):
        return str(exc)
    return 'Internal sync processing error'


def _validate_update_conflict(entity, incoming_data):
    if not isinstance(incoming_data, dict):
        return

    client_updated_raw = incoming_data.get('updated_at')
    if not client_updated_raw:
        return

    server_updated = getattr(entity, 'updated_at', None) or getattr(entity, 'created_at', None)
    if server_updated is None:
        return

    client_updated = _parse_iso_datetime(client_updated_raw)
    if server_updated > client_updated:
        raise SyncConflictError(
            'Conflict detected: server has a newer version',
            server_version=_serialize_model_instance(entity),
            client_version=incoming_data
        )


def _apply_model_data(entity, data):
    if not isinstance(data, dict):
        raise ValueError('data must be an object')

    protected_fields = {'id', 'created_at', 'updated_at'}
    columns = {column.name: column for column in entity.__table__.columns}

    for key, value in data.items():
        if key in protected_fields or key not in columns:
            continue
        setattr(entity, key, _coerce_column_value(columns[key], value))


def _coerce_column_value(column, value):
    if value is None:
        return None

    column_type = column.type

    if isinstance(column_type, DateTime):
        if isinstance(value, datetime):
            return value.replace(tzinfo=None)
        return _parse_iso_datetime(value)

    if isinstance(column_type, SQLDate):
        if isinstance(value, datetime):
            return value.date()
        if isinstance(value, date):
            return value
        if isinstance(value, str):
            return date.fromisoformat(value[:10])
        raise ValueError(f'Invalid date value for {column.name}')

    if isinstance(column_type, Integer):
        return int(value)

    if isinstance(column_type, Float):
        return float(value)

    if isinstance(column_type, Numeric):
        return Decimal(str(value))

    if isinstance(column_type, Boolean):
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            lowered = value.strip().lower()
            if lowered in {'true', '1', 'yes'}:
                return True
            if lowered in {'false', '0', 'no'}:
                return False
        return bool(value)

    if isinstance(column_type, JSON):
        if isinstance(value, str):
            return json.loads(value)
        return value

    return value


def _parse_iso_datetime(value):
    if isinstance(value, datetime):
        return value.replace(tzinfo=None)
    if not isinstance(value, str):
        raise ValueError('Invalid datetime value')

    normalized = value.replace('Z', '+00:00')
    parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is not None:
        parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)
    return parsed


def _serialize_value(value):
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, Decimal):
        return str(value)
    return value


def _serialize_model_instance(entity):
    payload = {}
    for column in entity.__table__.columns:
        payload[column.name] = _serialize_value(getattr(entity, column.name))
    return payload
