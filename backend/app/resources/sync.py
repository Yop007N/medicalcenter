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
from sqlalchemy.exc import IntegrityError
from sqlalchemy.sql.sqltypes import Date as SQLDate, DateTime, Integer, Float, Numeric, Boolean, JSON
from app.models.sync_log import SyncLog
from app.extensions import db
from app.resources.domain_errors import message_response
from app.utils.decorators import admin_required

blueprint = Blueprint('sync', __name__, url_prefix='/api/sync')

MAX_SYNC_CHANGES = 500
MAX_SYNC_LOGS_LIMIT = 500

ENTITY_CONFLICT_POLICIES = {
    'appointment': {'strategy': 'version_then_timestamp', 'resolution': 'server_wins'},
    'medical_record': {'strategy': 'version_then_timestamp', 'resolution': 'server_wins'},
    'budget': {'strategy': 'version_then_timestamp', 'resolution': 'server_wins'},
    'payment': {'strategy': 'version_then_timestamp', 'resolution': 'server_wins'},
    'file': {'strategy': 'version_only', 'resolution': 'server_wins'},
}


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
        return message_response('Invalid JSON body', 400)
    if not isinstance(data, dict):
        return message_response('Request body must be an object', 400)

    changes = data.get('changes', [])
    if not isinstance(changes, list):
        return message_response('changes must be an array', 400)
    if len(changes) > MAX_SYNC_CHANGES:
        return message_response(f'changes exceeds limit ({MAX_SYNC_CHANGES})', 400)

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

        entity_type = _canonical_entity_type(change.get('entity_type'))
        entity_id = change.get('entity_id')
        operation = (change.get('operation') or '').lower()
        entity_data = change.get('data', {})
        idempotency_key = _build_idempotency_key(change, entity_type)

        previous = SyncLog.query.filter_by(
            idempotency_key=idempotency_key,
            direction='local_to_cloud'
        ).order_by(db.desc(SyncLog.id)).first()
        if previous:
            replay = _build_idempotent_replay_response(previous, entity_id)
            if replay['synced']:
                synced.append(replay['synced'])
            else:
                conflicts.append(replay['conflict'])
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
        db.session.add(sync_log)

        try:
            # Reserve idempotency key before processing to make retries safe across nodes.
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            existing = SyncLog.query.filter_by(
                idempotency_key=idempotency_key,
                direction='local_to_cloud'
            ).order_by(db.desc(SyncLog.id)).first()
            if existing:
                replay = _build_idempotent_replay_response(existing, entity_id)
                if replay['synced']:
                    synced.append(replay['synced'])
                else:
                    conflicts.append(replay['conflict'])
            else:
                conflicts.append({
                    'local_id': entity_id,
                    'error': 'Unable to reserve idempotency key'
                })
            continue

        sync_log.status = 'in_progress'
        db.session.add(sync_log)
        db.session.commit()

        try:
            result = process_sync_change(entity_type, operation, entity_id, entity_data)

            sync_log.status = 'completed'
            sync_log.completed_at = datetime.utcnow()
            sync_log.result_entity_id = result['id']
            sync_log.result_entity_version = result['sync_version']
            sync_log.error_message = None
            sync_log.conflict_payload = None
            db.session.add(sync_log)
            db.session.commit()

            synced_payload = {
                'local_id': entity_id,
                'server_id': result['id']
            }
            if result['sync_version'] is not None:
                synced_payload['sync_version'] = result['sync_version']
            synced.append(synced_payload)

        except SyncConflictError as e:
            db.session.rollback()
            policy = _get_conflict_policy(entity_type)
            client_payload = e.client_version if isinstance(e.client_version, dict) else {}
            sync_log.status = 'failed'
            sync_log.error_message = str(e)
            sync_log.conflict_payload = {
                'conflict': True,
                'server_version': e.server_version,
                'client_version': e.client_version,
                'entity_type': entity_type,
                'strategy': policy['strategy'],
                'resolution': policy['resolution'],
                'server_sync_version': e.server_version.get('sync_version') if isinstance(e.server_version, dict) else None,
                'client_sync_version': client_payload.get('sync_version')
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
            return message_response('Invalid date format', 400)
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
            return message_response('limit must be an integer', 400)
    if limit < 1 or limit > MAX_SYNC_LOGS_LIMIT:
        return message_response(f'limit must be between 1 and {MAX_SYNC_LOGS_LIMIT}', 400)

    logs = SyncLog.query.order_by(
        db.desc(SyncLog.created_at)
    ).limit(limit).all()

    return jsonify([{
        'id': log.id,
        'entity_type': log.entity_type,
        'entity_id': log.entity_id,
        'external_entity_ref': log.external_entity_ref,
        'result_entity_id': log.result_entity_id,
        'result_entity_version': log.result_entity_version,
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

    canonical_entity_type = _canonical_entity_type(entity_type)
    model = _get_model_for_entity(canonical_entity_type)

    if operation == 'create':
        create_id = _resolve_entity_id(entity_id, data)
        if create_id:
            existing = model.query.get(create_id)
            if existing:
                _validate_update_conflict(canonical_entity_type, existing, data or {})
                _apply_model_data(existing, data or {})
                _bump_entity_sync_version(existing)
                db.session.flush()
                return _build_sync_result(existing.id, existing)

        entity = model()
        _apply_model_data(entity, data or {})
        _seed_entity_sync_version(entity, data or {})
        db.session.add(entity)
        db.session.flush()
        return _build_sync_result(entity.id, entity)

    resolved_id = _resolve_entity_id(entity_id, data)
    if not resolved_id:
        raise ValueError('entity_id is required for update/delete')

    entity = model.query.get(resolved_id)
    if not entity and operation == 'delete':
        # Idempotent delete: already absent is treated as success.
        return {'id': resolved_id, 'sync_version': None}
    if not entity:
        raise ValueError(f'{model.__name__} with id {resolved_id} not found')

    if operation == 'delete':
        result_version = _extract_sync_version(entity)
        db.session.delete(entity)
        return {'id': resolved_id, 'sync_version': result_version}

    _validate_update_conflict(canonical_entity_type, entity, data or {})
    _apply_model_data(entity, data or {})
    _bump_entity_sync_version(entity)
    db.session.flush()
    return _build_sync_result(entity.id, entity)


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
        'medical_record': MedicalRecord,
        'budget': Budget,
        'payment': Payment,
        'file': File,
    }


def _get_model_for_entity(entity_type):
    if not entity_type:
        raise ValueError('entity_type is required')

    model = _get_supported_models().get(_canonical_entity_type(entity_type))
    if not model:
        supported = ', '.join(sorted(_get_supported_models().keys()))
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


def _build_idempotency_key(change, canonical_entity_type):
    provided = change.get('idempotency_key')
    if provided:
        return str(provided)

    payload = {
        'entity_type': canonical_entity_type,
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


def _validate_update_conflict(entity_type, entity, incoming_data):
    if not isinstance(incoming_data, dict):
        return

    policy = _get_conflict_policy(entity_type)
    strategy = policy['strategy']
    client_version = _extract_sync_version(incoming_data)
    server_version = _extract_sync_version(entity)

    if strategy in {'version_only', 'version_then_timestamp'}:
        if server_version is not None and client_version is not None and server_version > client_version:
            raise SyncConflictError(
                'Conflict detected: server has a newer sync_version',
                server_version=_serialize_model_instance(entity),
                client_version=incoming_data
            )

    if strategy == 'version_only':
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


ENTITY_WRITABLE_FIELDS = {
    'appointment': {
        'patient_id', 'professional_id', 'appointment_date',
        'duration_minutes', 'status', 'appointment_type', 'reason', 'notes',
    },
    'medical_record': {
        'patient_id', 'professional_id', 'record_date', 'diagnosis',
        'treatment', 'notes', 'blood_pressure', 'heart_rate',
        'temperature', 'weight', 'height',
    },
    'budget': {
        'patient_id', 'created_by', 'title', 'description',
        'total_amount', 'currency', 'status', 'valid_until', 'items',
    },
    'payment': {
        'budget_id', 'amount', 'currency', 'payment_method',
        'payment_status', 'transaction_id', 'payment_date', 'notes',
    },
    'file': {
        'medical_record_id', 'filename', 'file_type', 'file_path',
        'description',
    },
}


def _apply_model_data(entity, data):
    if not isinstance(data, dict):
        raise ValueError('data must be an object')

    table_name = entity.__table__.name
    entity_type = _canonical_entity_type(table_name.rstrip('s'))
    writable = ENTITY_WRITABLE_FIELDS.get(entity_type)
    if writable is None:
        raise ValueError(f'No writable fields defined for {entity_type}')

    columns = {column.name: column for column in entity.__table__.columns}

    for key, value in data.items():
        if key not in writable or key not in columns:
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


def _canonical_entity_type(entity_type):
    if not entity_type:
        return ''

    normalized = str(entity_type).strip().lower()
    aliases = {
        'appointments': 'appointment',
        'medical_records': 'medical_record',
        'budgets': 'budget',
        'payments': 'payment',
        'files': 'file',
    }
    return aliases.get(normalized, normalized)


def _get_conflict_policy(entity_type):
    canonical = _canonical_entity_type(entity_type)
    return ENTITY_CONFLICT_POLICIES.get(
        canonical,
        {'strategy': 'version_then_timestamp', 'resolution': 'server_wins'}
    )


def _extract_sync_version(source):
    if source is None:
        return None

    raw_value = source.get('sync_version') if isinstance(source, dict) else getattr(source, 'sync_version', None)
    if raw_value in (None, ''):
        return None
    try:
        return int(raw_value)
    except (TypeError, ValueError):
        raise ValueError('sync_version must be an integer')


def _seed_entity_sync_version(entity, incoming_data):
    if not hasattr(entity, 'sync_version'):
        return

    incoming_version = _extract_sync_version(incoming_data)
    entity.sync_version = max(1, incoming_version) if incoming_version is not None else 1


def _bump_entity_sync_version(entity):
    if not hasattr(entity, 'sync_version'):
        return

    current = _extract_sync_version(entity)
    entity.sync_version = (current or 1) + 1


def _build_sync_result(entity_id, entity):
    return {
        'id': entity_id,
        'sync_version': _extract_sync_version(entity)
    }


def _build_idempotent_replay_response(previous_log, local_id):
    if previous_log.status == 'completed':
        payload = {
            'local_id': local_id,
            'server_id': previous_log.result_entity_id or previous_log.entity_id,
            'idempotent': True
        }
        if previous_log.result_entity_version is not None:
            payload['sync_version'] = previous_log.result_entity_version
        return {'synced': payload, 'conflict': None}

    if previous_log.status in {'pending', 'in_progress'}:
        return {
            'synced': None,
            'conflict': {
                'local_id': local_id,
                'error': 'Sync operation already in progress for idempotency_key',
                'idempotent': True
            }
        }

    return {
        'synced': None,
        'conflict': {
            'local_id': local_id,
            'error': _safe_replay_error_message(previous_log.error_message, previous_log.conflict_payload),
            'conflict': previous_log.conflict_payload,
            'idempotent': True
        }
    }


def _safe_replay_error_message(error_message, conflict_payload):
    if conflict_payload:
        return error_message or 'Conflict detected'

    if not error_message:
        return 'Internal sync processing error'

    safe_prefixes = (
        'Unsupported entity_type',
        'Invalid entity_id',
        'entity_id is required',
        'operation must be one of',
        'sync_version must be an integer',
    )
    if error_message.startswith(safe_prefixes):
        return error_message

    return 'Internal sync processing error'
