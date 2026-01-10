# -*- coding: utf-8 -*-
"""
Marshmallow Schemas for serialization and validation
"""

from app.schemas.user_schema import UserSchema
from app.schemas.professional_schema import ProfessionalSchema
from app.schemas.patient_schema import PatientSchema
from app.schemas.appointment_schema import AppointmentSchema
from app.schemas.medical_record_schema import MedicalRecordSchema
from app.schemas.file_schema import FileSchema
from app.schemas.budget_schema import BudgetSchema
from app.schemas.payment_schema import PaymentSchema

__all__ = [
    'UserSchema',
    'ProfessionalSchema',
    'PatientSchema',
    'AppointmentSchema',
    'MedicalRecordSchema',
    'FileSchema',
    'BudgetSchema',
    'PaymentSchema'
]
