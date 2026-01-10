# -*- coding: utf-8 -*-
"""
Psychology Schemas - Marshmallow validation and serialization
"""

from marshmallow import Schema, fields, validate, validates, ValidationError
from datetime import date


class PsychologicalEvaluationSchema(Schema):
    """Schema for psychological evaluation"""

    id = fields.Int(dump_only=True)
    patient_id = fields.Int(required=True)
    professional_id = fields.Int(required=True)
    medical_record_id = fields.Int(allow_none=True)

    # Reason for consultation
    reason = fields.Str(required=True)
    referred_by = fields.Str(validate=validate.Length(max=200))
    presenting_problem = fields.Str()
    symptoms_duration = fields.Str(validate=validate.Length(max=100))

    # Clinical interview
    current_symptoms = fields.List(fields.Dict())

    # History
    personal_history = fields.Str()
    family_history = fields.Str()
    medical_history = fields.Str()
    psychiatric_history = fields.Str()
    substance_use = fields.Str()

    # Social context
    living_situation = fields.Str(validate=validate.Length(max=200))
    employment_status = fields.Str(validate=validate.Length(max=100))
    relationship_status = fields.Str(validate=validate.Length(max=100))
    support_system = fields.Str()

    # Stressors
    stressors = fields.List(fields.Str())

    # Mental status examination
    appearance = fields.Str()
    behavior = fields.Str()
    speech = fields.Str(validate=validate.Length(max=100))
    mood = fields.Str(validate=validate.Length(max=100))
    affect = fields.Str(validate=validate.Length(max=100))
    thought_process = fields.Str(validate=validate.Length(max=100))
    thought_content = fields.Str()
    perception = fields.Str()
    cognition = fields.Str()
    insight = fields.Str(validate=validate.OneOf(['poor', 'fair', 'good']))
    judgment = fields.Str(validate=validate.OneOf(['poor', 'fair', 'good']))

    # Testing
    tests_administered = fields.Dict()

    # Risk assessment
    suicide_risk = fields.Str(
        validate=validate.OneOf(['none', 'low', 'moderate', 'high'])
    )
    suicide_history = fields.Str()
    homicide_risk = fields.Str(
        validate=validate.OneOf(['none', 'low', 'moderate', 'high'])
    )
    self_harm_risk = fields.Str(
        validate=validate.OneOf(['none', 'low', 'moderate', 'high'])
    )

    # Safety
    safety_concerns = fields.Str()
    protective_factors = fields.List(fields.Str())

    # Diagnosis
    primary_diagnosis = fields.Str(required=True, validate=validate.Length(max=200))
    dsm5_code = fields.Str(validate=validate.Length(max=50))
    secondary_diagnoses = fields.List(fields.Str())
    differential_diagnoses = fields.List(fields.Str())
    comorbidities = fields.List(fields.Str())

    # Strengths
    patient_strengths = fields.List(fields.Str())
    coping_mechanisms = fields.Str()
    previous_treatment = fields.Str()

    # Treatment plan
    treatment_recommendations = fields.Str(required=True)
    therapy_type = fields.Str(validate=validate.Length(max=100))
    frequency_recommended = fields.Str(validate=validate.Length(max=100))
    duration_estimate = fields.Str(validate=validate.Length(max=100))

    # Referrals
    psychiatry_referral = fields.Bool(dump_default=False)
    medication_recommended = fields.Bool(dump_default=False)
    other_referrals = fields.List(fields.Str())

    # Goals
    treatment_goals = fields.Dict()

    # Follow-up
    next_evaluation_date = fields.Date()
    evaluation_date = fields.Date(required=True)

    # Status
    status = fields.Str(
        validate=validate.OneOf(['active', 'completed', 'discontinued']),
        dump_default='active'
    )

    # Notes
    additional_notes = fields.Str()

    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    @validates('evaluation_date')
    def validate_evaluation_date(self, value):
        """Ensure evaluation date is not in the future"""
        if value > date.today():
            raise ValidationError('Evaluation date cannot be in the future')

    @validates('next_evaluation_date')
    def validate_next_evaluation_date(self, value):
        """Ensure next evaluation date is in the future"""
        if value and value <= date.today():
            raise ValidationError('Next evaluation date must be in the future')


