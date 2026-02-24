# -*- coding: utf-8 -*-
"""Service layer for psychology module operations."""

from marshmallow import ValidationError as MarshmallowValidationError

from app.extensions import db
from app.models.patient import Patient
from app.models.professional import Professional
from app.models.psychology import PsychologicalEvaluation, TherapySession
from app.schemas.psychology_schema import psychological_evaluation_schema, therapy_session_schema
from app.services.exceptions import ResourceNotFoundError, ValidationError
from app.utils.helpers import validate_required_fields


class PsychologyService:
    """Encapsulates psychological evaluations and therapy sessions logic."""

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
        evaluation = PsychologicalEvaluation.query.get(evaluation_id)
        if not evaluation:
            raise ResourceNotFoundError('Evaluation not found')
        return evaluation

    @staticmethod
    def _get_session_or_404(session_id):
        session = TherapySession.query.get(session_id)
        if not session:
            raise ResourceNotFoundError('Session not found')
        return session

    @staticmethod
    def _raise_schema_error(error):
        raise ValidationError('Validation error', details={'errors': error.messages})

    @classmethod
    def create_evaluation(cls, current_user_id, data):
        required = ['patient_id', 'reason', 'primary_diagnosis', 'treatment_recommendations', 'evaluation_date']
        is_valid, missing_fields = validate_required_fields(data, required)
        if not is_valid:
            raise ValidationError('Missing required fields', details={'missing_fields': missing_fields})

        cls._get_patient_or_404(data['patient_id'])

        payload = dict(data)
        payload['professional_id'] = cls._normalize_user_id(current_user_id)

        try:
            evaluation_data = psychological_evaluation_schema.load(payload)
        except MarshmallowValidationError as error:
            cls._raise_schema_error(error)

        evaluation = PsychologicalEvaluation(**evaluation_data)
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
            validated_data = psychological_evaluation_schema.load(data, partial=True)
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
        query = PsychologicalEvaluation.query.filter_by(patient_id=patient_id)
        if status:
            query = query.filter_by(status=status)

        query = query.order_by(PsychologicalEvaluation.evaluation_date.desc())
        return query.paginate(page=page, per_page=page_size, error_out=False)

    @classmethod
    def get_professional_evaluations(cls, professional_id, page, page_size):
        cls._get_professional_or_404(professional_id)
        query = PsychologicalEvaluation.query.filter_by(professional_id=professional_id)
        query = query.order_by(PsychologicalEvaluation.evaluation_date.desc())
        return query.paginate(page=page, per_page=page_size, error_out=False)

    @classmethod
    def create_session(cls, current_user_id, data):
        required = ['evaluation_id', 'patient_id', 'session_date', 'session_notes']
        is_valid, missing_fields = validate_required_fields(data, required)
        if not is_valid:
            raise ValidationError('Missing required fields', details={'missing_fields': missing_fields})

        cls._get_evaluation_or_404(data['evaluation_id'])
        cls._get_patient_or_404(data['patient_id'])

        payload = dict(data)
        payload['professional_id'] = cls._normalize_user_id(current_user_id)

        try:
            session_data = therapy_session_schema.load(payload)
        except MarshmallowValidationError as error:
            cls._raise_schema_error(error)

        if 'session_number' not in session_data:
            last_session = TherapySession.query.filter_by(
                evaluation_id=data['evaluation_id']
            ).order_by(TherapySession.session_number.desc()).first()
            session_data['session_number'] = (last_session.session_number + 1) if last_session else 1

        session = TherapySession(**session_data)
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
            validated_data = therapy_session_schema.load(data, partial=True)
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
        query = TherapySession.query.filter_by(evaluation_id=evaluation_id)
        query = query.order_by(TherapySession.session_number.asc())
        return query.paginate(page=page, per_page=page_size, error_out=False)

    @classmethod
    def get_patient_session_history(cls, patient_id, page, page_size):
        cls._get_patient_or_404(patient_id)
        query = TherapySession.query.filter_by(patient_id=patient_id)
        query = query.order_by(TherapySession.session_date.desc())
        return query.paginate(page=page, per_page=page_size, error_out=False)

    @classmethod
    def mark_crisis_intervention(cls, session_id, data):
        session = cls._get_session_or_404(session_id)
        session.crisis_intervention = True
        if 'safety_assessment' in data:
            session.safety_assessment = data['safety_assessment']
        if 'risk_level' in data:
            session.risk_level = data['risk_level']

        db.session.add(session)
        db.session.commit()
        return session
