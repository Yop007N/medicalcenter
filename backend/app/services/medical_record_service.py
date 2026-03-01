# -*- coding: utf-8 -*-
"""
Medical Record Service - Business logic for medical records
"""

from app.models.medical_record import MedicalRecord
from app.models.professional import Professional
from app.models.professional_patient_assignment import ProfessionalPatientAssignment
from app.extensions import db
from app.services.access_scope_service import AccessScopeService
from app.services.exceptions import AccessDeniedError, ResourceNotFoundError, ValidationError
from app.services.specialty_module_service import SpecialtyModuleService


class MedicalRecordService:
    """Medical record management business logic"""

    @staticmethod
    def get_patient_medical_history(patient_id):
        """Get complete medical history for a patient"""
        return MedicalRecord.query.filter_by(patient_id=patient_id).order_by(
            MedicalRecord.record_date.desc()
        ).all()

    @staticmethod
    def list_medical_records(
        current_user_id,
        patient_id=None,
        professional_id=None,
        specialty_key=None,
    ):
        """List medical records with optional filters."""
        current_user = AccessScopeService.get_user_or_raise(current_user_id)
        query = MedicalRecord.query
        normalized_specialty_key = None
        scoped_professional_ids = None

        effective_specialty_key = specialty_key
        if current_user.role == 'professional' and not effective_specialty_key:
            effective_specialty_key = AccessScopeService.resolve_specialty_key(
                getattr(current_user, 'specialty', None)
            )

        if effective_specialty_key:
            normalized_specialty_key = AccessScopeService.normalize_text(effective_specialty_key)
            module = SpecialtyModuleService.get_module_by_key(normalized_specialty_key)
            if not module:
                raise ValidationError('Invalid specialty_key')
            normalized_specialty_key = module.get('key')
            scoped_professional_ids = sorted(
                SpecialtyModuleService.get_professional_ids_for_module(normalized_specialty_key)
            )

        if current_user.role == 'patient':
            query = query.filter_by(patient_id=current_user.id)
            if normalized_specialty_key:
                if not scoped_professional_ids:
                    return []
                query = query.filter(MedicalRecord.professional_id.in_(scoped_professional_ids))
        elif current_user.role == 'professional':
            if normalized_specialty_key:
                professional_specialty_key = AccessScopeService.resolve_specialty_key(
                    getattr(current_user, 'specialty', None)
                )
                if professional_specialty_key != normalized_specialty_key:
                    raise AccessDeniedError('Professional can only access own specialty records')
            scoped_patient_ids = list(
                AccessScopeService.get_professional_patient_ids(
                    current_user.id,
                    specialty_key=normalized_specialty_key,
                )
            )
            if not scoped_patient_ids:
                return []
            query = query.filter(MedicalRecord.patient_id.in_(scoped_patient_ids))
        elif current_user.role == 'admin':
            if normalized_specialty_key:
                if not scoped_professional_ids:
                    return []
                query = query.filter(MedicalRecord.professional_id.in_(scoped_professional_ids))
        else:
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
    def create_medical_record(data, current_user_id):
        """Create new medical record."""
        if 'patient_id' not in data:
            raise ValidationError('Missing required fields')

        current_user = AccessScopeService.get_user_or_raise(current_user_id)
        patient_id = data['patient_id']

        if current_user.role == 'professional':
            has_scope = AccessScopeService.professional_can_access_patient(current_user.id, patient_id)
            if has_scope:
                assignment = ProfessionalPatientAssignment.query.filter_by(
                    professional_id=current_user.id,
                    patient_id=patient_id,
                ).first()
                if assignment and not assignment.specialty_key:
                    assignment.specialty_key = AccessScopeService.resolve_specialty_key(
                        getattr(current_user, 'specialty', None)
                    )

            if not has_scope:
                # First clinical contact: if patient has no owner yet, auto-assign to this professional.
                has_any_assignment = ProfessionalPatientAssignment.query.filter_by(
                    patient_id=patient_id
                ).first() is not None
                if has_any_assignment:
                    raise AccessDeniedError('Professional can only create records for linked patients')

                db.session.add(
                    ProfessionalPatientAssignment(
                        professional_id=current_user.id,
                        patient_id=patient_id,
                        specialty_key=AccessScopeService.resolve_specialty_key(
                            getattr(current_user, 'specialty', None)
                        ),
                    )
                )
            professional_id = current_user.id
        elif current_user.role == 'admin':
            AccessScopeService.ensure_patient_access_scope(current_user.id, patient_id)
            professional_id = data.get('professional_id')
            if not professional_id:
                raise ValidationError('professional_id is required for admin')

            professional = Professional.query.get(professional_id)
            if not professional:
                raise ValidationError('Professional not found')
        else:
            raise AccessDeniedError('Unauthorized')

        record = MedicalRecord(
            patient_id=patient_id,
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
