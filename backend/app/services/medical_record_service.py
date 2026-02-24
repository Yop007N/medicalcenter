# -*- coding: utf-8 -*-
"""
Medical Record Service - Business logic for medical records
"""

from app.models.medical_record import MedicalRecord
from app.extensions import db
from app.services.exceptions import ResourceNotFoundError, ValidationError


class MedicalRecordService:
    """Medical record management business logic"""

    @staticmethod
    def get_patient_medical_history(patient_id):
        """Get complete medical history for a patient"""
        return MedicalRecord.query.filter_by(patient_id=patient_id).order_by(
            MedicalRecord.record_date.desc()
        ).all()

    @staticmethod
    def list_medical_records(patient_id=None, professional_id=None):
        """List medical records with optional filters."""
        query = MedicalRecord.query
        if patient_id:
            query = query.filter_by(patient_id=patient_id)
        if professional_id:
            query = query.filter_by(professional_id=professional_id)

        return (
            query.options(db.subqueryload(MedicalRecord.files))
            .order_by(db.desc(MedicalRecord.record_date))
            .all()
        )

    @staticmethod
    def get_medical_record(record_id):
        """Get medical record by ID."""
        record = MedicalRecord.query.get(record_id)
        if not record:
            raise ResourceNotFoundError('Medical record not found')
        return record

    @staticmethod
    def create_medical_record(data, professional_id):
        """Create new medical record."""
        if 'patient_id' not in data:
            raise ValidationError('Missing required fields')

        record = MedicalRecord(
            patient_id=data['patient_id'],
            professional_id=professional_id,
            appointment_id=data.get('appointment_id'),
            chief_complaint=data.get('chief_complaint'),
            symptoms=data.get('symptoms'),
            diagnosis=data.get('diagnosis'),
            treatment=data.get('treatment'),
            prescriptions=data.get('prescriptions'),
            notes=data.get('notes'),
            blood_pressure=data.get('blood_pressure'),
            heart_rate=data.get('heart_rate'),
            temperature=data.get('temperature'),
            weight=data.get('weight'),
            height=data.get('height'),
        )
        db.session.add(record)
        db.session.commit()
        return record

    @staticmethod
    def update_medical_record(record_id, data):
        """Update medical record."""
        record = MedicalRecord.query.get(record_id)
        if not record:
            raise ResourceNotFoundError('Medical record not found')

        updatable_fields = [
            'chief_complaint',
            'symptoms',
            'diagnosis',
            'treatment',
            'prescriptions',
            'notes',
            'blood_pressure',
            'heart_rate',
            'temperature',
            'weight',
            'height',
        ]
        for field in updatable_fields:
            if field in data:
                setattr(record, field, data[field])

        db.session.commit()
        return record

    @staticmethod
    def delete_medical_record(record_id):
        """Delete medical record."""
        record = MedicalRecord.query.get(record_id)
        if not record:
            raise ResourceNotFoundError('Medical record not found')

        db.session.delete(record)
        db.session.commit()
