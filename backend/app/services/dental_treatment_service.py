# -*- coding: utf-8 -*-
"""Dental treatment service layer."""

from datetime import datetime

from app.models.odontogram import DentalTreatment
from app.models.patient import Patient
from app.models.professional import Professional
from app.services.exceptions import ResourceNotFoundError, ValidationError
from app.utils.helpers import validate_required_fields


class DentalTreatmentService:
    """Encapsulates dental treatment business rules."""

    @staticmethod
    def _parse_date(value, error_message='Invalid date format'):
        """Parse ISO date input."""
        try:
            return datetime.fromisoformat(str(value)).date()
        except ValueError as exc:
            raise ValidationError(error_message) from exc

    @staticmethod
    def list_treatments(filters, page, per_page):
        """List treatments with filters and pagination."""
        query = DentalTreatment.query

        patient_id = filters.get('patient_id')
        professional_id = filters.get('professional_id')
        treatment_type = filters.get('treatment_type')
        status = filters.get('status')
        date_from = filters.get('date_from')
        date_to = filters.get('date_to')

        if patient_id:
            query = query.filter_by(patient_id=patient_id)
        if professional_id:
            query = query.filter_by(professional_id=professional_id)
        if treatment_type:
            query = query.filter_by(treatment_type=treatment_type)
        if status:
            query = query.filter_by(status=status)
        if date_from:
            query = query.filter(
                DentalTreatment.treatment_date
                >= DentalTreatmentService._parse_date(date_from, 'Invalid date format')
            )
        if date_to:
            query = query.filter(
                DentalTreatment.treatment_date
                <= DentalTreatmentService._parse_date(date_to, 'Invalid date format')
            )

        return query.order_by(DentalTreatment.treatment_date.desc()).paginate(
            page=page,
            per_page=per_page,
            error_out=False,
        )

    @staticmethod
    def get_treatment(treatment_id):
        """Get treatment by id."""
        treatment = DentalTreatment.query.get(treatment_id)
        if not treatment:
            raise ResourceNotFoundError('Treatment not found')
        return treatment

    @staticmethod
    def create_treatment(data, current_user_id):
        """Create dental treatment."""
        required_fields = ['patient_id', 'treatment_type', 'treatment_date']
        is_valid, missing_fields = validate_required_fields(data, required_fields)
        if not is_valid:
            raise ValidationError('Missing required fields', {'missing_fields': missing_fields})

        patient = Patient.query.get(data['patient_id'])
        if not patient:
            raise ResourceNotFoundError('Patient not found')

        treatment_date = DentalTreatmentService._parse_date(
            data['treatment_date'],
            'Invalid date format',
        )

        professional_id = data.get('professional_id')
        if professional_id:
            professional = Professional.query.get(professional_id)
            if not professional:
                raise ResourceNotFoundError('Professional not found')
        else:
            professional = Professional.query.get(current_user_id)
            if professional:
                professional_id = current_user_id
            else:
                professional = Professional.query.first()
                if not professional:
                    raise ValidationError('No professional available. Please specify professional_id')
                professional_id = professional.id

        treatment = DentalTreatment(
            patient_id=data['patient_id'],
            professional_id=professional_id,
            medical_record_id=data.get('medical_record_id'),
            appointment_id=data.get('appointment_id'),
            treatment_code=data.get('treatment_code'),
            treatment_type=data['treatment_type'],
            affected_teeth=data.get('affected_teeth', []),
            description=data.get('description'),
            materials_used=data.get('materials_used', []),
            technique=data.get('technique'),
            anesthesia_type=data.get('anesthesia_type'),
            anesthesia_details=data.get('anesthesia_details'),
            treatment_date=treatment_date,
            duration_minutes=data.get('duration_minutes'),
            sessions_required=data.get('sessions_required', 1),
            session_number=data.get('session_number', 1),
            status=data.get('status', 'planned'),
            estimated_cost=data.get('estimated_cost'),
            pre_treatment_notes=data.get('pre_treatment_notes'),
            care_instructions=data.get('care_instructions'),
        )

        from app.extensions import db

        db.session.add(treatment)
        db.session.commit()
        return treatment

    @staticmethod
    def update_treatment(treatment_id, data):
        """Update treatment mutable fields."""
        treatment = DentalTreatmentService.get_treatment(treatment_id)

        if 'status' in data:
            treatment.status = data['status']
        if 'description' in data:
            treatment.description = data['description']
        if 'materials_used' in data:
            treatment.materials_used = data['materials_used']
        if 'technique' in data:
            treatment.technique = data['technique']
        if 'duration_minutes' in data:
            treatment.duration_minutes = data['duration_minutes']
        if 'post_treatment_notes' in data:
            treatment.post_treatment_notes = data['post_treatment_notes']
        if 'complications' in data:
            treatment.complications = data['complications']
        if 'final_cost' in data:
            treatment.final_cost = data['final_cost']
        if 'insurance_covered' in data:
            treatment.insurance_covered = data['insurance_covered']
        if 'patient_payment' in data:
            treatment.patient_payment = data['patient_payment']
        if 'care_instructions' in data:
            treatment.care_instructions = data['care_instructions']
        if 'medications_prescribed' in data:
            treatment.medications_prescribed = data['medications_prescribed']
        if 'patient_satisfaction' in data:
            treatment.patient_satisfaction = data['patient_satisfaction']
        if 'treatment_success' in data:
            treatment.treatment_success = data['treatment_success']
        if 'requires_followup' in data:
            treatment.requires_followup = data['requires_followup']
        if 'followup_notes' in data:
            treatment.followup_notes = data['followup_notes']

        if 'completion_date' in data:
            treatment.completion_date = DentalTreatmentService._parse_date(
                data['completion_date'],
                'Invalid completion_date format',
            )
        if 'next_appointment' in data:
            treatment.next_appointment = DentalTreatmentService._parse_date(
                data['next_appointment'],
                'Invalid next_appointment format',
            )
        if 'followup_date' in data:
            treatment.followup_date = DentalTreatmentService._parse_date(
                data['followup_date'],
                'Invalid followup_date format',
            )

        from app.extensions import db

        db.session.commit()
        return treatment

    @staticmethod
    def delete_treatment(treatment_id):
        """Delete treatment by id."""
        treatment = DentalTreatmentService.get_treatment(treatment_id)
        from app.extensions import db

        db.session.delete(treatment)
        db.session.commit()

    @staticmethod
    def get_patient_treatment_history(patient_id, status, page, per_page):
        """Get treatment history for a patient."""
        patient = Patient.query.get(patient_id)
        if not patient:
            raise ResourceNotFoundError('Patient not found')

        query = DentalTreatment.query.filter_by(patient_id=patient_id)
        if status:
            query = query.filter_by(status=status)

        return query.order_by(DentalTreatment.treatment_date.desc()).paginate(
            page=page,
            per_page=per_page,
            error_out=False,
        )

    @staticmethod
    def complete_treatment(treatment_id, data):
        """Mark treatment as completed."""
        treatment = DentalTreatmentService.get_treatment(treatment_id)
        treatment.status = 'completed'
        treatment.completion_date = datetime.utcnow().date()

        if 'completion_notes' in data:
            treatment.post_treatment_notes = data['completion_notes']
        if 'final_cost' in data:
            treatment.final_cost = data['final_cost']
        if 'treatment_success' in data:
            treatment.treatment_success = data['treatment_success']

        from app.extensions import db

        db.session.commit()
        return treatment

    @staticmethod
    def cancel_treatment(treatment_id, data):
        """Cancel a treatment."""
        treatment = DentalTreatmentService.get_treatment(treatment_id)
        treatment.status = 'cancelled'
        if 'cancellation_reason' in data:
            treatment.post_treatment_notes = data['cancellation_reason']

        from app.extensions import db

        db.session.commit()
        return treatment
