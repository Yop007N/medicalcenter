# -*- coding: utf-8 -*-
"""
Audit Service - Comprehensive audit logging for healthcare compliance
"""

from datetime import datetime, timedelta
from flask import request, has_request_context
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from app.extensions import db
from app.models.audit_log import AuditLog
from app.models.user import User
from sqlalchemy import func, and_, or_


class AuditService:
    """Service for managing audit logs and compliance tracking"""

    # Sensitive entities that require special tracking
    SENSITIVE_ENTITIES = {
        'medical_record',
        'patient',
        'file',
        'psychological_evaluation',
        'therapy_session',
        'psychopedagogical_evaluation',
        'intervention_session'
    }

    # Actions that involve data export
    EXPORT_ACTIONS = {'EXPORT', 'DOWNLOAD', 'BULK_EXPORT'}

    @staticmethod
    def log_action(action, entity_type=None, entity_id=None, description=None,
                   changes=None, metadata=None, status_code=200, success=True,
                   error_message=None):
        """
        Log an action to the audit trail

        Args:
            action: Action type (CREATE, READ, UPDATE, DELETE, LOGIN, etc.)
            entity_type: Type of entity affected (patient, appointment, etc.)
            entity_id: ID of entity affected
            description: Human-readable description
            changes: Dictionary with before/after values for updates
            metadata: Additional context data
            status_code: HTTP status code
            success: Whether action succeeded
            error_message: Error details if failed

        Returns:
            AuditLog instance
        """
        try:
            # Get user info
            user_id, user_email, user_role = AuditService._get_user_info()

            # Get request context
            ip_address, user_agent, method, path, query = AuditService._get_request_info()

            # Determine if sensitive data
            is_sensitive = entity_type in AuditService.SENSITIVE_ENTITIES
            is_export = action in AuditService.EXPORT_ACTIONS

            # Create audit log
            audit_log = AuditLog(
                user_id=user_id,
                user_email=user_email,
                user_role=user_role,
                action=action,
                entity_type=entity_type,
                entity_id=entity_id,
                description=description,
                changes=changes,
                extra_data=metadata,  # Using extra_data instead of metadata (reserved keyword)
                timestamp=datetime.utcnow(),
                ip_address=ip_address,
                user_agent=user_agent,
                request_method=method,
                request_path=path,
                request_query=query,
                status_code=status_code,
                success=success,
                error_message=error_message,
                sensitive_data_access=is_sensitive,
                export_action=is_export
            )

            db.session.add(audit_log)
            db.session.commit()

            return audit_log

        except Exception as e:
            # Don't fail the main request if audit logging fails
            # But log the error
            print(f"Audit logging error: {str(e)}")
            db.session.rollback()
            return None

    @staticmethod
    def log_login(email, success, reason=None, user_id=None):
        """Log login attempt"""
        return AuditService.log_action(
            action='LOGIN',
            description=f"{'Successful' if success else 'Failed'} login attempt for {email}",
            metadata={'email': email, 'reason': reason},
            success=success,
            status_code=200 if success else 401
        )

    @staticmethod
    def log_logout(user_id, user_email):
        """Log logout"""
        return AuditService.log_action(
            action='LOGOUT',
            description=f"User {user_email} logged out",
            success=True
        )

    @staticmethod
    def log_create(entity_type, entity_id, description=None, metadata=None):
        """Log entity creation"""
        desc = description or f"Created {entity_type} with ID {entity_id}"
        return AuditService.log_action(
            action='CREATE',
            entity_type=entity_type,
            entity_id=entity_id,
            description=desc,
            metadata=metadata,
            status_code=201
        )

    @staticmethod
    def log_read(entity_type, entity_id=None, description=None, metadata=None):
        """Log entity read/view"""
        if entity_id:
            desc = description or f"Viewed {entity_type} with ID {entity_id}"
        else:
            desc = description or f"Listed {entity_type} entities"

        return AuditService.log_action(
            action='READ',
            entity_type=entity_type,
            entity_id=entity_id,
            description=desc,
            metadata=metadata
        )

    @staticmethod
    def log_update(entity_type, entity_id, changes=None, description=None, metadata=None):
        """Log entity update with before/after values"""
        desc = description or f"Updated {entity_type} with ID {entity_id}"
        return AuditService.log_action(
            action='UPDATE',
            entity_type=entity_type,
            entity_id=entity_id,
            description=desc,
            changes=changes,
            metadata=metadata
        )

    @staticmethod
    def log_delete(entity_type, entity_id, description=None, metadata=None):
        """Log entity deletion"""
        desc = description or f"Deleted {entity_type} with ID {entity_id}"
        return AuditService.log_action(
            action='DELETE',
            entity_type=entity_type,
            entity_id=entity_id,
            description=desc,
            metadata=metadata
        )

    @staticmethod
    def log_export(entity_type, record_count, description=None, metadata=None):
        """Log data export"""
        desc = description or f"Exported {record_count} {entity_type} records"
        return AuditService.log_action(
            action='EXPORT',
            entity_type=entity_type,
            description=desc,
            metadata={**(metadata or {}), 'record_count': record_count}
        )

    @staticmethod
    def log_unauthorized_access(resource, reason='Not authenticated'):
        """Log unauthorized access attempt"""
        return AuditService.log_action(
            action='UNAUTHORIZED_ACCESS',
            description=f"Unauthorized access to {resource}",
            metadata={'resource': resource, 'reason': reason},
            status_code=401,
            success=False
        )

    @staticmethod
    def log_forbidden_action(action_desc, reason='Insufficient permissions'):
        """Log forbidden action (authenticated but not authorized)"""
        return AuditService.log_action(
            action='FORBIDDEN',
            description=f"Forbidden action: {action_desc}",
            metadata={'reason': reason},
            status_code=403,
            success=False
        )

    @staticmethod
    def get_audit_logs(filters=None, page=1, per_page=50):
        """
        Get audit logs with filtering

        Args:
            filters: Dictionary with filter criteria
            page: Page number
            per_page: Items per page

        Returns:
            Paginated audit logs
        """
        query = AuditLog.query

        if filters:
            if 'user_id' in filters:
                query = query.filter_by(user_id=filters['user_id'])

            if 'action' in filters:
                query = query.filter_by(action=filters['action'])

            if 'entity_type' in filters:
                query = query.filter_by(entity_type=filters['entity_type'])

            if 'entity_id' in filters:
                query = query.filter_by(entity_id=filters['entity_id'])

            if 'success' in filters:
                query = query.filter_by(success=filters['success'])

            if 'sensitive_data_access' in filters:
                query = query.filter_by(sensitive_data_access=filters['sensitive_data_access'])

            if 'export_action' in filters:
                query = query.filter_by(export_action=filters['export_action'])

            if 'start_date' in filters:
                query = query.filter(AuditLog.timestamp >= filters['start_date'])

            if 'end_date' in filters:
                query = query.filter(AuditLog.timestamp <= filters['end_date'])

            if 'user_email' in filters:
                query = query.filter(AuditLog.user_email.ilike(f"%{filters['user_email']}%"))

        # Order by timestamp descending
        query = query.order_by(AuditLog.timestamp.desc())

        return query.paginate(page=page, per_page=per_page, error_out=False)

    @staticmethod
    def get_entity_history(entity_type, entity_id):
        """Get complete audit history for a specific entity"""
        return AuditLog.query.filter_by(
            entity_type=entity_type,
            entity_id=entity_id
        ).order_by(AuditLog.timestamp.desc()).all()

    @staticmethod
    def get_user_activity(user_id, days=30):
        """Get user activity for the last N days"""
        since = datetime.utcnow() - timedelta(days=days)
        return AuditLog.query.filter(
            AuditLog.user_id == user_id,
            AuditLog.timestamp >= since
        ).order_by(AuditLog.timestamp.desc()).all()

    @staticmethod
    def get_compliance_report(start_date, end_date):
        """
        Generate compliance report for healthcare regulations

        Returns statistics on sensitive data access, exports, etc.
        """
        logs = AuditLog.query.filter(
            AuditLog.timestamp >= start_date,
            AuditLog.timestamp <= end_date
        ).all()

        report = {
            'period': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat()
            },
            'total_actions': len(logs),
            'by_action': {},
            'by_user': {},
            'sensitive_data_accesses': 0,
            'export_actions': 0,
            'failed_actions': 0,
            'unauthorized_attempts': 0,
            'top_accessed_entities': {}
        }

        for log in logs:
            # Count by action
            report['by_action'][log.action] = report['by_action'].get(log.action, 0) + 1

            # Count by user
            if log.user_email:
                report['by_user'][log.user_email] = report['by_user'].get(log.user_email, 0) + 1

            # Sensitive data tracking
            if log.sensitive_data_access:
                report['sensitive_data_accesses'] += 1

            # Export tracking
            if log.export_action:
                report['export_actions'] += 1

            # Failed actions
            if not log.success:
                report['failed_actions'] += 1

            # Unauthorized attempts
            if log.action in ['UNAUTHORIZED_ACCESS', 'FORBIDDEN']:
                report['unauthorized_attempts'] += 1

            # Entity access tracking
            if log.entity_type:
                key = f"{log.entity_type}:{log.entity_id}" if log.entity_id else log.entity_type
                report['top_accessed_entities'][key] = report['top_accessed_entities'].get(key, 0) + 1

        # Sort top entities
        report['top_accessed_entities'] = dict(
            sorted(report['top_accessed_entities'].items(), key=lambda x: x[1], reverse=True)[:10]
        )

        return report

    @staticmethod
    def cleanup_old_logs(days=365):
        """
        Clean up audit logs older than specified days
        (Keep at least 1 year for compliance)

        Args:
            days: Keep logs from last N days

        Returns:
            Number of deleted logs
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        deleted_count = AuditLog.query.filter(
            AuditLog.timestamp < cutoff_date
        ).delete()

        db.session.commit()
        return deleted_count

    @staticmethod
    def _get_user_info():
        """Get current user information from JWT"""
        try:
            if has_request_context():
                try:
                    verify_jwt_in_request(optional=True)
                    user_id = get_jwt_identity()

                    if user_id:
                        user = User.query.get(int(user_id))
                        if user:
                            return int(user_id), user.email, user.role

                except Exception:
                    pass

            return None, 'Anonymous', 'anonymous'

        except Exception:
            return None, 'System', 'system'

    @staticmethod
    def _get_request_info():
        """Get request context information"""
        if not has_request_context():
            return None, None, None, None, None

        # IP Address
        ip = request.headers.get('X-Forwarded-For', '').split(',')[0].strip() \
            or request.headers.get('X-Real-IP') \
            or request.remote_addr \
            or 'Unknown'

        # User Agent
        user_agent = request.headers.get('User-Agent', 'Unknown')[:500]

        # Request details
        method = request.method
        path = request.path
        query = request.query_string.decode('utf-8') if request.query_string else None

        return ip, user_agent, method, path, query


# Singleton instance
audit_service = AuditService()
