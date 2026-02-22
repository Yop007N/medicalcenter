# -*- coding: utf-8 -*-
"""
Appointment Model - Medical appointments/consultations
"""

from datetime import datetime
from app.extensions import db


class Appointment(db.Model):
    """Appointment model for scheduling patient consultations"""

    __tablename__ = 'appointments'

    # Composite indexes for optimized queries
    __table_args__ = (
        db.Index('idx_professional_date', 'professional_id', 'appointment_date'),
        db.Index('idx_patient_date', 'patient_id', 'appointment_date'),
        db.Index('idx_status_date', 'status', 'appointment_date'),
    )

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    professional_id = db.Column(db.Integer, db.ForeignKey('professionals.id'), nullable=False)

    # Appointment details
    appointment_date = db.Column(db.DateTime, nullable=False, index=True)
    duration_minutes = db.Column(db.Integer, default=30)
    status = db.Column(
        db.String(20),
        default='scheduled',
        nullable=False
    )  # scheduled, confirmed, completed, cancelled, no_show
    appointment_type = db.Column(db.String(50))  # consultation, follow_up, procedure, etc.

    # Additional info
    reason = db.Column(db.Text)
    notes = db.Column(db.Text)
    reminder_sent = db.Column(db.Boolean, default=False)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    medical_record = db.relationship('MedicalRecord', backref='appointment', uselist=False)

    def __repr__(self):
        return f'<Appointment {self.id} - {self.appointment_date}>'
