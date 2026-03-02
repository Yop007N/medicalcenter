# -*- coding: utf-8 -*-
"""
Budget Model - Treatment budgets and cost estimates
"""

from datetime import datetime
from app.extensions import db
from app.models.sync_versioning import register_sync_version_listener


class Budget(db.Model):
    """Budget model for treatment cost estimates"""

    __tablename__ = 'budgets'

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    # Budget details
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    total_amount = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(3), default='PYG')
    status = db.Column(
        db.String(20),
        default='draft'
    )  # draft, sent, accepted, rejected, expired

    # Validity
    valid_until = db.Column(db.Date)

    # Items (stored as JSON)
    items = db.Column(db.JSON)  # [{description, quantity, unit_price, total}, ...]

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    sync_version = db.Column(db.Integer, default=1, nullable=False)

    # Relationships
    payments = db.relationship('Payment', backref='budget', lazy='dynamic')

    def __repr__(self):
        return f'<Budget {self.id} - {self.title}>'


register_sync_version_listener(Budget)
