# -*- coding: utf-8 -*-
"""
Medical Record Model - Clinical records for consultations
"""

from datetime import datetime
from app.extensions import db
from app.models.sync_versioning import register_sync_version_listener


class MedicalRecord(db.Model):
    """Medical record model for storing clinical consultation information"""

    __tablename__ = 'medical_records'

    # Composite indexes for optimized queries
    __table_args__ = (
        db.Index('idx_patient_record_date', 'patient_id', 'record_date'),
        db.Index('idx_professional_record_date', 'professional_id', 'record_date'),
    )

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    professional_id = db.Column(db.Integer, db.ForeignKey('professionals.id'), nullable=False)
    appointment_id = db.Column(db.Integer, db.ForeignKey('appointments.id'), nullable=True)

    # Clinical information
    record_date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    chief_complaint = db.Column(db.Text)  # Motivo de consulta
    symptoms = db.Column(db.Text)
    diagnosis = db.Column(db.Text)
    treatment = db.Column(db.Text)
    prescriptions = db.Column(db.Text)
    notes = db.Column(db.Text)

    # Vital signs
    blood_pressure = db.Column(db.String(20))
    heart_rate = db.Column(db.Integer)
    temperature = db.Column(db.Float)
    weight = db.Column(db.Float)
    height = db.Column(db.Float)

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    sync_version = db.Column(db.Integer, default=1, nullable=False)

    # Relationships
    # Bolt: Changed from 'dynamic' to 'select' to allow eager loading and prevent N+1 queries
    files = db.relationship('File', backref='medical_record', lazy='select')

    def __repr__(self):
        return f'<MedicalRecord {self.id} - Patient {self.patient_id}>'


register_sync_version_listener(MedicalRecord)
