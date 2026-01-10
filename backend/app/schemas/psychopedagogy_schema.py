# -*- coding: utf-8 -*-
"""
Psychopedagogy Schemas - Marshmallow validation and serialization
"""

from marshmallow import Schema, fields, validate, validates, ValidationError
from datetime import date


class PsychopedagogicalEvaluationSchema(Schema):
    """Schema for psychopedagogical evaluation"""

    id = fields.Int(dump_only=True)
    patient_id = fields.Int(required=True)
    professional_id = fields.Int(required=True)
    medical_record_id = fields.Int(allow_none=True)

    # Student information
    school_name = fields.Str(validate=validate.Length(max=200))
    grade = fields.Str(validate=validate.Length(max=50))
    academic_year = fields.Int()
    teacher_name = fields.Str(validate=validate.Length(max=200))

    # Reason for consultation
    reason = fields.Str(required=True)
    referred_by = fields.Str(validate=validate.Length(max=200))
    presenting_problem = fields.Str()

    # Cognitive assessment
    cognitive_tests = fields.Dict()

    # Academic assessment
    reading_level = fields.Str(
        validate=validate.OneOf(['below_grade', 'at_grade', 'above_grade'])
    )
    reading_score = fields.Int(validate=validate.Range(min=0, max=100))
    writing_level = fields.Str(
        validate=validate.OneOf(['below_grade', 'at_grade', 'above_grade'])
    )
    writing_score = fields.Int(validate=validate.Range(min=0, max=100))
    math_level = fields.Str(
        validate=validate.OneOf(['below_grade', 'at_grade', 'above_grade'])
    )
    math_score = fields.Int(validate=validate.Range(min=0, max=100))

    academic_strengths = fields.List(fields.Str())
    academic_weaknesses = fields.List(fields.Str())

    # Socio-emotional assessment
    emotional_state = fields.Str()
    behavioral_observations = fields.Str()
    social_skills = fields.Str()
    attention_focus = fields.Str(
        validate=validate.OneOf(['poor', 'fair', 'good', 'excellent'])
    )
    motivation = fields.Str(
        validate=validate.OneOf(['very_low', 'low', 'moderate', 'high', 'very_high'])
    )

    # Learning style
    learning_style = fields.Str(
        validate=validate.OneOf(['visual', 'auditory', 'kinesthetic', 'mixed'])
    )
    preferred_activities = fields.List(fields.Str())

    # Diagnosis
    diagnosis = fields.Str()
    learning_difficulties = fields.List(fields.Str())
    comorbidities = fields.List(fields.Str())

    # Strengths and resources
    cognitive_strengths = fields.List(fields.Str())
    family_support = fields.Str()
    school_resources = fields.Str()

    # Recommendations
    recommendations = fields.Str(required=True)
    intervention_plan = fields.Str()

    # Accommodations
    classroom_accommodations = fields.List(fields.Str())
    educational_strategies = fields.List(fields.Str())
    home_strategies = fields.List(fields.Str())

    # Follow-up
    goals = fields.Dict()
    evaluation_date = fields.Date(required=True)
    next_evaluation_date = fields.Date()

    # Status
    status = fields.Str(
        validate=validate.OneOf(['active', 'completed', 'discontinued']),
        dump_default='active'
    )

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


class InterventionSessionSchema(Schema):
    """Schema for intervention session"""

    id = fields.Int(dump_only=True)
    evaluation_id = fields.Int(required=True)
    patient_id = fields.Int(required=True)
    professional_id = fields.Int(required=True)

    # Session details
    session_number = fields.Int()
    session_date = fields.Date(required=True)
    duration_minutes = fields.Int(
        validate=validate.Range(min=15, max=180),
        dump_default=60
    )

    # Focus area
    focus_area = fields.Str(required=True, validate=validate.Length(max=100))
    skills_targeted = fields.List(fields.Str())

    # Activities
    activities = fields.List(fields.Dict())
    materials_used = fields.List(fields.Str())

    # Student response
    student_engagement = fields.Str(
        validate=validate.OneOf(['low', 'moderate', 'high'])
    )
    student_mood = fields.Str(
        validate=validate.OneOf(['anxious', 'neutral', 'positive', 'enthusiastic'])
    )
    cooperation_level = fields.Str(
        validate=validate.OneOf(['poor', 'fair', 'good', 'excellent'])
    )

    # Performance
    task_completion = fields.Int(validate=validate.Range(min=0, max=100))
    accuracy_rate = fields.Int(validate=validate.Range(min=0, max=100))
    independence_level = fields.Str(
        validate=validate.OneOf(['needs_support', 'some_support', 'independent'])
    )

    # Observations
    behavioral_notes = fields.Str()
    learning_observations = fields.Str()
    progress_notes = fields.Str()

    # Homework
    homework_assigned = fields.Str()
    parent_communication = fields.Str()

    # Progress
    progress_rating = fields.Int(validate=validate.Range(min=1, max=5))
    goals_met = fields.List(fields.Str())
    challenges_encountered = fields.Str()

    # Next session
    next_session_plan = fields.Str()
    strategy_adjustments = fields.Str()

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
psychopedagogical_evaluation_schema = PsychopedagogicalEvaluationSchema()
psychopedagogical_evaluations_schema = PsychopedagogicalEvaluationSchema(many=True)

intervention_session_schema = InterventionSessionSchema()
intervention_sessions_schema = InterventionSessionSchema(many=True)
