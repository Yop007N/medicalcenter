# -*- coding: utf-8 -*-
"""
Odontology Schemas - Marshmallow serialization
"""

from marshmallow import Schema, fields, validates, ValidationError


class PatientNestedSchema(Schema):
    """Simplified patient schema to avoid circular imports"""
    id = fields.Int(dump_only=True)
    first_name = fields.Str()
    last_name = fields.Str()
    dni = fields.Str()
    email = fields.Str()
    phone = fields.Str()


class ProfessionalNestedSchema(Schema):
    """Simplified professional schema to avoid circular imports"""
    id = fields.Int(dump_only=True)
    first_name = fields.Str()
    last_name = fields.Str()
    specialty = fields.Str()
    license_number = fields.Str()


class ToothSchema(Schema):
    """Schema for individual tooth"""
    id = fields.Int(dump_only=True)
    odontogram_id = fields.Int(required=True)
    tooth_number = fields.Int(required=True)
    tooth_type = fields.Str()

    # Status
    status = fields.Str()

    # Surfaces
    mesial = fields.Str()
    distal = fields.Str()
    oclusal = fields.Str()
    vestibular = fields.Str()
    lingual = fields.Str()

    # Clinical data
    notes = fields.Str()
    sensitivity = fields.Str()
    mobility = fields.Int()
    gingival_status = fields.Str()
    pocket_depth = fields.Int()

    # Treatment planning
    planned_treatment = fields.Str()
    treatment_priority = fields.Str()

    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    @validates('tooth_number')
    def validate_tooth_number(self, value):
        """Validate FDI tooth numbering"""
        # Permanent teeth: 11-18, 21-28, 31-38, 41-48
        # Deciduous teeth: 51-55, 61-65, 71-75, 81-85
        valid_permanent = list(range(11, 19)) + list(range(21, 29)) + \
                         list(range(31, 39)) + list(range(41, 49))
        valid_deciduous = list(range(51, 56)) + list(range(61, 66)) + \
                         list(range(71, 76)) + list(range(81, 86))

        if value not in valid_permanent + valid_deciduous:
            raise ValidationError('Invalid tooth number. Must use FDI notation.')

    @validates('status')
    def validate_status(self, value):
        """Validate tooth status"""
        valid_statuses = [
            'healthy', 'caries', 'filled', 'crown', 'implant', 'missing',
            'root_canal', 'fractured', 'mobile', 'to_extract', 'extracted'
        ]
        if value and value not in valid_statuses:
            raise ValidationError(f'Status must be one of: {", ".join(valid_statuses)}')


class OdontogramSchema(Schema):
    """Schema for odontogram"""
    id = fields.Int(dump_only=True)
    patient_id = fields.Int(required=True)
    professional_id = fields.Int(required=True)

    # Nested relationships (dump_only - readonly)
    patient = fields.Nested(PatientNestedSchema, dump_only=True)
    professional = fields.Nested(ProfessionalNestedSchema, dump_only=True)

    notes = fields.Str()
    is_active = fields.Bool()

    # Nested teeth
    teeth = fields.List(fields.Nested(ToothSchema), dump_only=True)

    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class DentalTreatmentSchema(Schema):
    """Schema for dental treatment"""
    id = fields.Int(dump_only=True)
    patient_id = fields.Int(required=True)
    professional_id = fields.Int(required=True)
    medical_record_id = fields.Int()
    appointment_id = fields.Int()

    # Nested relationships (dump_only - readonly)
    patient = fields.Nested(PatientNestedSchema, dump_only=True)
    professional = fields.Nested(ProfessionalNestedSchema, dump_only=True)

    # Treatment identification
    treatment_code = fields.Str()
    treatment_type = fields.Str(required=True)

    # Affected teeth
    affected_teeth = fields.List(fields.Int())

    # Details
    description = fields.Str()
    materials_used = fields.List(fields.Str())
    technique = fields.Str()

    # Anesthesia
    anesthesia_type = fields.Str()
    anesthesia_details = fields.Str()

    # Dates
    treatment_date = fields.Date(required=True)
    duration_minutes = fields.Int()
    sessions_required = fields.Int()
    session_number = fields.Int()

    # Status
    status = fields.Str()
    completion_date = fields.Date()
    next_appointment = fields.Date()

    # Financial
    estimated_cost = fields.Decimal(as_string=True)
    final_cost = fields.Decimal(as_string=True)
    insurance_covered = fields.Decimal(as_string=True)
    patient_payment = fields.Decimal(as_string=True)

    # Notes
    pre_treatment_notes = fields.Str()
    post_treatment_notes = fields.Str()
    complications = fields.Str()
    care_instructions = fields.Str()
    medications_prescribed = fields.List(fields.Dict())

    # Quality
    patient_satisfaction = fields.Int()
    treatment_success = fields.Bool()

    # Follow-up
    requires_followup = fields.Bool()
    followup_date = fields.Date()
    followup_notes = fields.Str()

    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    @validates('treatment_type')
    def validate_treatment_type(self, value):
        """Validate treatment type"""
        valid_types = [
            'filling', 'root_canal', 'extraction', 'cleaning', 'crown',
            'implant', 'orthodontics', 'whitening', 'veneer', 'bridge',
            'denture', 'scaling', 'surgery', 'consultation', 'emergency'
        ]
        if value and value not in valid_types:
            raise ValidationError(f'Treatment type must be one of: {", ".join(valid_types)}')

    @validates('status')
    def validate_status(self, value):
        """Validate treatment status"""
        valid_statuses = ['planned', 'in_progress', 'completed', 'cancelled', 'postponed']
        if value and value not in valid_statuses:
            raise ValidationError(f'Status must be one of: {", ".join(valid_statuses)}')
