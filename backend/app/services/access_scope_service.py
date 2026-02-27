# -*- coding: utf-8 -*-
"""Access scope helpers for actor and specialty-aware authorization."""

import unicodedata

from app.extensions import db
from app.models.appointment import Appointment
from app.models.budget import Budget
from app.models.medical_record import MedicalRecord
from app.models.odontogram import DentalTreatment, Odontogram
from app.models.professional_patient_assignment import ProfessionalPatientAssignment
from app.models.psychology import PsychologicalEvaluation
from app.models.psychopedagogy import PsychopedagogicalEvaluation
from app.models.user import User
from app.services.exceptions import AccessDeniedError, ValidationError


class AccessScopeService:
    """Centralizes actor scope, patient ownership and module specialty checks."""

    MODULE_SPECIALTY_ALIASES = {
        'odontology': {
            'odontologia',
            'odontology',
            'odontologo',
            'odontologa',
            'ortodoncia',
            'odontopediatria',
        },
        'psychology': {
            'psicologia',
            'psychology',
            'psicologo',
            'psicologa',
            'psicologia clinica',
            'psiquiatria',
        },
        'psychopedagogy': {
            'psicopedagogia',
            'psychopedagogy',
            'psicopedagogo',
            'psicopedagoga',
        },
    }

    @staticmethod
    def normalize_text(value):
        """Normalize text for case/accent-insensitive comparisons."""
        if not value:
            return ''
        normalized = unicodedata.normalize('NFKD', str(value))
        ascii_only = ''.join(ch for ch in normalized if not unicodedata.combining(ch))
        return ascii_only.strip().lower()

    @staticmethod
    def get_user_or_raise(current_user_id):
        """Return current user from identity or raise validation/access error."""
        try:
            user_id = int(current_user_id)
        except (TypeError, ValueError) as exc:
            raise ValidationError('Invalid current user context') from exc

        user = User.query.get(user_id)
        if not user:
            raise AccessDeniedError('User not found')
        return user

    @classmethod
    def _specialty_matches_module(cls, specialty, module_key):
        """Validate if specialty authorizes requested module."""
        aliases = cls.MODULE_SPECIALTY_ALIASES.get(module_key, set())
        if not aliases:
            return True

        normalized_specialty = cls.normalize_text(specialty)
        if not normalized_specialty:
            return False

        return any(alias in normalized_specialty for alias in aliases)

    @classmethod
    def resolve_specialty_key(cls, specialty):
        """Resolve specialty/module key using the specialty module catalog."""
        from app.services.specialty_module_service import SpecialtyModuleService

        module = SpecialtyModuleService.resolve_module(specialty)
        key = module.get('key') if module else None
        return cls.normalize_text(key) if key else None

    @classmethod
    def get_user_specialty_key(cls, current_user_id):
        """Return resolved module key for current user specialty, when applicable."""
        user = cls.get_user_or_raise(current_user_id)
        return cls.resolve_specialty_key(getattr(user, 'specialty', None))

    @classmethod
    def ensure_module_access(cls, current_user_id, module_key):
        """
        Enforce module access:
        - admin: always allowed
        - professional: allowed when specialty matches module
        - patient/others: denied
        """
        user = cls.get_user_or_raise(current_user_id)
        if user.role == 'admin':
            return user

        if user.role != 'professional':
            raise AccessDeniedError('This module is only available for professionals/admin')

        if not cls._specialty_matches_module(getattr(user, 'specialty', None), module_key):
            raise AccessDeniedError(
                f'Professional specialty is not allowed for module "{module_key}"'
            )

        return user

    @staticmethod
    def get_professional_patient_ids(professional_id, specialty_key=None):
        """Return distinct patient IDs linked to a professional activity."""
        try:
            professional_id = int(professional_id)
        except (TypeError, ValueError):
            return set()

        normalized_specialty_key = AccessScopeService.normalize_text(specialty_key)
        patient_ids = set()

        assigned_query = db.session.query(ProfessionalPatientAssignment.patient_id).filter(
            ProfessionalPatientAssignment.professional_id == professional_id
        )

        if normalized_specialty_key:
            scoped_rows = assigned_query.filter(
                ProfessionalPatientAssignment.specialty_key == normalized_specialty_key
            ).distinct().all()
            if scoped_rows:
                return {value for (value,) in scoped_rows if value is not None}

            legacy_rows = assigned_query.filter(
                ProfessionalPatientAssignment.specialty_key.is_(None)
            ).distinct().all()
            if legacy_rows:
                return {value for (value,) in legacy_rows if value is not None}

            return set()

        assigned_rows = assigned_query.distinct().all()
        patient_ids.update(value for (value,) in assigned_rows if value is not None)

        query_specs = [
            (Appointment, Appointment.patient_id, Appointment.professional_id == professional_id),
            (MedicalRecord, MedicalRecord.patient_id, MedicalRecord.professional_id == professional_id),
            (Budget, Budget.patient_id, Budget.created_by == professional_id),
            (Odontogram, Odontogram.patient_id, Odontogram.professional_id == professional_id),
            (DentalTreatment, DentalTreatment.patient_id, DentalTreatment.professional_id == professional_id),
            (PsychologicalEvaluation, PsychologicalEvaluation.patient_id, PsychologicalEvaluation.professional_id == professional_id),
            (PsychopedagogicalEvaluation, PsychopedagogicalEvaluation.patient_id, PsychopedagogicalEvaluation.professional_id == professional_id),
        ]

        for model, field, predicate in query_specs:
            rows = db.session.query(field).filter(predicate).distinct().all()
            patient_ids.update(value for (value,) in rows if value is not None)

        return patient_ids

    @classmethod
    def professional_can_access_patient(cls, professional_id, patient_id, specialty_key=None):
        """Check if professional has relationship with patient."""
        if patient_id is None:
            return False
        try:
            patient_id = int(patient_id)
        except (TypeError, ValueError):
            return False

        return patient_id in cls.get_professional_patient_ids(
            professional_id,
            specialty_key=specialty_key,
        )

    @classmethod
    def ensure_patient_access_scope(cls, current_user_id, patient_id):
        """
        Validate patient scope by actor:
        - admin: all patients
        - professional: only linked patients
        - patient: only own patient_id
        """
        user = cls.get_user_or_raise(current_user_id)
        if user.role == 'admin':
            return user

        if user.role == 'patient':
            if int(user.id) != int(patient_id):
                raise AccessDeniedError('Patients can only access their own records')
            return user

        if user.role == 'professional':
            if not cls.professional_can_access_patient(user.id, patient_id):
                raise AccessDeniedError('Professional can only access linked patients')
            return user

        raise AccessDeniedError('Unauthorized')
