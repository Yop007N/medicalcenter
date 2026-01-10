# -*- coding: utf-8 -*-
"""
Audit Log Schema - Serialization for AuditLog model
"""

from marshmallow import fields
from app.extensions import ma
from app.models.audit_log import AuditLog


class AuditLogSchema(ma.SQLAlchemyAutoSchema):
    """Audit log schema for serialization"""

    class Meta:
        model = AuditLog
        load_instance = True
        include_fk = True


# Schema instances
audit_log_schema = AuditLogSchema()
audit_logs_schema = AuditLogSchema(many=True)
