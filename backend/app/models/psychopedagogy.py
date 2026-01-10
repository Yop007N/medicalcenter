# -*- coding: utf-8 -*-
"""
Psychopedagogy Models - Educational Psychology and Learning Support
"""

from app.extensions import db
from datetime import datetime


class PsychopedagogicalEvaluation(db.Model):
    """Comprehensive psychopedagogical assessment"""
    __tablename__ = 'psychopedagogical_evaluations'

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    professional_id = db.Column(db.Integer, db.ForeignKey('professionals.id'), nullable=False)
    medical_record_id = db.Column(db.Integer, db.ForeignKey('medical_records.id'))

    # Student information
    school_name = db.Column(db.String(200))
    grade = db.Column(db.String(50))  # "3er grado", "5to año secundaria"
    academic_year = db.Column(db.Integer)
    teacher_name = db.Column(db.String(200))

    # Reason for consultation
    reason = db.Column(db.Text, nullable=False)
    referred_by = db.Column(db.String(200))  # teacher, parent, doctor, self
    presenting_problem = db.Column(db.Text)

    # Cognitive assessment
    cognitive_tests = db.Column(db.JSON)
    # Example structure:
    # {
    #   "WISC-V": {
    #     "date": "2025-11-20",
    #     "verbal_comprehension": 95,
    #     "visual_spatial": 102,
    #     "fluid_reasoning": 88,
    #     "working_memory": 85,
    #     "processing_speed": 92,
    #     "full_scale_iq": 92
    #   },
    #   "BENDER": {"score": 78, "interpretation": "age_appropriate"}
    # }

    # Academic assessment
    reading_level = db.Column(db.String(50))  # below_grade, at_grade, above_grade
    reading_score = db.Column(db.Integer)  # Percentile or score
    writing_level = db.Column(db.String(50))
    writing_score = db.Column(db.Integer)
    math_level = db.Column(db.String(50))
    math_score = db.Column(db.Integer)

    academic_strengths = db.Column(db.JSON)  # Array of strengths
    academic_weaknesses = db.Column(db.JSON)  # Array of areas needing support

    # Socio-emotional assessment
    emotional_state = db.Column(db.Text)
    behavioral_observations = db.Column(db.Text)
    social_skills = db.Column(db.Text)
    attention_focus = db.Column(db.String(50))  # poor, fair, good, excellent
    motivation = db.Column(db.String(50))

    # Learning style
    learning_style = db.Column(db.String(50))  # visual, auditory, kinesthetic, mixed
    preferred_activities = db.Column(db.JSON)

    # Diagnosis
    diagnosis = db.Column(db.Text)
    learning_difficulties = db.Column(db.JSON)
    # Array examples: ["dyslexia", "dyscalculia", "ADHD", "dysgraphia"]

    comorbidities = db.Column(db.JSON)  # Co-occurring conditions

    # Strengths and resources
    cognitive_strengths = db.Column(db.JSON)
    family_support = db.Column(db.Text)
    school_resources = db.Column(db.Text)

    # Recommendations
    recommendations = db.Column(db.Text, nullable=False)
    intervention_plan = db.Column(db.Text)

    # Specific accommodations
    classroom_accommodations = db.Column(db.JSON)
    # Examples: ["extended_time", "quiet_space", "visual_aids", "chunked_assignments"]

    educational_strategies = db.Column(db.JSON)
    home_strategies = db.Column(db.JSON)

    # Follow-up
    goals = db.Column(db.JSON)  # Short and long-term goals
    # {
    #   "short_term": ["Improve reading fluency by 20%", "Master multiplication tables"],
    #   "long_term": ["Read at grade level", "Independent homework completion"]
    # }

    # Dates
    evaluation_date = db.Column(db.Date, nullable=False)
    next_evaluation_date = db.Column(db.Date)

    # Status
    status = db.Column(db.String(50), default='active')  # active, completed, discontinued

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patient = db.relationship('Patient', backref='psychopedagogical_evaluations')
    professional = db.relationship('Professional', backref='psychopedagogical_evaluations')
    medical_record = db.relationship('MedicalRecord', backref='psychopedagogical_evaluations')
    intervention_sessions = db.relationship('InterventionSession', backref='evaluation',
                                           lazy='dynamic', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<PsychopedagogicalEvaluation {self.id} - Patient {self.patient_id}>'


class InterventionSession(db.Model):
    """Individual psychopedagogical intervention session"""
    __tablename__ = 'intervention_sessions'

    id = db.Column(db.Integer, primary_key=True)
    evaluation_id = db.Column(db.Integer, db.ForeignKey('psychopedagogical_evaluations.id'), nullable=False)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    professional_id = db.Column(db.Integer, db.ForeignKey('professionals.id'), nullable=False)

    # Session details
    session_number = db.Column(db.Integer)
    session_date = db.Column(db.Date, nullable=False)
    duration_minutes = db.Column(db.Integer, default=60)

    # Focus area for this session
    focus_area = db.Column(db.String(100), nullable=False)
    # Examples: reading_comprehension, math_skills, writing, attention, organization

    # Specific skills targeted
    skills_targeted = db.Column(db.JSON)
    # Examples: ["phonemic_awareness", "decoding", "fluency"]

    # Activities performed
    activities = db.Column(db.JSON)
    # [
    #   {"name": "Word building", "duration": 15, "materials": "letter tiles"},
    #   {"name": "Reading practice", "duration": 20, "book": "Level 2 reader"}
    # ]

    materials_used = db.Column(db.JSON)  # Educational materials/resources used

    # Student response
    student_engagement = db.Column(db.String(50))  # low, moderate, high
    student_mood = db.Column(db.String(50))  # anxious, neutral, positive, enthusiastic
    cooperation_level = db.Column(db.String(50))  # poor, fair, good, excellent

    # Performance
    task_completion = db.Column(db.Integer)  # Percentage completed
    accuracy_rate = db.Column(db.Integer)  # Percentage correct
    independence_level = db.Column(db.String(50))  # needs_support, some_support, independent

    # Observations
    behavioral_notes = db.Column(db.Text)
    learning_observations = db.Column(db.Text)
    progress_notes = db.Column(db.Text)

    # Homework/practice assigned
    homework_assigned = db.Column(db.Text)
    parent_communication = db.Column(db.Text)

    # Progress tracking
    progress_rating = db.Column(db.Integer)  # 1-5 scale
    # 1 = Regression, 2 = No progress, 3 = Minimal progress, 4 = Good progress, 5 = Excellent progress

    goals_met = db.Column(db.JSON)  # Which session goals were achieved
    challenges_encountered = db.Column(db.Text)

    # Next session planning
    next_session_plan = db.Column(db.Text)
    strategy_adjustments = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patient = db.relationship('Patient', backref='intervention_sessions')
    professional = db.relationship('Professional', backref='intervention_sessions')

    def __repr__(self):
        return f'<InterventionSession {self.session_number} - Evaluation {self.evaluation_id}>'