class TherapySessionSchema(Schema):
    """Schema for therapy session"""

    id = fields.Int(dump_only=True)
    evaluation_id = fields.Int(required=True)
    patient_id = fields.Int(required=True)
    professional_id = fields.Int(required=True)

    # Session details
    session_number = fields.Int()
    session_date = fields.Date(required=True)
    duration_minutes = fields.Int(
        validate=validate.Range(min=15, max=180),
        dump_default=50
    )

    # Type and modality
    session_type = fields.Str(validate=validate.Length(max=100))
    modality = fields.Str(
        validate=validate.OneOf(['in_person', 'teletherapy', 'phone']),
        dump_default='in_person'
    )

    # Presenting issues
    presenting_issues = fields.List(fields.Str())

    # Patient status
    patient_mood = fields.Str(validate=validate.Length(max=50))
    patient_affect = fields.Str(validate=validate.Length(max=50))
    appearance_behavior = fields.Str()

    # Session content
    topics_discussed = fields.List(fields.Str())
    interventions_used = fields.List(fields.Dict())
    therapy_techniques = fields.List(fields.Str())

    # Homework
    homework_assigned = fields.Str()
    homework_compliance = fields.Str(
        validate=validate.OneOf(['not_assigned', 'completed', 'partial', 'not_completed'])
    )

    # Progress
    insights_gained = fields.Str()
    behavioral_changes = fields.Str()
    emotional_regulation = fields.Str(
        validate=validate.OneOf(['poor', 'fair', 'good', 'excellent'])
    )

    # Symptoms
    symptom_severity = fields.Dict()

    # Crisis
    crisis_intervention = fields.Bool(dump_default=False)
    safety_assessment = fields.Str()
    risk_level = fields.Str(
        validate=validate.OneOf(['none', 'low', 'moderate', 'high'])
    )

    # Evaluation
    progress_rating = fields.Int(validate=validate.Range(min=1, max=5))
    goals_progress = fields.List(fields.Dict())

    # Alliance
    therapeutic_alliance = fields.Str(
        validate=validate.OneOf(['poor', 'fair', 'good', 'excellent'])
    )
    patient_engagement = fields.Str(
        validate=validate.OneOf(['resistant', 'ambivalent', 'engaged', 'highly_engaged'])
    )

    # Barriers
    barriers = fields.Str()
    challenges_encountered = fields.Str()

    # Notes
    session_notes = fields.Str(required=True)
    clinical_impressions = fields.Str()

    # Planning
    next_session_plan = fields.Str()
    focus_areas = fields.List(fields.Str())
    treatment_plan_changes = fields.Str()
    referrals_made = fields.List(fields.Str())

    # Medications
    medication_discussion = fields.Str()
    medication_compliance = fields.Str(validate=validate.Length(max=50))

    # Outcome
    session_outcome = fields.Str(
        validate=validate.OneOf(['productive', 'some_progress', 'difficult', 'breakthrough'])
    )

    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    @validates('session_date')
    def validate_session_date(self, value):
        """Ensure session date is not too far in the future"""
        from datetime import timedelta
        max_future_date = date.today() + timedelta(days=90)
        if value > max_future_date:
            raise ValidationError('Session date cannot be more than 90 days in the future')


# Schema instances
psychological_evaluation_schema = PsychologicalEvaluationSchema()
psychological_evaluations_schema = PsychologicalEvaluationSchema(many=True)

therapy_session_schema = TherapySessionSchema()
therapy_sessions_schema = TherapySessionSchema(many=True)
