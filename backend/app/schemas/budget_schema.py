# -*- coding: utf-8 -*-
"""
Budget Schema - Serialization for Budget model
"""

from marshmallow import fields, validate, post_dump
from sqlalchemy import func
from app.extensions import ma
from app.models.budget import Budget
from app.models.payment import Payment


class BudgetSchema(ma.SQLAlchemyAutoSchema):
    """Budget schema for serialization"""

    class Meta:
        model = Budget
        load_instance = True
        include_fk = True

    status = fields.Str(
        validate=validate.OneOf(['draft', 'sent', 'accepted', 'rejected', 'expired'])
    )

    # Calculated field for total paid amount
    total_paid = fields.Method('get_total_paid', dump_only=True)
    payments_count = fields.Method('get_payments_count', dump_only=True)

    def get_total_paid(self, obj):
        """Calculate total amount paid for this budget"""
        if not obj.id:
            return 0
        total = Payment.query.filter_by(
            budget_id=obj.id,
            payment_status='completed'
        ).with_entities(func.sum(Payment.amount)).scalar()
        return float(total) if total else 0

    def get_payments_count(self, obj):
        """Count payments for this budget"""
        if not obj.id:
            return 0
        return Payment.query.filter_by(budget_id=obj.id).count()
