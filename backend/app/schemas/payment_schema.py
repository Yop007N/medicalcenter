# -*- coding: utf-8 -*-
"""
Payment Schema - Serialization for Payment model
"""

from marshmallow import fields, validate, post_dump
from app.extensions import ma
from app.models.payment import Payment
from app.utils.helpers import normalize_currency_code


class PaymentSchema(ma.SQLAlchemyAutoSchema):
    """Payment schema for serialization"""

    class Meta:
        model = Payment
        load_instance = True
        include_fk = True

    payment_status = fields.Str(
        validate=validate.OneOf(['pending', 'completed', 'failed', 'refunded'])
    )

    payment_method = fields.Str(
        validate=validate.OneOf(['cash', 'card', 'transfer', 'insurance', 'check', 'other'])
    )

    # Add transaction_reference as alias for frontend compatibility
    transaction_reference = fields.Method('get_transaction_reference', dump_only=True)

    def get_transaction_reference(self, obj):
        """Return transaction_id as transaction_reference for frontend"""
        return obj.transaction_id

    @post_dump
    def normalize_currency(self, data, **kwargs):
        """Normalize legacy currency codes in serialized payload."""
        data['currency'] = normalize_currency_code(data.get('currency'))
        return data
