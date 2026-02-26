# -*- coding: utf-8 -*-
"""Service layer for specialty encounters."""

from datetime import datetime

from app.extensions import db
from app.models.specialty_encounter import SpecialtyEncounter
from app.services.access_scope_service import AccessScopeService
from app.services.exceptions import AccessDeniedError, ResourceNotFoundError, ValidationError
from app.services.specialty_module_service import SpecialtyModuleService


class SpecialtyEncounterService:
    """Business logic for specialty encounters by actor scope."""

    WRITABLE_ROLES = {'admin', 'professional'}
    ALLOWED_STATUSES = {'open', 'in_progress', 'closed'}

    @staticmethod
    def _parse_datetime(value, field_name='visit_date'):
        if value in (None, ''):
            return datetime.utcnow()
        if isinstance(value, datetime):
            return value
        try:
            return datetime.fromisoformat(str(value))
        except (TypeError, ValueError) as exc:
            raise ValidationError(f'Invalid {field_name} format. Use ISO datetime.') from exc

    @staticmethod
    def _resolve_current_user(current_user_id):
        user = AccessScopeService.get_user_or_raise(current_user_id)
        if user.role not in {'admin', 'professional', 'patient'}:
            raise AccessDeniedError('Unsupported actor role')
        return user

    @staticmethod
    def _resolve_specialty_key(requested_key, user):
        key = (requested_key or '').strip().lower()
        if not key:
            if user.role == 'professional':
                return SpecialtyModuleService.resolve_module(getattr(user, 'specialty', None))['key']
            raise ValidationError('specialty_key is required')

        catalog_keys = {item['key'] for item in SpecialtyModuleService.get_catalog()}
        if key not in catalog_keys:
            raise ValidationError('Invalid specialty_key')

        if user.role == 'professional':
            user_module_key = SpecialtyModuleService.resolve_module(
                getattr(user, 'specialty', None)
            )['key']
            # Let professional operate only on their specialty module.
            if key != user_module_key:
                raise AccessDeniedError('Professional can only operate inside their specialty module')
        return key

    @staticmethod
    def _ensure_patient_access(current_user_id, patient_id):
        try:
            patient_id = int(patient_id)
        except (TypeError, ValueError) as exc:
            raise ValidationError('Invalid patient_id') from exc

        AccessScopeService.ensure_patient_access_scope(current_user_id, patient_id)
        return patient_id

    @classmethod
    def list_encounters(cls, current_user_id, specialty_key=None, patient_id=None):
        user = cls._resolve_current_user(current_user_id)
        query = SpecialtyEncounter.query

        if user.role == 'professional':
            query = query.filter(SpecialtyEncounter.professional_id == user.id)
        elif user.role == 'patient':
            query = query.filter(SpecialtyEncounter.patient_id == user.id)

        if specialty_key:
            scoped_key = cls._resolve_specialty_key(specialty_key, user)
            query = query.filter(SpecialtyEncounter.specialty_key == scoped_key)

        if patient_id is not None:
            resolved_patient_id = cls._ensure_patient_access(current_user_id, patient_id)
            query = query.filter(SpecialtyEncounter.patient_id == resolved_patient_id)

        return query.order_by(SpecialtyEncounter.visit_date.desc()).limit(200).all()

    @classmethod
    def get_encounter(cls, encounter_id, current_user_id):
        encounter = SpecialtyEncounter.query.get(encounter_id)
        if not encounter:
            raise ResourceNotFoundError('Specialty encounter not found')

        user = cls._resolve_current_user(current_user_id)
        if user.role == 'professional' and encounter.professional_id != user.id:
            raise AccessDeniedError('Professional can only access own encounters')
        if user.role == 'patient' and encounter.patient_id != user.id:
            raise AccessDeniedError('Patient can only access own encounters')
        return encounter

    @classmethod
    def create_encounter(cls, current_user_id, data):
        user = cls._resolve_current_user(current_user_id)
        if user.role not in cls.WRITABLE_ROLES:
            raise AccessDeniedError('Only admin/professional can create encounters')

        patient_id = cls._ensure_patient_access(current_user_id, data.get('patient_id'))
        specialty_key = cls._resolve_specialty_key(data.get('specialty_key'), user)
        chief_complaint = (data.get('chief_complaint') or '').strip()
        if not chief_complaint:
            raise ValidationError('chief_complaint is required')

        if user.role == 'professional':
            professional_id = user.id
        else:
            professional_id = data.get('professional_id')
            try:
                professional_id = int(professional_id)
            except (TypeError, ValueError) as exc:
                raise ValidationError('professional_id is required for admin') from exc

        status = (data.get('status') or 'open').strip().lower()
        if status not in cls.ALLOWED_STATUSES:
            raise ValidationError('Invalid status')

        encounter = SpecialtyEncounter(
            patient_id=patient_id,
            professional_id=professional_id,
            specialty_key=specialty_key,
            visit_date=cls._parse_datetime(data.get('visit_date')),
            status=status,
            chief_complaint=chief_complaint,
            diagnosis=data.get('diagnosis'),
            assessment=data.get('assessment'),
            plan=data.get('plan'),
            notes=data.get('notes'),
            vitals=data.get('vitals') if isinstance(data.get('vitals'), dict) else None,
            payload=data.get('payload') if isinstance(data.get('payload'), dict) else None,
        )
        db.session.add(encounter)
        db.session.commit()
        return encounter

    @classmethod
    def update_encounter(cls, encounter_id, current_user_id, data):
        encounter = cls.get_encounter(encounter_id, current_user_id)
        user = cls._resolve_current_user(current_user_id)

        if user.role not in cls.WRITABLE_ROLES:
            raise AccessDeniedError('Only admin/professional can update encounters')

        if 'patient_id' in data:
            encounter.patient_id = cls._ensure_patient_access(current_user_id, data.get('patient_id'))

        if 'specialty_key' in data:
            encounter.specialty_key = cls._resolve_specialty_key(data.get('specialty_key'), user)

        if 'visit_date' in data:
            encounter.visit_date = cls._parse_datetime(data.get('visit_date'))

        if 'status' in data:
            status = (data.get('status') or '').strip().lower()
            if status not in cls.ALLOWED_STATUSES:
                raise ValidationError('Invalid status')
            encounter.status = status

        for field in ('chief_complaint', 'diagnosis', 'assessment', 'plan', 'notes'):
            if field in data:
                setattr(encounter, field, data.get(field))

        if 'vitals' in data:
            encounter.vitals = data.get('vitals') if isinstance(data.get('vitals'), dict) else None
        if 'payload' in data:
            encounter.payload = data.get('payload') if isinstance(data.get('payload'), dict) else None

        db.session.commit()
        return encounter

    @classmethod
    def delete_encounter(cls, encounter_id, current_user_id):
        encounter = cls.get_encounter(encounter_id, current_user_id)
        user = cls._resolve_current_user(current_user_id)
        if user.role not in cls.WRITABLE_ROLES:
            raise AccessDeniedError('Only admin/professional can delete encounters')

        db.session.delete(encounter)
        db.session.commit()

    @staticmethod
    def enrich_encounter_payload(encounter):
        patient_name = None
        if encounter.patient:
            patient_name = f'{encounter.patient.first_name} {encounter.patient.last_name}'
        payload = {
            'id': encounter.id,
            'patient_id': encounter.patient_id,
            'professional_id': encounter.professional_id,
            'specialty_key': encounter.specialty_key,
            'visit_date': encounter.visit_date.isoformat() if encounter.visit_date else None,
            'status': encounter.status,
            'chief_complaint': encounter.chief_complaint,
            'diagnosis': encounter.diagnosis,
            'assessment': encounter.assessment,
            'plan': encounter.plan,
            'notes': encounter.notes,
            'vitals': encounter.vitals,
            'payload': encounter.payload,
            'patient_name': patient_name,
        }
        return payload
