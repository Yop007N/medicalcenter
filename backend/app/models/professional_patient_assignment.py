# -*- coding: utf-8 -*-
"""Professional-patient assignment model."""

from datetime import datetime

from app.extensions import db


class ProfessionalPatientAssignment(db.Model):
    """Explicit ownership/assignment between a professional and a patient."""

    __tablename__ = 'professional_patient_assignments'

    professional_id = db.Column(
        db.Integer,
        db.ForeignKey('professionals.id', ondelete='CASCADE'),
        primary_key=True,
    )
    patient_id = db.Column(
        db.Integer,
        db.ForeignKey('patients.id', ondelete='CASCADE'),
        primary_key=True,
    )
    assigned_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    professional = db.relationship(
        'Professional',
        backref=db.backref(
            'patient_assignments',
            lazy='dynamic',
            cascade='all, delete-orphan',
            passive_deletes=True,
        ),
    )
    patient = db.relationship(
        'Patient',
        backref=db.backref(
            'professional_assignments',
            lazy='dynamic',
            cascade='all, delete-orphan',
            passive_deletes=True,
        ),
    )

    def __repr__(self):
        return f'<ProfessionalPatientAssignment professional={self.professional_id} patient={self.patient_id}>'
