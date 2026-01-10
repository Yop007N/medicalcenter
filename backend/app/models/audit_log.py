# -*- coding: utf-8 -*-
"""
Audit Log Model - Tracking all system actions for compliance
"""

from datetime import datetime
from app.extensions import db


class AuditLog(db.Model):
    """
    Audit log for tracking all system actions
    Essential for healthcare compliance (HIPAA, etc.)
    """
    __tablename__ = 'audit_logs'

    # Composite indexes for optimized queries
    __table_args__ = (
        db.Index('idx_audit_user_timestamp', 'user_id', 'timestamp'),
        db.Index('idx_audit_entity', 'entity_type', 'entity_id'),
        db.Index('idx_audit_action_timestamp', 'action', 'timestamp'),
        db.Index('idx_audit_timestamp', 'timestamp'),
    )

    id = db.Column(db.Integer, primary_key=True)

    # Who performed the action
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    user_email = db.Column(db.String(255))  # Stored for audit trail even if user deleted
    user_role = db.Column(db.String(50))

    # What action was performed
    action = db.Column(db.String(50), nullable=False)  # CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, etc.
    entity_type = db.Column(db.String(100))  # patient, medical_record, appointment, etc.
    entity_id = db.Column(db.Integer)  # ID of the affected entity

    # Details of the action
    description = db.Column(db.Text)  # Human-readable description
    changes = db.Column(db.JSON)  # JSON with before/after values for UPDATE actions
    extra_data = db.Column(db.JSON)  # Additional context (filters used, search params, etc.)

    # When and where
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    ip_address = db.Column(db.String(45))  # IPv6 support
    user_agent = db.Column(db.String(500))

    # Request details
    request_method = db.Column(db.String(10))  # GET, POST, PUT, DELETE
    request_path = db.Column(db.String(500))
    request_query = db.Column(db.Text)  # Query parameters

    # Result
    status_code = db.Column(db.Integer)  # HTTP status code
    success = db.Column(db.Boolean, default=True, nullable=False)
    error_message = db.Column(db.Text)  # Error details if failed

    # Compliance flags
    sensitive_data_access = db.Column(db.Boolean, default=False)  # Flag for accessing PHI
    export_action = db.Column(db.Boolean, default=False)  # Flag for data exports

    def __repr__(self):
        return f'<AuditLog {self.id}: {self.action} on {self.entity_type} by {self.user_email}>'

    def to_dict(self):
        """Convert audit log to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_email': self.user_email,
            'user_role': self.user_role,
            'action': self.action,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'description': self.description,
            'changes': self.changes,
            'extra_data': self.extra_data,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'request_method': self.request_method,
            'request_path': self.request_path,
            'request_query': self.request_query,
            'status_code': self.status_code,
            'success': self.success,
            'error_message': self.error_message,
            'sensitive_data_access': self.sensitive_data_access,
            'export_action': self.export_action
        }
