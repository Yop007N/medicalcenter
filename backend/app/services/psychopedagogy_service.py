# -*- coding: utf-8 -*-
"""Service layer for psychopedagogy module operations."""

from marshmallow import ValidationError as MarshmallowValidationError

from app.extensions import db
from app.models.patient import Patient
from app.models.professional import Professional
from app.models.professional_patient_assignment import ProfessionalPatientAssignment
from app.models.psychopedagogy import PsychopedagogicalEvaluation, InterventionSession
from app.models.user import User
from app.schemas.psychopedagogy_schema import psychopedagogical_evaluation_schema, intervention_session_schema
from app.services.access_scope_service import AccessScopeService
from app.services.exceptions import ResourceNotFoundError, ValidationError
from app.utils.helpers import validate_required_fields


class PsychopedagogyService:
    """Encapsulates psychopedagogical evaluations and intervention sessions logic."""

    MODULE_KEY = 'psychopedagogy'

    @staticmethod
    def _normalize_user_id(current_user_id):
        try:
            return int(current_user_id)
        except (TypeError, ValueError):
            raise ValidationError('Invalid current user context')

    @staticmethod
    def _get_patient_or_404(patient_id):
        patient = Patient.query.get(patient_id)
        if not patient:
            raise ResourceNotFoundError('Patient not found')
        return patient

    @staticmethod
    def _get_professional_or_404(professional_id):
        professional = Professional.query.get(professional_id)
        if not professional:
            raise ResourceNotFoundError('Professional not found')
        return professional

    @staticmethod
    def _get_evaluation_or_404(evaluation_id):
        evaluation = PsychopedagogicalEvaluation.query.get(evaluation_id)
        if not evaluation:
            raise ResourceNotFoundError('Evaluation not found')
        return evaluation

    @staticmethod
    def _get_session_or_404(session_id):
        session = InterventionSession.query.get(session_id)
        if not session:
            raise ResourceNotFoundError('Session not found')
        return session

    @staticmethod
    def _raise_schema_error(error):
        raise ValidationError('Validation error', details={'errors': error.messages})

    @classmethod
    def _upsert_patient_assignment(cls, patient_id, professional_id):
        assignment = ProfessionalPatientAssignment.query.filter_by(
            patient_id=patient_id,
            professional_id=professional_id,
        ).first()
        if assignment:
            if assignment.specialty_key != cls.MODULE_KEY:
                assignment.specialty_key = cls.MODULE_KEY
            return

        db.session.add(
            ProfessionalPatientAssignment(
                professional_id=professional_id,
                patient_id=patient_id,
                specialty_key=cls.MODULE_KEY,
            )
        )

    @classmethod
    def _professional_matches_module(cls, professional):
        return (
            AccessScopeService.resolve_specialty_key(getattr(professional, 'specialty', None))
            == cls.MODULE_KEY
        )

    @classmethod
    def _validate_professional_candidate(cls, candidate):
        try:
            professional_id = int(candidate)
        except (TypeError, ValueError) as exc:
            raise ValidationError('professional_id must be an integer') from exc

        if professional_id <= 0:
            raise ValidationError('professional_id must be a positive integer')

        professional = cls._get_professional_or_404(professional_id)
        if not cls._professional_matches_module(professional):
            raise ValidationError('professional_id does not belong to psychopedagogy module')
        return professional

    @classmethod
    def _infer_professional_for_patient(cls, patient_id):
        scoped_assignment = (
            ProfessionalPatientAssignment.query
            .filter_by(patient_id=patient_id, specialty_key=cls.MODULE_KEY)
            .order_by(ProfessionalPatientAssignment.assigned_at.asc())
            .first()
        )
        if scoped_assignment:
            professional = Professional.query.get(scoped_assignment.professional_id)
            if professional:
                return professional

        assignment_rows = (
            ProfessionalPatientAssignment.query
            .filter_by(patient_id=patient_id)
            .order_by(ProfessionalPatientAssignment.assigned_at.asc())
            .all()
        )
        for assignment in assignment_rows:
            professional = Professional.query.get(assignment.professional_id)
            if professional and cls._professional_matches_module(professional):
                return professional

        professionals = (
            Professional.query
            .filter(Professional.is_active.is_(True))
            .order_by(Professional.first_name.asc(), Professional.last_name.asc(), Professional.id.asc())
            .all()
        )
        for professional in professionals:
            if cls._professional_matches_module(professional):
                return professional
        return None

    @classmethod
    def _resolve_professional_id(
        cls,
        current_user_id,
        patient_id,
        provided_professional_id=None,
        fallback_professional_id=None,
    ):
        current_user_id = cls._normalize_user_id(current_user_id)
        current_professional = Professional.query.get(current_user_id)
        if current_professional:
            if not cls._professional_matches_module(current_professional):
                raise ValidationError('Professional is not allowed for psychopedagogy module')
            cls._upsert_patient_assignment(patient_id=patient_id, professional_id=current_professional.id)
            return current_professional.id

        current_user = User.query.get(current_user_id)
        if not current_user or current_user.role != 'admin':
            raise ValidationError('Invalid current user context')

        for candidate in (provided_professional_id, fallback_professional_id):
            if candidate in (None, ''):
                continue
            professional = cls._validate_professional_candidate(candidate)
            cls._upsert_patient_assignment(patient_id=patient_id, professional_id=professional.id)
            return professional.id

        inferred_professional = cls._infer_professional_for_patient(patient_id)
        if not inferred_professional:
            raise ValidationError('No professional available for psychopedagogy module')

        cls._upsert_patient_assignment(patient_id=patient_id, professional_id=inferred_professional.id)
        return inferred_professional.id

    @classmethod
    def create_evaluation(cls, current_user_id, data):
        required = ['patient_id', 'reason', 'recommendations', 'evaluation_date']
        is_valid, missing_fields = validate_required_fields(data, required)
        if not is_valid:
            raise ValidationError('Missing required fields', details={'missing_fields': missing_fields})

        cls._get_patient_or_404(data['patient_id'])
        professional_id = cls._resolve_professional_id(
            current_user_id=current_user_id,
            patient_id=data['patient_id'],
            provided_professional_id=data.get('professional_id'),
        )

        payload = dict(data)
        payload['professional_id'] = professional_id

        try:
            evaluation_data = psychopedagogical_evaluation_schema.load(payload)
        except MarshmallowValidationError as error:
            cls._raise_schema_error(error)

        evaluation = PsychopedagogicalEvaluation(**evaluation_data)
        db.session.add(evaluation)
        db.session.commit()
        return evaluation

    @classmethod
    def get_evaluation(cls, evaluation_id):
        return cls._get_evaluation_or_404(evaluation_id)

    @classmethod
    def update_evaluation(cls, evaluation_id, data):
        evaluation = cls._get_evaluation_or_404(evaluation_id)
        try:
            validated_data = psychopedagogical_evaluation_schema.load(data, partial=True)
        except MarshmallowValidationError as error:
            cls._raise_schema_error(error)

        for key, value in validated_data.items():
            setattr(evaluation, key, value)

        db.session.add(evaluation)
        db.session.commit()
        return evaluation

    @classmethod
    def delete_evaluation(cls, evaluation_id):
        evaluation = cls._get_evaluation_or_404(evaluation_id)
        db.session.delete(evaluation)
        db.session.commit()

    @classmethod
    def get_patient_evaluations(cls, patient_id, page, page_size, status=None):
        cls._get_patient_or_404(patient_id)
        query = PsychopedagogicalEvaluation.query.filter_by(patient_id=patient_id)
        if status:
            query = query.filter_by(status=status)

        query = query.order_by(PsychopedagogicalEvaluation.evaluation_date.desc())
        return query.paginate(page=page, per_page=page_size, error_out=False)

    @classmethod
    def get_professional_evaluations(cls, professional_id, page, page_size):
        cls._get_professional_or_404(professional_id)
        query = PsychopedagogicalEvaluation.query.filter_by(professional_id=professional_id)
        query = query.order_by(PsychopedagogicalEvaluation.evaluation_date.desc())
        return query.paginate(page=page, per_page=page_size, error_out=False)

    @classmethod
    def create_session(cls, current_user_id, data):
        required = ['evaluation_id', 'patient_id', 'session_date', 'focus_area']
        is_valid, missing_fields = validate_required_fields(data, required)
        if not is_valid:
            raise ValidationError('Missing required fields', details={'missing_fields': missing_fields})

        evaluation = cls._get_evaluation_or_404(data['evaluation_id'])
        cls._get_patient_or_404(data['patient_id'])
        if evaluation.patient_id != data['patient_id']:
            raise ValidationError('evaluation_id does not belong to provided patient_id')
        professional_id = cls._resolve_professional_id(
            current_user_id=current_user_id,
            patient_id=data['patient_id'],
            provided_professional_id=data.get('professional_id'),
            fallback_professional_id=evaluation.professional_id,
        )

        payload = dict(data)
        payload['professional_id'] = professional_id

        try:
            session_data = intervention_session_schema.load(payload)
        except MarshmallowValidationError as error:
            cls._raise_schema_error(error)

        if 'session_number' not in session_data:
            last_session = InterventionSession.query.filter_by(
                evaluation_id=data['evaluation_id']
            ).order_by(InterventionSession.session_number.desc()).first()
            session_data['session_number'] = (last_session.session_number + 1) if last_session else 1

        session = InterventionSession(**session_data)
        db.session.add(session)
        db.session.commit()
        return session

    @classmethod
    def get_session(cls, session_id):
        return cls._get_session_or_404(session_id)

    @classmethod
    def update_session(cls, session_id, data):
        session = cls._get_session_or_404(session_id)
        try:
            validated_data = intervention_session_schema.load(data, partial=True)
        except MarshmallowValidationError as error:
            cls._raise_schema_error(error)

        for key, value in validated_data.items():
            setattr(session, key, value)

        db.session.add(session)
        db.session.commit()
        return session

    @classmethod
    def delete_session(cls, session_id):
        session = cls._get_session_or_404(session_id)
        db.session.delete(session)
        db.session.commit()

    @classmethod
    def get_evaluation_sessions(cls, evaluation_id, page, page_size):
        cls._get_evaluation_or_404(evaluation_id)
        query = InterventionSession.query.filter_by(evaluation_id=evaluation_id)
        query = query.order_by(InterventionSession.session_number.asc())
        return query.paginate(page=page, per_page=page_size, error_out=False)

    @classmethod
    def get_patient_session_history(cls, patient_id, page, page_size):
        cls._get_patient_or_404(patient_id)
        query = InterventionSession.query.filter_by(patient_id=patient_id)
        query = query.order_by(InterventionSession.session_date.desc())
        return query.paginate(page=page, per_page=page_size, error_out=False)
