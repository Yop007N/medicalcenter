# -*- coding: utf-8 -*-
"""
Budget Model - Treatment budgets and cost estimates
"""

from datetime import datetime
from app.extensions import db


class Budget(db.Model):
    """Budget model for treatment cost estimates"""

    __tablename__ = 'budgets'

    # Composite indexes for optimized queries
    __table_args__ = (
        db.Index('idx_budget_patient_created', 'patient_id', 'created_at'),
    )

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    # Budget details
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    total_amount = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(3), default='ARS')
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

    # Relationships
    payments = db.relationship('Payment', backref='budget', lazy='dynamic')

    def __repr__(self):
        return f'<Budget {self.id} - {self.title}>'
