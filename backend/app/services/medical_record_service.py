# -*- coding: utf-8 -*-
"""
Medical Record Service - Business logic for medical records
"""

from app.models.medical_record import MedicalRecord
from app.extensions import db
from app.services.access_scope_service import AccessScopeService
from app.services.exceptions import AccessDeniedError, ResourceNotFoundError, ValidationError


class MedicalRecordService:
    """Medical record management business logic"""

    @staticmethod
    def get_patient_medical_history(patient_id):
        """Get complete medical history for a patient"""
        return MedicalRecord.query.filter_by(patient_id=patient_id).order_by(
            MedicalRecord.record_date.desc()
        ).all()

    @staticmethod
    def list_medical_records(current_user_id, patient_id=None, professional_id=None):
        """List medical records with optional filters."""
        current_user = AccessScopeService.get_user_or_raise(current_user_id)
        query = MedicalRecord.query

        if current_user.role == 'patient':
            query = query.filter_by(patient_id=current_user.id)
        elif current_user.role == 'professional':
            scoped_patient_ids = list(AccessScopeService.get_professional_patient_ids(current_user.id))
            if not scoped_patient_ids:
                return []
            query = query.filter(MedicalRecord.patient_id.in_(scoped_patient_ids))
        elif current_user.role != 'admin':
            raise AccessDeniedError('Unauthorized')

        if patient_id:
            AccessScopeService.ensure_patient_access_scope(current_user.id, patient_id)
            query = query.filter_by(patient_id=patient_id)
        if professional_id and current_user.role == 'admin':
            query = query.filter_by(professional_id=professional_id)

        return (
            query.options(db.subqueryload(MedicalRecord.files))
            .order_by(db.desc(MedicalRecord.record_date))
            .all()
        )

    @staticmethod
    def get_medical_record(record_id, current_user_id):
        """Get medical record by ID."""
        current_user = AccessScopeService.get_user_or_raise(current_user_id)
        record = MedicalRecord.query.get(record_id)
        if not record:
            raise ResourceNotFoundError('Medical record not found')

        if current_user.role == 'admin':
            return record

        if current_user.role == 'patient':
            if record.patient_id != current_user.id:
                raise AccessDeniedError('Unauthorized')
            return record

        if current_user.role == 'professional':
            AccessScopeService.ensure_patient_access_scope(current_user.id, record.patient_id)
            return record

        raise AccessDeniedError('Unauthorized')
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
    def update_medical_record(record_id, data, current_user_id):
        """Update medical record."""
        current_user = AccessScopeService.get_user_or_raise(current_user_id)
        record = MedicalRecordService.get_medical_record(record_id, current_user_id)

        if current_user.role == 'professional' and record.professional_id != current_user.id:
            raise AccessDeniedError('Only the owner professional can update this record')
        if current_user.role == 'patient':
            raise AccessDeniedError('Patients cannot update medical records')

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
    def delete_medical_record(record_id, current_user_id):
        """Delete medical record."""
        current_user = AccessScopeService.get_user_or_raise(current_user_id)
        record = MedicalRecordService.get_medical_record(record_id, current_user_id)

        if current_user.role == 'professional' and record.professional_id != current_user.id:
            raise AccessDeniedError('Only the owner professional can delete this record')
        if current_user.role == 'patient':
            raise AccessDeniedError('Patients cannot delete medical records')

        db.session.delete(record)
        db.session.commit()
