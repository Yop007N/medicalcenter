# -*- coding: utf-8 -*-
"""
Audit Log endpoints - Compliance and tracking
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.audit_service import audit_service
from app.schemas.audit_log_schema import audit_log_schema, audit_logs_schema
from app.utils.decorators import admin_required
from datetime import datetime, timedelta


blueprint = Blueprint('audit', __name__, url_prefix='/api/audit')


@blueprint.route('/logs', methods=['GET'])
@jwt_required()
@admin_required
def list_audit_logs():
    """
    List audit logs with filtering
    ---
    tags:
      - Audit
    security:
      - Bearer: []
    parameters:
      - name: user_id
        in: query
        type: integer
        description: Filter by user ID
      - name: action
        in: query
        type: string
        description: Filter by action type
      - name: entity_type
        in: query
        type: string
        description: Filter by entity type
      - name: entity_id
        in: query
        type: integer
        description: Filter by entity ID
      - name: success
        in: query
        type: boolean
        description: Filter by success status
      - name: sensitive_data_access
        in: query
        type: boolean
        description: Filter sensitive data access only
      - name: export_action
        in: query
        type: boolean
        description: Filter export actions only
      - name: start_date
        in: query
        type: string
        format: date
        description: Start date (YYYY-MM-DD)
      - name: end_date
        in: query
        type: string
        format: date
        description: End date (YYYY-MM-DD)
      - name: user_email
        in: query
        type: string
        description: Filter by user email (partial match)
      - name: page
        in: query
        type: integer
        default: 1
        description: Page number
      - name: per_page
        in: query
        type: integer
        default: 50
        description: Items per page
    responses:
      200:
        description: List of audit logs
      401:
        description: Unauthorized
      403:
        description: Forbidden - Admin only
    """
    # Build filters
    filters = {}

    if request.args.get('user_id'):
        filters['user_id'] = int(request.args.get('user_id'))

    if request.args.get('action'):
        filters['action'] = request.args.get('action')

    if request.args.get('entity_type'):
        filters['entity_type'] = request.args.get('entity_type')

    if request.args.get('entity_id'):
        filters['entity_id'] = int(request.args.get('entity_id'))

    if request.args.get('success') is not None:
        filters['success'] = request.args.get('success').lower() == 'true'

    if request.args.get('sensitive_data_access') is not None:
        filters['sensitive_data_access'] = request.args.get('sensitive_data_access').lower() == 'true'

    if request.args.get('export_action') is not None:
        filters['export_action'] = request.args.get('export_action').lower() == 'true'

    if request.args.get('start_date'):
        try:
            filters['start_date'] = datetime.fromisoformat(request.args.get('start_date'))
        except ValueError:
            return jsonify({'msg': 'Invalid start_date format. Use YYYY-MM-DD'}), 400

    if request.args.get('end_date'):
        try:
            filters['end_date'] = datetime.fromisoformat(request.args.get('end_date'))
        except ValueError:
            return jsonify({'msg': 'Invalid end_date format. Use YYYY-MM-DD'}), 400

    if request.args.get('user_email'):
        filters['user_email'] = request.args.get('user_email')

    # Pagination
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)

    # Get logs
    pagination = audit_service.get_audit_logs(filters=filters, page=page, per_page=per_page)

    # Log this access
    audit_service.log_read(
        entity_type='audit_log',
        description='Admin viewed audit logs',
        metadata=filters
    )

    return jsonify({
        'logs': audit_logs_schema.dump(pagination.items),
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': pagination.page,
        'per_page': pagination.per_page
    }), 200


@blueprint.route('/logs/<int:log_id>', methods=['GET'])
@jwt_required()
@admin_required
def get_audit_log(log_id):
    """
    Get specific audit log by ID
    ---
    tags:
      - Audit
    security:
      - Bearer: []
    parameters:
      - name: log_id
        in: path
        type: integer
        required: true
        description: Audit log ID
    responses:
      200:
        description: Audit log details
      404:
        description: Audit log not found
      401:
        description: Unauthorized
      403:
        description: Forbidden - Admin only
    """
    from app.models.audit_log import AuditLog

    log = AuditLog.query.get(log_id)

    if not log:
        return jsonify({'msg': 'Audit log not found'}), 404

    # Log this access
    audit_service.log_read(
        entity_type='audit_log',
        entity_id=log_id,
        description=f'Admin viewed audit log {log_id}'
    )

    return jsonify(audit_log_schema.dump(log)), 200


@blueprint.route('/entity/<string:entity_type>/<int:entity_id>/history', methods=['GET'])
@jwt_required()
@admin_required
def get_entity_history(entity_type, entity_id):
    """
    Get complete audit history for a specific entity
    ---
    tags:
      - Audit
    security:
      - Bearer: []
    parameters:
      - name: entity_type
        in: path
        type: string
        required: true
        description: Entity type (e.g., patient, medical_record)
      - name: entity_id
        in: path
        type: integer
        required: true
        description: Entity ID
    responses:
      200:
        description: Entity audit history
      401:
        description: Unauthorized
      403:
        description: Forbidden - Admin only
    """
    history = audit_service.get_entity_history(entity_type, entity_id)

    # Log this access
    audit_service.log_read(
        entity_type='audit_log',
        description=f'Admin viewed history for {entity_type}:{entity_id}',
        metadata={'entity_type': entity_type, 'entity_id': entity_id}
    )

    return jsonify(audit_logs_schema.dump(history)), 200


@blueprint.route('/user/<int:user_id>/activity', methods=['GET'])
@jwt_required()
@admin_required
def get_user_activity(user_id):
    """
    Get user activity for the last N days
    ---
    tags:
      - Audit
    security:
      - Bearer: []
    parameters:
      - name: user_id
        in: path
        type: integer
        required: true
        description: User ID
      - name: days
        in: query
        type: integer
        default: 30
        description: Number of days to look back
    responses:
      200:
        description: User activity logs
      401:
        description: Unauthorized
      403:
        description: Forbidden - Admin only
    """
    days = request.args.get('days', 30, type=int)

    activity = audit_service.get_user_activity(user_id, days=days)

    # Log this access
    audit_service.log_read(
        entity_type='audit_log',
        description=f'Admin viewed activity for user {user_id}',
        metadata={'user_id': user_id, 'days': days}
    )

    return jsonify(audit_logs_schema.dump(activity)), 200


@blueprint.route('/compliance/report', methods=['GET'])
@jwt_required()
@admin_required
def get_compliance_report():
    """
    Generate compliance report for healthcare regulations
    ---
    tags:
      - Audit
    security:
      - Bearer: []
    parameters:
      - name: start_date
        in: query
        type: string
        format: date
        required: true
        description: Report start date (YYYY-MM-DD)
      - name: end_date
        in: query
        type: string
        format: date
        required: true
        description: Report end date (YYYY-MM-DD)
    responses:
      200:
        description: Compliance report with statistics
      400:
        description: Invalid date format
      401:
        description: Unauthorized
      403:
        description: Forbidden - Admin only
    """
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')

    if not start_date_str or not end_date_str:
        return jsonify({'msg': 'start_date and end_date are required'}), 400

    try:
        start_date = datetime.fromisoformat(start_date_str)
        end_date = datetime.fromisoformat(end_date_str)
    except ValueError:
        return jsonify({'msg': 'Invalid date format. Use YYYY-MM-DD'}), 400

    report = audit_service.get_compliance_report(start_date, end_date)

    # Log report generation
    audit_service.log_export(
        entity_type='audit_log',
        record_count=report['total_actions'],
        description='Admin generated compliance report',
        metadata={'start_date': start_date_str, 'end_date': end_date_str}
    )

    return jsonify(report), 200


@blueprint.route('/cleanup', methods=['POST'])
@jwt_required()
@admin_required
def cleanup_old_logs():
    """
    Clean up old audit logs (keeps last 365 days minimum)
    ---
    tags:
      - Audit
    security:
      - Bearer: []
    parameters:
      - name: days
        in: query
        type: integer
        default: 365
        description: Keep logs from last N days (minimum 365 for compliance)
    responses:
      200:
        description: Cleanup completed
      400:
        description: Invalid days parameter
      401:
        description: Unauthorized
      403:
        description: Forbidden - Admin only
    """
    days = request.args.get('days', 365, type=int)

    # Enforce minimum retention for compliance
    if days < 365:
        return jsonify({'msg': 'Must keep at least 365 days of audit logs for compliance'}), 400

    deleted_count = audit_service.cleanup_old_logs(days=days)

    # Log cleanup action
    audit_service.log_action(
        action='CLEANUP',
        entity_type='audit_log',
        description=f'Admin cleaned up audit logs older than {days} days',
        metadata={'days': days, 'deleted_count': deleted_count}
    )

    return jsonify({
        'msg': f'Cleaned up {deleted_count} old audit logs',
        'deleted_count': deleted_count
    }), 200
