# -*- coding: utf-8 -*-
"""
Clinical History Schemas - Marshmallow serialization for clinical history models
"""

from marshmallow import Schema, fields, validates, ValidationError


class PatientNestedSchema(Schema):
    """Simplified patient schema for nested relationships"""
    id = fields.Int(dump_only=True)
    first_name = fields.Str()
    last_name = fields.Str()
    dni = fields.Str()
    email = fields.Str()
    phone = fields.Str()


class ProfessionalNestedSchema(Schema):
    """Simplified professional schema for nested relationships"""
    id = fields.Int(dump_only=True)
    first_name = fields.Str()
    last_name = fields.Str()
    specialty = fields.Str()
    license_number = fields.Str()


class TreatmentNestedSchema(Schema):
    """Simplified treatment schema for nested relationships"""
    id = fields.Int(dump_only=True)
    treatment_type = fields.Str()
    description = fields.Str()
    status = fields.Str()


class EvolutionSchema(Schema):
    """Schema for Evolution model"""
    id = fields.Int(dump_only=True)
    patient_id = fields.Int(required=True)
    professional_id = fields.Int(required=True)
    treatment_plan_id = fields.Int()

    action_performed = fields.Str(required=True)
    notes = fields.Str()
    status = fields.Str()

    professional_signature = fields.Str()
    professional_signed_at = fields.DateTime()
    patient_signature = fields.Str()
    patient_signed_at = fields.DateTime()

    # Nested relationships
    patient = fields.Nested(PatientNestedSchema, dump_only=True)
    professional = fields.Nested(ProfessionalNestedSchema, dump_only=True)
    treatment_plan = fields.Nested(TreatmentNestedSchema, dump_only=True)

    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    @validates('status')
    def validate_status(self, value):
        valid_statuses = ['pending', 'signed', 'annulled']
        if value and value not in valid_statuses:
            raise ValidationError(f'Status must be one of: {", ".join(valid_statuses)}')


class AnamnesisSchema(Schema):
    """Schema for Anamnesis model"""
    id = fields.Int(dump_only=True)
    patient_id = fields.Int(required=True)
    professional_id = fields.Int()

    consultation_reason = fields.Str()
    medical_alerts = fields.List(fields.Str())
    current_medications = fields.List(fields.Str())
    habits = fields.Dict()
    allergies = fields.Str()
    other_conditions = fields.Str()

    is_pregnant = fields.Bool()
    pregnancy_weeks = fields.Int()

    last_dental_visit = fields.Date()
    notes = fields.Str()

    is_active = fields.Bool()

    # Nested relationships
    patient = fields.Nested(PatientNestedSchema, dump_only=True)
    professional = fields.Nested(ProfessionalNestedSchema, dump_only=True)

    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class PeriodontalRecordSchema(Schema):
    """Schema for PeriodontalRecord model"""
    id = fields.Int(dump_only=True)
    patient_id = fields.Int(required=True)
    professional_id = fields.Int(required=True)
    odontogram_id = fields.Int()

    measurement_date = fields.Date(required=True)
    tooth_number = fields.Int(required=True)

    # Probing depths
    probing_depth_mb = fields.Int()
    probing_depth_b = fields.Int()
    probing_depth_db = fields.Int()
    probing_depth_ml = fields.Int()
    probing_depth_l = fields.Int()
    probing_depth_dl = fields.Int()

    # Gingival margins
    margin_mb = fields.Int()
    margin_b = fields.Int()
    margin_db = fields.Int()
    margin_ml = fields.Int()
    margin_l = fields.Int()
    margin_dl = fields.Int()

    furcation = fields.Str()
    mobility = fields.Int()
    bleeding = fields.Bool()
    plaque = fields.Bool()
    suppuration = fields.Bool()
    notes = fields.Str()

    # Nested relationships
    patient = fields.Nested(PatientNestedSchema, dump_only=True)
    professional = fields.Nested(ProfessionalNestedSchema, dump_only=True)

    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    @validates('tooth_number')
    def validate_tooth_number(self, value):
        """Validate FDI tooth numbering"""
        valid_permanent = list(range(11, 19)) + list(range(21, 29)) + \
                         list(range(31, 39)) + list(range(41, 49))
        valid_deciduous = list(range(51, 56)) + list(range(61, 66)) + \
                         list(range(71, 76)) + list(range(81, 86))
        if value not in valid_permanent + valid_deciduous:
            raise ValidationError('Invalid tooth number. Must use FDI notation.')

    @validates('mobility')
    def validate_mobility(self, value):
        if value is not None and value not in [0, 1, 2, 3]:
            raise ValidationError('Mobility must be between 0 and 3')

    @validates('furcation')
    def validate_furcation(self, value):
        valid_values = ['0', 'I', 'II', 'III', None, '']
        if value and value not in valid_values:
            raise ValidationError('Furcation must be 0, I, II, or III')


