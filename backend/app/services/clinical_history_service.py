# -*- coding: utf-8 -*-
"""Service layer for clinical history subdomains."""

from datetime import datetime

from app.extensions import db
from app.models.clinical_history import ClinicalHistoryEvent, Evolution
from app.models.patient import Patient
from app.services.exceptions import AccessDeniedError, ResourceNotFoundError, ValidationError
from app.services.patient_access_service import PatientAccessService
from app.utils.helpers import validate_required_fields


class EvolutionService:
    """Business logic for clinical evolution records."""

    @classmethod
    def list_evolutions(cls, current_user_id, patient_id=None, status=None, include_annulled=False):
        current_user_id = cls._normalize_user_id(current_user_id)

        if patient_id and not cls._has_patient_access(current_user_id, patient_id):
            raise AccessDeniedError('Unauthorized')

        if not patient_id and PatientAccessService.get_user_role(current_user_id) == 'patient':
            patient_id = current_user_id

        query = Evolution.query
        if patient_id:
            query = query.filter_by(patient_id=patient_id)
        if status:
            query = query.filter_by(status=status)
        if not include_annulled:
            query = query.filter(Evolution.status != 'annulled')

        return query.order_by(Evolution.created_at.desc()).all()

    @classmethod
    def create_evolution(cls, current_user_id, data):
        current_user_id = cls._normalize_user_id(current_user_id)

        required_fields = ['patient_id', 'action_performed']
        is_valid, missing_fields = validate_required_fields(data, required_fields)
        if not is_valid:
            raise ValidationError(
                'Missing required fields',
                details={'missing_fields': missing_fields},
            )

        patient_id = data.get('patient_id')
        patient = Patient.query.get(patient_id)
        if not patient:
            raise ResourceNotFoundError('Patient not found')

        if not cls._has_patient_access(current_user_id, patient_id):
            raise AccessDeniedError('Unauthorized')

        evolution = Evolution(
            patient_id=patient_id,
            professional_id=current_user_id,
            treatment_plan_id=data.get('treatment_plan_id'),
            action_performed=data.get('action_performed'),
            notes=data.get('notes'),
            status=data.get('status', 'pending'),
        )
        db.session.add(evolution)
        db.session.flush()

        event = ClinicalHistoryEvent(
            patient_id=patient_id,
            professional_id=current_user_id,
            event_type='evolution',
            reference_type='evolution',
            reference_id=evolution.id,
            title='Nueva evolución registrada',
            description=data['action_performed'][:200] if data.get('action_performed') else None,
        )
        db.session.add(event)
        db.session.commit()
        return evolution

    @classmethod
    def get_evolution(cls, current_user_id, evolution_id):
        current_user_id = cls._normalize_user_id(current_user_id)
        evolution = cls._get_evolution_or_404(evolution_id)
        cls._ensure_patient_access(current_user_id, evolution.patient_id)
        return evolution

    @classmethod
    def update_evolution(cls, current_user_id, evolution_id, data):
        current_user_id = cls._normalize_user_id(current_user_id)
        evolution = cls._get_evolution_or_404(evolution_id)
        cls._ensure_patient_access(current_user_id, evolution.patient_id)

        if evolution.status == 'annulled':
            raise ValidationError('Cannot modify annulled evolution')

        if 'action_performed' in data:
            evolution.action_performed = data['action_performed']
        if 'notes' in data:
            evolution.notes = data['notes']
        if 'treatment_plan_id' in data:
            evolution.treatment_plan_id = data['treatment_plan_id']

        db.session.add(evolution)
        db.session.commit()
        return evolution

    @classmethod
    def sign_evolution(cls, current_user_id, evolution_id, data):
        current_user_id = cls._normalize_user_id(current_user_id)
        evolution = cls._get_evolution_or_404(evolution_id)
        cls._ensure_patient_access(current_user_id, evolution.patient_id)

        signer_type = data.get('signer_type')
        signature = data.get('signature')
        if not signer_type or not signature:
            raise ValidationError('signer_type and signature are required')

        if signer_type == 'professional':
            evolution.professional_signature = signature
            evolution.professional_signed_at = datetime.utcnow()
        elif signer_type == 'patient':
            evolution.patient_signature = signature
            evolution.patient_signed_at = datetime.utcnow()
        else:
            raise ValidationError('signer_type must be professional or patient')

        if evolution.professional_signature and evolution.patient_signature:
            evolution.status = 'signed'

        db.session.add(evolution)
        db.session.commit()
        return evolution

    @classmethod
    def annul_evolution(cls, current_user_id, evolution_id):
        current_user_id = cls._normalize_user_id(current_user_id)
        evolution = cls._get_evolution_or_404(evolution_id)
        cls._ensure_patient_access(current_user_id, evolution.patient_id)

        evolution.status = 'annulled'
        db.session.add(evolution)
        db.session.commit()
        return evolution

    @staticmethod
    def _normalize_user_id(current_user_id):
        try:
            return int(current_user_id)
        except (TypeError, ValueError):
            raise ValidationError('Invalid current user context')

    @staticmethod
    def _has_patient_access(current_user_id, patient_id):
        return PatientAccessService.can_access_patient(current_user_id, patient_id)

    @classmethod
    def _ensure_patient_access(cls, current_user_id, patient_id):
        if not cls._has_patient_access(current_user_id, patient_id):
            raise AccessDeniedError('Unauthorized')

    @staticmethod
    def _get_evolution_or_404(evolution_id):
        evolution = Evolution.query.get(evolution_id)
        if not evolution:
            raise ResourceNotFoundError('Evolution not found')
        return evolution

