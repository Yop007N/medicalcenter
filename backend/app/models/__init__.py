# -*- coding: utf-8 -*-
"""
SQLAlchemy Models
"""

from app.models.user import User
from app.models.professional import Professional
from app.models.patient import Patient
from app.models.professional_patient_assignment import ProfessionalPatientAssignment
from app.models.appointment import Appointment
from app.models.medical_record import MedicalRecord
from app.models.file import File
from app.models.budget import Budget
from app.models.payment import Payment
from app.models.sync_log import SyncLog
from app.models.audit_log import AuditLog
from app.models.odontogram import Odontogram, Tooth, DentalTreatment
from app.models.psychopedagogy import PsychopedagogicalEvaluation, InterventionSession
from app.models.psychology import PsychologicalEvaluation, TherapySession
from app.models.specialty_encounter import SpecialtyEncounter
from app.models.clinical_history import (
    Evolution, Anamnesis, PeriodontalRecord, PatientDocument,
    Prescription, ClinicalDocument, InformedConsent, ClinicalHistoryEvent
)

__all__ = [
    'User',
    'Professional',
    'Patient',
    'ProfessionalPatientAssignment',
    'Appointment',
    'MedicalRecord',
    'File',
    'Budget',
    'Payment',
    'SyncLog',
    'AuditLog',
    'Odontogram',
    'Tooth',
    'DentalTreatment',
    'PsychopedagogicalEvaluation',
    'InterventionSession',
    'PsychologicalEvaluation',
    'TherapySession',
    'SpecialtyEncounter',
    'Evolution',
    'Anamnesis',
    'PeriodontalRecord',
    'PatientDocument',
    'Prescription',
    'ClinicalDocument',
    'InformedConsent',
    'ClinicalHistoryEvent'
]
