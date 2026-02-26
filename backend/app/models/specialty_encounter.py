# -*- coding: utf-8 -*-
"""Specialty encounter model for non-odontology/mental-health modules."""

from datetime import datetime

from app.extensions import db
from app.models.sync_versioning import register_sync_version_listener


class SpecialtyEncounter(db.Model):
    """Clinical encounter captured in a specialty module context."""

    __tablename__ = 'specialty_encounters'

    __table_args__ = (
        db.Index('ix_specialty_encounters_professional_date', 'professional_id', 'visit_date'),
        db.Index('ix_specialty_encounters_specialty_date', 'specialty_key', 'visit_date'),
        db.Index('ix_specialty_encounters_patient_date', 'patient_id', 'visit_date'),
    )

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False, index=True)
    professional_id = db.Column(
        db.Integer, db.ForeignKey('professionals.id'), nullable=False, index=True
    )
    specialty_key = db.Column(db.String(64), nullable=False, index=True)

    visit_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)
    status = db.Column(db.String(30), nullable=False, default='open')

    chief_complaint = db.Column(db.Text, nullable=False)
    diagnosis = db.Column(db.Text)
    assessment = db.Column(db.Text)
    plan = db.Column(db.Text)
    notes = db.Column(db.Text)

    vitals = db.Column(db.JSON)
    payload = db.Column(db.JSON)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    sync_version = db.Column(db.Integer, nullable=False, default=1)

    patient = db.relationship('Patient', backref=db.backref('specialty_encounters', lazy='dynamic'))
    professional = db.relationship(
        'Professional', backref=db.backref('specialty_encounters', lazy='dynamic')
    )

    def __repr__(self):
        return (
            f'<SpecialtyEncounter {self.id} '
            f'specialty={self.specialty_key} patient={self.patient_id}>'
        )


register_sync_version_listener(SpecialtyEncounter)
