# -*- coding: utf-8 -*-
"""
Synchronization endpoints - Cloud-local sync operations
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app.models.sync_log import SyncLog
from app.extensions import db

blueprint = Blueprint('sync', __name__, url_prefix='/api/sync')


@blueprint.route('/push', methods=['POST'])
@jwt_required()
def push_to_cloud():
    """Push local changes to cloud"""
    current_user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    changes = data.get('changes', [])
    synced = []
    conflicts = []

    for change in changes:
        entity_type = change.get('entity_type')
        entity_id = change.get('entity_id')
        operation = change.get('operation')
        entity_data = change.get('data', {})

        # Create sync log
        sync_log = SyncLog(
            entity_type=entity_type,
            entity_id=entity_id if not str(entity_id).startswith('local-') else 0,
            operation=operation,
            direction='local_to_cloud',
            status='pending'
        )

        try:
            # Process the change based on entity type
            # This is simplified - in production you'd have proper handlers
            server_id = process_sync_change(entity_type, operation, entity_data)

            sync_log.status = 'completed'
            sync_log.completed_at = datetime.utcnow()

            synced.append({
                'local_id': entity_id,
                'server_id': server_id
            })

        except Exception as e:
            sync_log.status = 'failed'
            sync_log.error_message = str(e)
            conflicts.append({
                'local_id': entity_id,
                'error': str(e)
            })

        db.session.add(sync_log)

    db.session.commit()

    return jsonify({
        'synced': synced,
        'conflicts': conflicts
    }), 200


@blueprint.route('/pull', methods=['GET'])
@jwt_required()
def pull_from_cloud():
    """Pull cloud changes to local"""
    current_user_id = int(get_jwt_identity())
    since = request.args.get('since')

    # Parse timestamp
    if since:
        try:
            since_date = datetime.fromisoformat(since)
        except ValueError:
            return jsonify({'msg': 'Invalid date format'}), 400
    else:
        # Default to last 24 hours
        from datetime import timedelta
        since_date = datetime.utcnow() - timedelta(days=1)

    # Get changes since timestamp
    # This is simplified - in production you'd query actual changes
    changes = []

    # Example: Get recent appointments
    from app.models.appointment import Appointment
    appointments = Appointment.query.filter(
        Appointment.updated_at >= since_date
    ).all()

    for appointment in appointments:
        changes.append({
            'entity_type': 'appointment',
            'operation': 'update',
            'data': {
                'id': appointment.id,
                'patient_id': appointment.patient_id,
                'professional_id': appointment.professional_id,
                'appointment_date': appointment.appointment_date.isoformat(),
                'status': appointment.status
            }
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
@jwt_required()
def get_sync_logs():
    """Get sync logs"""
    limit = request.args.get('limit', 50, type=int)

    logs = SyncLog.query.order_by(
        db.desc(SyncLog.created_at)
    ).limit(limit).all()

    return jsonify([{
        'id': log.id,
        'entity_type': log.entity_type,
        'entity_id': log.entity_id,
        'operation': log.operation,
        'direction': log.direction,
        'status': log.status,
        'error_message': log.error_message,
        'created_at': log.created_at.isoformat()
    } for log in logs]), 200


def process_sync_change(entity_type, operation, data):
    """
    Process a sync change
    This is a simplified version - in production you'd have proper handlers
    """
    # This would handle creating/updating entities based on type
    # For now, return a mock server ID
    import random
    return random.randint(1000, 9999)
