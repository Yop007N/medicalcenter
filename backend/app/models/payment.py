# -*- coding: utf-8 -*-
"""
Payment Model - Payment transactions
"""

from datetime import datetime
from app.extensions import db
from app.models.sync_versioning import register_sync_version_listener


class Payment(db.Model):
    """Payment model for tracking financial transactions"""

    __tablename__ = 'payments'

    id = db.Column(db.Integer, primary_key=True)
    budget_id = db.Column(db.Integer, db.ForeignKey('budgets.id'), nullable=True)

    # Payment details
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(3), default='PYG')
    payment_method = db.Column(db.String(50))  # cash, card, transfer, insurance
    payment_status = db.Column(
        db.String(20),
        default='pending'
    )  # pending, completed, failed, refunded

    # Transaction info
    transaction_id = db.Column(db.String(100), unique=True)
    payment_date = db.Column(db.DateTime)
    notes = db.Column(db.Text)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    sync_version = db.Column(db.Integer, default=1, nullable=False)

    def __repr__(self):
        return f'<Payment {self.id} - {self.amount} {self.currency}>'


register_sync_version_listener(Payment)
