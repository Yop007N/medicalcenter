# -*- coding: utf-8 -*-
"""Professional service layer."""

from datetime import datetime, time, timedelta

from app.extensions import db
from app.models.appointment import Appointment
from app.models.medical_record import MedicalRecord
from app.models.odontogram import DentalTreatment
from app.models.psychology import PsychologicalEvaluation
from app.models.psychopedagogy import PsychopedagogicalEvaluation
from app.models.professional import Professional
from app.models.user import User
from app.services.exceptions import AccessDeniedError, ResourceNotFoundError, ValidationError
from app.utils.helpers import sanitize_search_input, validate_required_fields


class ProfessionalService:
    """Encapsulates professional CRUD rules."""

    @staticmethod
    def _coerce_bool(value):
        """Coerce common payload values to boolean."""
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            lowered = value.strip().lower()
            if lowered in {'true', '1', 'yes'}:
                return True
            if lowered in {'false', '0', 'no'}:
                return False
        return bool(value)

    @staticmethod
    def list_professionals(specialty=None, current_user_id=None):
        """List professionals with optional specialty filter."""
        query = Professional.query

        if current_user_id is not None:
            current_user = User.query.get(current_user_id)
            if current_user and current_user.role == 'patient':
                patient_id = current_user.id
                query = query.filter(
                    db.or_(
                        db.exists().where(
                            db.and_(
                                Appointment.professional_id == Professional.id,
                                Appointment.patient_id == patient_id,
                            )
                        ),
                        db.exists().where(
                            db.and_(
                                MedicalRecord.professional_id == Professional.id,
                                MedicalRecord.patient_id == patient_id,
                            )
                        ),
                        db.exists().where(
                            db.and_(
                                DentalTreatment.professional_id == Professional.id,
                                DentalTreatment.patient_id == patient_id,
                            )
                        ),
                        db.exists().where(
                            db.and_(
                                PsychologicalEvaluation.professional_id == Professional.id,
                                PsychologicalEvaluation.patient_id == patient_id,
                            )
                        ),
                        db.exists().where(
                            db.and_(
                                PsychopedagogicalEvaluation.professional_id == Professional.id,
                                PsychopedagogicalEvaluation.patient_id == patient_id,
                            )
                        ),
                    )
                )

        if specialty:
            sanitized_specialty = sanitize_search_input(specialty)
            if sanitized_specialty:
                query = query.filter(Professional.specialty.ilike(f'%{sanitized_specialty}%'))
        return query.all()

    @staticmethod
    def get_professional(professional_id):
        """Get professional by id."""
        professional = Professional.query.get(professional_id)
        if not professional:
            raise ResourceNotFoundError('Professional not found')
        return professional

    @staticmethod
    def create_professional(data):
        """Create professional user."""
        required_fields = ['email', 'password', 'first_name', 'last_name', 'license_number']
        is_valid, missing_fields = validate_required_fields(data, required_fields)
        if not is_valid:
            raise ValidationError('Missing required fields', {'missing_fields': missing_fields})

        if Professional.query.filter_by(email=data['email']).first():
            raise ValidationError('Email already registered')

        if Professional.query.filter_by(license_number=data['license_number']).first():
            raise ValidationError('License number already registered')

        professional = Professional(
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            role='professional',
            license_number=data['license_number'],
            specialty=data.get('specialty'),
            phone=data.get('phone'),
            address=data.get('address') or data.get('office_address'),
        )
        professional.set_password(data['password'])

        db.session.add(professional)
        db.session.commit()
        return professional

    @staticmethod
    def update_professional(professional_id, current_user_id, data):
        """Update professional profile with access checks."""
        professional = Professional.query.get(professional_id)
        if not professional:
            raise ResourceNotFoundError('Professional not found')

        if professional.id != current_user_id:
            current_user = User.query.get(current_user_id)
            if not current_user or current_user.role != 'admin':
                raise AccessDeniedError('Unauthorized')

        if 'first_name' in data:
            professional.first_name = data['first_name']
        if 'last_name' in data:
            professional.last_name = data['last_name']
        if 'specialty' in data:
            professional.specialty = data['specialty']
        if 'phone' in data:
            professional.phone = data['phone']
        if 'address' in data:
            professional.address = data['address']
        if 'office_address' in data:
            professional.address = data['office_address']
        if 'license_number' in data:
            existing = Professional.query.filter(
                Professional.license_number == data['license_number'],
                Professional.id != professional.id,
            ).first()
            if existing:
                raise ValidationError('License number already registered')
            professional.license_number = data['license_number']
        if 'is_active' in data:
            professional.is_active = ProfessionalService._coerce_bool(data['is_active'])
        if 'password' in data:
            professional.set_password(data['password'])

        db.session.commit()
        return professional

    @staticmethod
    def delete_professional(professional_id):
        """Delete professional by id."""
        professional = Professional.query.get(professional_id)
        if not professional:
            raise ResourceNotFoundError('Professional not found')
        db.session.delete(professional)
        db.session.commit()

    @staticmethod
    def get_professional_appointments(professional_id):
        """Get professional appointments."""
        professional = ProfessionalService.get_professional(professional_id)
        return professional.appointments.all()

    @staticmethod
    def list_professionals_with_availability(
        current_user_id,
        specialty=None,
        date_from=None,
        days=7,
        slots_per_professional=6,
        slot_minutes=30,
        start_hour=8,
        end_hour=18,
    ):
        """Return active professionals and nearest available slots in date window."""
        current_user = User.query.get(current_user_id)
        if not current_user:
            raise AccessDeniedError('Unauthorized')

        try:
            days = int(days)
        except (TypeError, ValueError) as exc:
            raise ValidationError('days must be an integer') from exc
        days = max(1, min(days, 30))

        try:
            slots_per_professional = int(slots_per_professional)
        except (TypeError, ValueError) as exc:
            raise ValidationError('slots_per_professional must be an integer') from exc
        slots_per_professional = max(1, min(slots_per_professional, 24))

        if slot_minutes not in (15, 20, 30, 60):
            raise ValidationError('slot_minutes must be one of: 15, 20, 30, 60')

        if start_hour < 0 or end_hour > 24 or start_hour >= end_hour:
            raise ValidationError('Invalid working hours range')

        window_start = datetime.utcnow()
        if date_from:
            try:
                parsed = datetime.fromisoformat(str(date_from).strip())
            except ValueError as exc:
                raise ValidationError('Invalid date_from format') from exc
            window_start = max(window_start, parsed)

        window_end = window_start + timedelta(days=days)

        query = Professional.query.filter(Professional.is_active.is_(True))
        if specialty:
            sanitized_specialty = sanitize_search_input(specialty)
            if sanitized_specialty:
                query = query.filter(Professional.specialty.ilike(f'%{sanitized_specialty}%'))

        professionals = query.order_by(Professional.first_name, Professional.last_name).all()
        if not professionals:
            return []

        professional_ids = [professional.id for professional in professionals]

        appointments = (
            Appointment.query.filter(
                Appointment.professional_id.in_(professional_ids),
                Appointment.appointment_date >= window_start,
                Appointment.appointment_date <= window_end,
                Appointment.status.in_(['scheduled', 'confirmed', 'pending']),
            )
            .order_by(Appointment.appointment_date.asc())
            .all()
        )

        busy_slots_by_professional = {professional_id: set() for professional_id in professional_ids}
        for appointment in appointments:
            if appointment.professional_id not in busy_slots_by_professional:
                continue
            busy_slots_by_professional[appointment.professional_id].add(
                appointment.appointment_date.replace(second=0, microsecond=0)
            )

        response = []
        for professional in professionals:
            available_slots = []
            current_day = window_start.date()
            end_day = window_end.date()

            while current_day <= end_day and len(available_slots) < slots_per_professional:
                if current_day.weekday() >= 6:
                    current_day += timedelta(days=1)
                    continue

                slot_dt = datetime.combine(current_day, time(hour=start_hour, minute=0))
                day_end_dt = datetime.combine(current_day, time(hour=end_hour, minute=0))

                while slot_dt < day_end_dt and len(available_slots) < slots_per_professional:
                    normalized_slot = slot_dt.replace(second=0, microsecond=0)
                    if (
                        normalized_slot >= window_start
                        and normalized_slot not in busy_slots_by_professional.get(professional.id, set())
                    ):
                        available_slots.append(normalized_slot)
                    slot_dt += timedelta(minutes=slot_minutes)

                current_day += timedelta(days=1)

            if not available_slots:
                continue

            response.append({
                'id': professional.id,
                'first_name': professional.first_name,
                'last_name': professional.last_name,
                'email': professional.email,
                'specialty': professional.specialty,
                'next_available_slot': available_slots[0].isoformat(),
                'available_slots': [slot.isoformat() for slot in available_slots],
                'available_count': len(available_slots),
            })

        response.sort(key=lambda item: item['next_available_slot'])
        return response