class PatientDocumentSchema(Schema):
    """Schema for PatientDocument model"""
    id = fields.Int(dump_only=True)
    patient_id = fields.Int(required=True)
    professional_id = fields.Int()
    file_id = fields.Int()

    document_type = fields.Str(required=True)
    title = fields.Str()
    description = fields.Str()

    # File information
    file_name = fields.Str()
    file_path = fields.Str()
    mime_type = fields.Str()
    file_size = fields.Int()

    affected_teeth = fields.List(fields.Int())
    document_date = fields.Date()

    is_active = fields.Bool()

    # Nested relationships
    patient = fields.Nested(PatientNestedSchema, dump_only=True)
    professional = fields.Nested(ProfessionalNestedSchema, dump_only=True)

    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    @validates('document_type')
    def validate_document_type(self, value):
        valid_types = [
            'xray_panoramic', 'xray_periapical', 'xray_bitewing',
            'photo_intraoral', 'photo_extraoral', 'ct_scan', 'mri',
            'lab_result', 'referral', 'radiograph', 'report', 'other'
        ]
        if value not in valid_types:
            raise ValidationError(f'Document type must be one of: {", ".join(valid_types)}')


class PrescriptionSchema(Schema):
    """Schema for Prescription model"""
    id = fields.Int(dump_only=True)
    patient_id = fields.Int(required=True)
    professional_id = fields.Int(required=True)
    treatment_id = fields.Int()

    content = fields.Str(required=True)
    prescription_date = fields.DateTime()
    status = fields.Str()
    professional_signature = fields.Str()
    notes = fields.Str()

    # Nested relationships
    patient = fields.Nested(PatientNestedSchema, dump_only=True)
    professional = fields.Nested(ProfessionalNestedSchema, dump_only=True)
    treatment = fields.Nested(TreatmentNestedSchema, dump_only=True)

    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    @validates('status')
    def validate_status(self, value):
        valid_statuses = ['active', 'annulled']
        if value and value not in valid_statuses:
            raise ValidationError(f'Status must be one of: {", ".join(valid_statuses)}')


class ClinicalDocumentSchema(Schema):
    """Schema for ClinicalDocument model"""
    id = fields.Int(dump_only=True)
    patient_id = fields.Int(required=True)
    professional_id = fields.Int(required=True)

    document_type = fields.Str(required=True)
    title = fields.Str(required=True)
    content = fields.Str()
    template_id = fields.Int()

    is_active = fields.Bool()

    # Nested relationships
    patient = fields.Nested(PatientNestedSchema, dump_only=True)
    professional = fields.Nested(ProfessionalNestedSchema, dump_only=True)

    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    @validates('document_type')
    def validate_document_type(self, value):
        valid_types = [
            'medical_certificate', 'referral', 'treatment_report',
            'clinical_summary', 'discharge_summary', 'fitness_certificate', 'other'
        ]
        if value not in valid_types:
            raise ValidationError(f'Document type must be one of: {", ".join(valid_types)}')


class InformedConsentSchema(Schema):
    """Schema for InformedConsent model"""
    id = fields.Int(dump_only=True)
    patient_id = fields.Int(required=True)
    professional_id = fields.Int(required=True)
    treatment_id = fields.Int()

    consent_type = fields.Str(required=True)
    title = fields.Str(required=True)
    content = fields.Str()
    status = fields.Str()

    patient_signature = fields.Str()
    patient_signed_at = fields.DateTime()

    guardian_name = fields.Str()
    guardian_relationship = fields.Str()
    guardian_signature = fields.Str()
    guardian_signed_at = fields.DateTime()

    witness_professional_id = fields.Int()
    rejected_reason = fields.Str()

    # Nested relationships
    patient = fields.Nested(PatientNestedSchema, dump_only=True)
    professional = fields.Nested(ProfessionalNestedSchema, dump_only=True)
    witness = fields.Nested(ProfessionalNestedSchema, dump_only=True)
    treatment = fields.Nested(TreatmentNestedSchema, dump_only=True)

    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    @validates('consent_type')
    def validate_consent_type(self, value):
        valid_types = [
            'general_treatment', 'extraction', 'root_canal', 'surgery',
            'implant', 'orthodontics', 'sedation', 'anesthesia', 'radiography', 'other'
        ]
        if value not in valid_types:
            raise ValidationError(f'Consent type must be one of: {", ".join(valid_types)}')

    @validates('status')
    def validate_status(self, value):
        valid_statuses = ['pending', 'signed', 'rejected', 'annulled']
        if value and value not in valid_statuses:
            raise ValidationError(f'Status must be one of: {", ".join(valid_statuses)}')


class ClinicalHistoryEventSchema(Schema):
    """Schema for ClinicalHistoryEvent model"""
    id = fields.Int(dump_only=True)
    patient_id = fields.Int(required=True)
    professional_id = fields.Int()

    event_type = fields.Str(required=True)
    reference_type = fields.Str()
    reference_id = fields.Int()

    title = fields.Str()
    description = fields.Str()
    event_date = fields.DateTime()

    is_important = fields.Bool()
    is_active = fields.Bool()

    # Nested relationships
    patient = fields.Nested(PatientNestedSchema, dump_only=True)
    professional = fields.Nested(ProfessionalNestedSchema, dump_only=True)

    created_at = fields.DateTime(dump_only=True)

    @validates('event_type')
    def validate_event_type(self, value):
        valid_types = [
            'appointment', 'evolution', 'prescription', 'document',
            'consent', 'treatment_start', 'treatment_end', 'note', 'alert'
        ]
        if value not in valid_types:
            raise ValidationError(f'Event type must be one of: {", ".join(valid_types)}')
