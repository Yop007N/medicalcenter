# -*- coding: utf-8 -*-
"""Patient service layer."""

from datetime import datetime

from app.extensions import db
from app.models.appointment import Appointment
from app.models.budget import Budget
from app.models.medical_record import MedicalRecord
from app.models.odontogram import Odontogram
from app.models.patient import Patient
from app.models.professional import Professional
from app.models.professional_patient_assignment import ProfessionalPatientAssignment
from app.models.user import User
from app.services.access_scope_service import AccessScopeService
from app.services.auth_service import AuthService
from app.services.exceptions import AccessDeniedError, ResourceNotFoundError, ValidationError
from app.services.patient_access_service import PatientAccessService
from app.utils.helpers import sanitize_search_input, validate_required_fields


class PatientService:
    """Encapsulates patient CRUD and related resources."""

    @staticmethod
    def _parse_date(value):
        """Parse date inputs used by patient payloads."""
        if value in (None, ''):
            return None
        if isinstance(value, str):
            try:
                return datetime.strptime(value[:10], '%Y-%m-%d').date()
            except ValueError as exc:
                raise ValidationError('Invalid date format. Use YYYY-MM-DD') from exc
        return value

    @staticmethod
    def _ensure_patient_exists(patient_id):
        """Get patient or raise not found."""
        patient = Patient.query.get(patient_id)
        if not patient:
            raise ResourceNotFoundError('Patient not found')
        return patient

    @staticmethod
    def _ensure_access(current_user_id, patient_id):
        """Validate actor can access patient."""
        if not PatientAccessService.can_access_patient(current_user_id, patient_id):
            raise AccessDeniedError('Unauthorized')

    @staticmethod
    def _resolve_professional_specialty_key(professional_id):
        """Resolve specialty module key for assignment metadata."""
        try:
            professional_id = int(professional_id)
        except (TypeError, ValueError):
            return None

        professional = Professional.query.get(professional_id)
        if not professional:
            return None

        return AccessScopeService.resolve_specialty_key(getattr(professional, 'specialty', None))

    @staticmethod
    def _assign_patient_to_professional(patient_id, professional_id, specialty_key=None):
        """Create explicit professional-patient assignment when missing."""
        if not professional_id:
            return

        try:
            professional_id = int(professional_id)
        except (TypeError, ValueError) as exc:
            raise ValidationError('Assigned professional id is invalid') from exc

        professional = Professional.query.get(professional_id)
        if not professional:
            raise ValidationError('Assigned professional not found')

        existing_assignment = ProfessionalPatientAssignment.query.filter_by(
            professional_id=professional.id,
            patient_id=patient_id,
        ).first()
        if existing_assignment:
            if specialty_key and existing_assignment.specialty_key != specialty_key:
                existing_assignment.specialty_key = specialty_key
            return

        assignment = ProfessionalPatientAssignment(
            professional_id=professional.id,
            patient_id=patient_id,
            specialty_key=specialty_key,
        )
        db.session.add(assignment)

    @staticmethod
    def list_patients(current_user_id, search=None, specialty_key=None):
        """List patients with optional free-text search."""
        current_user = User.query.get(current_user_id)
        if not current_user or current_user.role not in ['admin', 'professional']:
            raise AccessDeniedError('Unauthorized')

        query = Patient.query
        if current_user.role == 'professional':
            scoped_patient_ids = list(
                AccessScopeService.get_professional_patient_ids(
                    current_user.id,
                    specialty_key=specialty_key,
                )
            )
            if not scoped_patient_ids:
                return []
            query = query.filter(Patient.id.in_(scoped_patient_ids))
        if search:
            sanitized_search = sanitize_search_input(search)
            if sanitized_search:
                search_filter = f'%{sanitized_search}%'
                query = query.filter(
                    db.or_(
                        Patient.first_name.ilike(search_filter),
                        Patient.last_name.ilike(search_filter),
                        Patient.email.ilike(search_filter),
                    )
                )
        return query.all()

    @staticmethod
    def get_patient(patient_id, current_user_id):
        """Get patient detail with access control."""
        patient = PatientService._ensure_patient_exists(patient_id)
        PatientService._ensure_access(current_user_id, patient.id)
        return patient

    @staticmethod
    def create_patient(data, current_user_id=None):
        """Create patient with auth/password validation."""
        required_fields = ['email', 'password', 'first_name', 'last_name']
        is_valid, missing_fields = validate_required_fields(data, required_fields)
        if not is_valid:
            raise ValidationError('Missing required fields', {'missing_fields': missing_fields})

        try:
            AuthService.validate_password(data['password'])
        except ValueError as exc:
            raise ValidationError(str(exc)) from exc

        if Patient.query.filter_by(email=data['email']).first():
            raise ValidationError('Email already registered')

        patient = Patient(
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            role='patient',
            date_of_birth=PatientService._parse_date(data.get('date_of_birth')),
            phone=data.get('phone'),
            address=data.get('address'),
            emergency_contact=data.get('emergency_contact'),
            emergency_phone=data.get('emergency_phone'),
            blood_type=data.get('blood_type'),
            allergies=data.get('allergies'),
            medical_history=data.get('medical_history'),
        )
        patient.set_password(data['password'])

        try:
            db.session.add(patient)
            db.session.flush()

            assigned_professional_id = data.get('professional_id')
            if assigned_professional_id is None and current_user_id is not None:
                creator = User.query.get(int(current_user_id))
                if creator and creator.role == 'professional':
                    assigned_professional_id = creator.id

            if assigned_professional_id is not None:
                resolved_specialty_key = PatientService._resolve_professional_specialty_key(
                    assigned_professional_id
                )
                PatientService._assign_patient_to_professional(
                    patient_id=patient.id,
                    professional_id=assigned_professional_id,
                    specialty_key=resolved_specialty_key,
                )

            db.session.commit()
            return patient
        except Exception:
            db.session.rollback()
            raise

    @staticmethod
    def update_patient(patient_id, current_user_id, data):
        """Update patient record."""
        patient = PatientService._ensure_patient_exists(patient_id)
        PatientService._ensure_access(current_user_id, patient.id)

        updatable_fields = [
            'first_name',
            'last_name',
            'phone',
            'address',
            'emergency_contact',
            'emergency_phone',
            'blood_type',
            'allergies',
            'medical_history',
            'is_active',
        ]

        for field in updatable_fields:
            if field in data:
                setattr(patient, field, data[field])

        if 'date_of_birth' in data:
            patient.date_of_birth = PatientService._parse_date(data['date_of_birth'])

        if 'password' in data:
            patient.set_password(data['password'])

        db.session.commit()
        return patient

    @staticmethod
    def delete_patient(patient_id, current_user_id):
        """Delete patient with actor scope checks."""
        patient = PatientService._ensure_patient_exists(patient_id)

        current_user = User.query.get(current_user_id)
        if not current_user or current_user.role not in ['admin', 'professional']:
            raise AccessDeniedError('Unauthorized')

        if current_user.role == 'professional':
            PatientService._ensure_access(current_user_id, patient_id)

        db.session.delete(patient)
        db.session.commit()

    @staticmethod
    def get_patient_medical_history(patient_id, current_user_id):
        """Get patient medical history using relationship."""
        patient = PatientService._ensure_patient_exists(patient_id)
        PatientService._ensure_access(current_user_id, patient.id)
        return patient.medical_records.order_by(db.desc('record_date')).all()

    @staticmethod
    def get_patient_appointments(patient_id, current_user_id):
        """Get appointments for patient."""
        patient = PatientService._ensure_patient_exists(patient_id)
        PatientService._ensure_access(current_user_id, patient.id)
        return Appointment.query.filter_by(patient_id=patient_id).order_by(
            Appointment.appointment_date.desc()
        ).all()

    @staticmethod
    def get_patient_medical_records(patient_id, current_user_id):
        """Get medical records for patient."""
        patient = PatientService._ensure_patient_exists(patient_id)
        PatientService._ensure_access(current_user_id, patient.id)
        return MedicalRecord.query.filter_by(patient_id=patient_id).order_by(
            MedicalRecord.record_date.desc()
        ).all()

    @staticmethod
    def get_patient_budgets(patient_id, current_user_id):
        """Get budgets for patient."""
        patient = PatientService._ensure_patient_exists(patient_id)
        PatientService._ensure_access(current_user_id, patient.id)
        return Budget.query.filter_by(patient_id=patient_id).order_by(
            Budget.created_at.desc()
        ).all()

    @staticmethod
    def get_patient_odontogram(patient_id, current_user_id):
        """Get active odontogram for patient within access scope."""
        patient = PatientService._ensure_patient_exists(patient_id)
        PatientService._ensure_access(current_user_id, patient.id)

        odontogram = Odontogram.query.filter_by(
            patient_id=patient.id,
            is_active=True,
        ).first()
        if not odontogram:
            raise ResourceNotFoundError('No active odontogram found for this patient')

        return odontogram
