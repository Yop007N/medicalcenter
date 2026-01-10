# -*- coding: utf-8 -*-
"""
Psychology Models - Clinical Psychology and Therapy
"""

from app.extensions import db
from datetime import datetime


class PsychologicalEvaluation(db.Model):
    """Comprehensive psychological assessment"""
    __tablename__ = 'psychological_evaluations'

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    professional_id = db.Column(db.Integer, db.ForeignKey('professionals.id'), nullable=False)
    medical_record_id = db.Column(db.Integer, db.ForeignKey('medical_records.id'))

    # Reason for consultation
    reason = db.Column(db.Text, nullable=False)
    referred_by = db.Column(db.String(200))  # psychiatrist, doctor, self, family, school
    presenting_problem = db.Column(db.Text)
    symptoms_duration = db.Column(db.String(100))  # "2 weeks", "6 months", "2 years"

    # Clinical interview
    current_symptoms = db.Column(db.JSON)
    # Example: [
    #   {"symptom": "anxiety", "severity": "moderate", "frequency": "daily"},
    #   {"symptom": "insomnia", "severity": "severe", "frequency": "nightly"}
    # ]

    # Personal history
    personal_history = db.Column(db.Text)
    family_history = db.Column(db.Text)
    medical_history = db.Column(db.Text)
    psychiatric_history = db.Column(db.Text)
    substance_use = db.Column(db.Text)

    # Social context
    living_situation = db.Column(db.String(200))  # alone, with_family, with_partner, etc.
    employment_status = db.Column(db.String(100))  # employed, unemployed, student, retired
    relationship_status = db.Column(db.String(100))  # single, married, divorced, etc.
    support_system = db.Column(db.Text)  # Family, friends, community support

    # Current stressors
    stressors = db.Column(db.JSON)
    # Examples: ["work_stress", "relationship_issues", "financial_problems", "health_concerns"]

    # Mental status examination (MSE)
    appearance = db.Column(db.Text)
    behavior = db.Column(db.Text)
    speech = db.Column(db.String(100))  # normal, pressured, slow, tangential
    mood = db.Column(db.String(100))  # depressed, anxious, euphoric, irritable, euthymic
    affect = db.Column(db.String(100))  # appropriate, flat, labile, constricted
    thought_process = db.Column(db.String(100))  # logical, tangential, circumstantial, flight_of_ideas
    thought_content = db.Column(db.Text)  # Delusions, obsessions, suicidal ideation, etc.
    perception = db.Column(db.Text)  # Hallucinations, illusions
    cognition = db.Column(db.Text)
    insight = db.Column(db.String(50))  # poor, fair, good
    judgment = db.Column(db.String(50))  # poor, fair, good

    # Psychological testing (if administered)
    tests_administered = db.Column(db.JSON)
    # Example structure:
    # {
    #   "BDI-II": {
    #     "date": "2025-11-20",
    #     "score": 28,
    #     "interpretation": "moderate_depression",
    #     "range": "20-28"
    #   },
    #   "BAI": {"score": 22, "interpretation": "moderate_anxiety"},
    #   "MMPI-2": {"profile": "2-7", "validity": "valid"}
    # }

    # Risk assessment
    suicide_risk = db.Column(db.String(50))  # none, low, moderate, high
    suicide_history = db.Column(db.Text)
    homicide_risk = db.Column(db.String(50))  # none, low, moderate, high
    self_harm_risk = db.Column(db.String(50))  # none, low, moderate, high

    # Crisis indicators
    safety_concerns = db.Column(db.Text)
    protective_factors = db.Column(db.JSON)
    # Examples: ["family_support", "no_access_to_means", "future_orientation", "religious_beliefs"]

    # Diagnosis
    primary_diagnosis = db.Column(db.String(200), nullable=False)
    dsm5_code = db.Column(db.String(50))  # DSM-5 diagnostic code
    secondary_diagnoses = db.Column(db.JSON)  # Array of additional diagnoses
    differential_diagnoses = db.Column(db.JSON)  # Diagnoses to rule out

    comorbidities = db.Column(db.JSON)  # Co-occurring conditions

    # Strengths and resources
    patient_strengths = db.Column(db.JSON)
    # Examples: ["resilient", "motivated", "insight", "social_support", "stable_employment"]

    coping_mechanisms = db.Column(db.Text)
    previous_treatment = db.Column(db.Text)  # What worked, what didn't

    # Treatment plan
    treatment_recommendations = db.Column(db.Text, nullable=False)
    therapy_type = db.Column(db.String(100))
    # Examples: CBT, DBT, psychodynamic, humanistic, EMDR, ACT

    frequency_recommended = db.Column(db.String(100))  # "weekly", "biweekly", "as_needed"
    duration_estimate = db.Column(db.String(100))  # "3 months", "6-12 months", "long_term"

    # Referrals
    psychiatry_referral = db.Column(db.Boolean, default=False)
    medication_recommended = db.Column(db.Boolean, default=False)
    other_referrals = db.Column(db.JSON)
    # Examples: ["neurologist", "nutritionist", "support_group", "occupational_therapy"]

    # Goals
    treatment_goals = db.Column(db.JSON)
    # {
    #   "short_term": ["Reduce anxiety symptoms by 50%", "Establish sleep routine"],
    #   "long_term": ["Return to work", "Maintain stable mood", "Improve relationships"]
    # }

    # Follow-up
    next_evaluation_date = db.Column(db.Date)
    evaluation_date = db.Column(db.Date, nullable=False)

    # Status
    status = db.Column(db.String(50), default='active')  # active, completed, discontinued

    # Notes
    additional_notes = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patient = db.relationship('Patient', backref='psychological_evaluations')
    professional = db.relationship('Professional', backref='psychological_evaluations')
    medical_record = db.relationship('MedicalRecord', backref='psychological_evaluations')
    therapy_sessions = db.relationship('TherapySession', backref='evaluation',
                                       lazy='dynamic', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<PsychologicalEvaluation {self.id} - Patient {self.patient_id}>'


class TherapySession(db.Model):
    """Individual therapy session"""
    __tablename__ = 'therapy_sessions'

    id = db.Column(db.Integer, primary_key=True)
    evaluation_id = db.Column(db.Integer, db.ForeignKey('psychological_evaluations.id'), nullable=False)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    professional_id = db.Column(db.Integer, db.ForeignKey('professionals.id'), nullable=False)

    # Session details
    session_number = db.Column(db.Integer)
    session_date = db.Column(db.Date, nullable=False)
    duration_minutes = db.Column(db.Integer, default=50)

    # Session type
    session_type = db.Column(db.String(100))
    # Examples: individual, couples, family, group

    # Modality
    modality = db.Column(db.String(50), default='in_person')
    # Options: in_person, teletherapy, phone

    # Presenting issues for this session
    presenting_issues = db.Column(db.JSON)
    # Examples: ["anxiety_spike", "relationship_conflict", "work_stress"]

    # Patient status
    patient_mood = db.Column(db.String(50))  # depressed, anxious, neutral, positive, mixed
    patient_affect = db.Column(db.String(50))  # congruent, flat, labile, appropriate
    appearance_behavior = db.Column(db.Text)

    # Session content
    topics_discussed = db.Column(db.JSON)
    # Examples: ["childhood_trauma", "coping_strategies", "relationship_patterns"]

    interventions_used = db.Column(db.JSON)
    # Examples:
    # [
    #   {"technique": "cognitive_restructuring", "target": "negative_thoughts"},
    #   {"technique": "breathing_exercises", "purpose": "anxiety_management"}
    # ]

    therapy_techniques = db.Column(db.JSON)
    # CBT, mindfulness, exposure, EMDR, narrative therapy, etc.

    # Homework/tasks assigned
    homework_assigned = db.Column(db.Text)
    homework_compliance = db.Column(db.String(50))  # not_assigned, completed, partial, not_completed

    # Progress and insights
    insights_gained = db.Column(db.Text)
    behavioral_changes = db.Column(db.Text)
    emotional_regulation = db.Column(db.String(50))  # poor, fair, good, excellent

    # Symptom tracking
    symptom_severity = db.Column(db.JSON)
    # {
    #   "anxiety": {"level": 6, "scale": "0-10"},
    #   "depression": {"level": 4, "scale": "0-10"},
    #   "sleep_quality": {"level": 5, "scale": "0-10"}
    # }

    # Crisis/safety
    crisis_intervention = db.Column(db.Boolean, default=False)
    safety_assessment = db.Column(db.Text)
    risk_level = db.Column(db.String(50))  # none, low, moderate, high

    # Progress evaluation
    progress_rating = db.Column(db.Integer)  # 1-5 scale
    # 1 = Deterioration, 2 = No progress, 3 = Minimal progress, 4 = Good progress, 5 = Significant progress

    goals_progress = db.Column(db.JSON)
    # [
    #   {"goal": "Reduce panic attacks", "status": "in_progress", "progress": "50%"},
    #   {"goal": "Improve sleep", "status": "achieved", "progress": "100%"}
    # ]

    # Therapeutic alliance
    therapeutic_alliance = db.Column(db.String(50))  # poor, fair, good, excellent
    patient_engagement = db.Column(db.String(50))  # resistant, ambivalent, engaged, highly_engaged

    # Barriers to progress
    barriers = db.Column(db.Text)
    challenges_encountered = db.Column(db.Text)

    # Clinical notes
    session_notes = db.Column(db.Text, nullable=False)
    clinical_impressions = db.Column(db.Text)

    # Next session planning
    next_session_plan = db.Column(db.Text)
    focus_areas = db.Column(db.JSON)  # What to work on next session

    # Treatment adjustments
    treatment_plan_changes = db.Column(db.Text)
    referrals_made = db.Column(db.JSON)  # Any referrals during this session

    # Medications (if discussed)
    medication_discussion = db.Column(db.Text)
    medication_compliance = db.Column(db.String(50))  # if applicable

    # Session outcome
    session_outcome = db.Column(db.String(50))  # productive, some_progress, difficult, breakthrough

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patient = db.relationship('Patient', backref='therapy_sessions')
    professional = db.relationship('Professional', backref='therapy_sessions')

    def __repr__(self):
        return f'<TherapySession {self.session_number} - Evaluation {self.evaluation_id}>'
