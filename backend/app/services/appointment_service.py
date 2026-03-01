# -*- coding: utf-8 -*-
"""
Appointment Service - Business logic for appointment management
"""

from datetime import datetime

from app.extensions import db
from app.models.appointment import Appointment
from app.models.professional_patient_assignment import ProfessionalPatientAssignment
from app.models.user import User
from app.services.access_scope_service import AccessScopeService
from app.services.appointment_policy import AppointmentAccessPolicy
from app.services.appointment_repository import AppointmentRepository
from app.services.exceptions import (
    AccessDeniedError,
    ConflictError,
    ResourceNotFoundError,
    ValidationError,
)
from app.utils.constants import DEFAULT_APPOINTMENT_DURATION


class AppointmentService:
    """Appointment business rules and authorization orchestration."""

    repository = AppointmentRepository
    policy = AppointmentAccessPolicy

    @classmethod
    def get_current_user(cls, user_id):
        """Resolve authenticated user or raise access error."""
        if user_id is None:
            raise AccessDeniedError("Authentication required")
        try:
            parsed_user_id = int(user_id)
        except (TypeError, ValueError) as exc:
            raise AccessDeniedError("Invalid user session") from exc

        user = User.query.get(parsed_user_id)
        if not user:
            raise AccessDeniedError("User not found")
        return user

    @classmethod
    def get_appointments(cls, current_user, filters=None, page=1, per_page=20):
        """Get paginated appointments honoring role-based visibility."""
        scoped_filters = cls.policy.scope_filters(current_user, filters or {})
        cls._apply_specialty_scope_filter(current_user, scoped_filters)
        if scoped_filters.get("date_from"):
            scoped_filters["date_from"] = cls._parse_iso_datetime(
                scoped_filters["date_from"],
                "date_from",
            )
        if scoped_filters.get("date_to"):
            scoped_filters["date_to"] = cls._parse_iso_datetime(
                scoped_filters["date_to"],
                "date_to",
            )
        return cls.repository.list_paginated(
            filters=scoped_filters,
            page=page,
            per_page=per_page,
        )

    @classmethod
    def _apply_specialty_scope_filter(cls, current_user, scoped_filters):
        """Normalize and enforce specialty_key scope for listing endpoints."""
        raw_key = scoped_filters.pop("specialty_key", None)
        normalized_key = AccessScopeService.normalize_text(raw_key)
        if not normalized_key:
            return

        from app.services.specialty_module_service import SpecialtyModuleService

        module = SpecialtyModuleService.get_module_by_key(normalized_key)
        if not module:
            raise ValidationError("Invalid specialty_key")
        module_key = module.get("key")

        if current_user.role == "professional":
            professional_specialty_key = AccessScopeService.resolve_specialty_key(
                getattr(current_user, "specialty", None)
            )
            if professional_specialty_key != module_key:
                raise AccessDeniedError("Professional can only query appointments for own specialty")
            scoped_filters["professional_ids"] = [current_user.id]
            scoped_filters["professional_id"] = current_user.id
            return

        professional_ids = sorted(
            SpecialtyModuleService.get_professional_ids_for_module(module_key)
        )

        requested_professional_id = scoped_filters.get("professional_id")
        if requested_professional_id:
            if int(requested_professional_id) in professional_ids:
                scoped_filters["professional_ids"] = [int(requested_professional_id)]
            else:
                scoped_filters["professional_ids"] = []
        else:
            scoped_filters["professional_ids"] = professional_ids

    @classmethod
    def get_appointment(cls, current_user, appointment_id):
        """Get one appointment with access control."""
        appointment = cls.repository.get_by_id(appointment_id)
        if not appointment:
            raise ResourceNotFoundError("Appointment not found")

        if not cls.policy.can_access(current_user, appointment):
            raise AccessDeniedError("Unauthorized")
        return appointment

    @classmethod
    def create_appointment(cls, current_user, data):
        """Create new appointment with validation and conflict detection."""
        cls._validate_required_fields(data, ["patient_id", "professional_id", "appointment_date"])
        cls._validate_create_access(current_user, data)

        appointment_date = cls._parse_iso_datetime(data["appointment_date"], "appointment_date")
        try:
            patient_id = int(data["patient_id"])
        except (TypeError, ValueError) as exc:
            raise ValidationError("Invalid patient_id") from exc
        if patient_id <= 0:
            raise ValidationError("patient_id must be a positive integer")

        professional_id = int(data["professional_id"])
        try:
            duration_minutes = int(
                data.get("duration_minutes", DEFAULT_APPOINTMENT_DURATION)
            )
        except (TypeError, ValueError) as exc:
            raise ValidationError("duration_minutes must be an integer") from exc
        if duration_minutes <= 0:
            raise ValidationError("duration_minutes must be a positive integer")

        if current_user.role == "professional":
            cls._ensure_professional_patient_scope(
                current_user=current_user,
                patient_id=patient_id,
                allow_auto_assign=True,
            )

        cls.repository.lock_professional(professional_id)

        if cls.repository.find_conflict(
            professional_id=professional_id,
            appointment_date=appointment_date,
            duration_minutes=duration_minutes,
        ):
            raise ConflictError("Time slot already booked")

        appointment = Appointment(
            patient_id=patient_id,
            professional_id=professional_id,
            appointment_date=appointment_date,
            duration_minutes=duration_minutes,
            status="scheduled",
            appointment_type=data.get("appointment_type"),
            reason=data.get("reason"),
            notes=data.get("notes"),
        )
        return cls.repository.create(appointment)

    @classmethod
    def update_appointment(cls, current_user, appointment_id, data):
        """Update appointment fields safely."""
        appointment = cls.get_appointment(current_user=current_user, appointment_id=appointment_id)
        cls._validate_update_access(current_user, appointment, data)

        next_patient_id = appointment.patient_id
        next_professional_id = appointment.professional_id
        next_date = appointment.appointment_date
        next_duration = int(appointment.duration_minutes or DEFAULT_APPOINTMENT_DURATION)

        if "patient_id" in data and data["patient_id"] is not None:
            try:
                next_patient_id = int(data["patient_id"])
            except (TypeError, ValueError) as exc:
                raise ValidationError("Invalid patient_id") from exc
            if next_patient_id <= 0:
                raise ValidationError("patient_id must be a positive integer")

        if "professional_id" in data and data["professional_id"] is not None:
            next_professional_id = int(data["professional_id"])
        if "appointment_date" in data and data["appointment_date"] is not None:
            next_date = cls._parse_iso_datetime(data["appointment_date"], "appointment_date")
        if "duration_minutes" in data and data["duration_minutes"] is not None:
            try:
                next_duration = int(data["duration_minutes"])
            except (TypeError, ValueError) as exc:
                raise ValidationError("duration_minutes must be an integer") from exc
        if next_duration <= 0:
            raise ValidationError("duration_minutes must be a positive integer")

        if current_user.role == "professional":
            cls._ensure_professional_patient_scope(
                current_user=current_user,
                patient_id=next_patient_id,
                allow_auto_assign=True,
            )

        cls.repository.lock_professional(next_professional_id)

        if (
            next_professional_id != appointment.professional_id
            or next_date != appointment.appointment_date
            or next_duration != int(appointment.duration_minutes or DEFAULT_APPOINTMENT_DURATION)
        ) and cls.repository.find_conflict(
            professional_id=next_professional_id,
            appointment_date=next_date,
            duration_minutes=next_duration,
            exclude_id=appointment.id,
        ):
            raise ConflictError("Time slot already booked")

        if "patient_id" in data and data["patient_id"] is not None:
            appointment.patient_id = next_patient_id
        if "professional_id" in data and data["professional_id"] is not None:
            appointment.professional_id = next_professional_id
        if "appointment_date" in data and data["appointment_date"] is not None:
            appointment.appointment_date = next_date
        if "duration_minutes" in data and data["duration_minutes"] is not None:
            appointment.duration_minutes = next_duration
        if "status" in data and data["status"] is not None:
            appointment.status = data["status"]
        if "appointment_type" in data:
            appointment.appointment_type = data["appointment_type"]
        if "reason" in data:
            appointment.reason = data["reason"]
        if "notes" in data:
            appointment.notes = data["notes"]

        cls.repository.commit()
        return appointment

    @classmethod
    def cancel_appointment(cls, current_user, appointment_id, reason=None):
        """Cancel appointment (soft state change)."""
        appointment = cls.get_appointment(current_user=current_user, appointment_id=appointment_id)
        appointment.status = "cancelled"
        if reason:
            appointment.notes = reason
        cls.repository.commit()
        return appointment

    @classmethod
    def confirm_appointment(cls, current_user, appointment_id):
        """Confirm appointment with professional/admin restrictions."""
        appointment = cls.repository.get_by_id(appointment_id)
        if not appointment:
            raise ResourceNotFoundError("Appointment not found")

        if not cls.policy.can_confirm(current_user, appointment):
            raise AccessDeniedError("Insufficient permissions")

        appointment.status = "confirmed"
        cls.repository.commit()
        return appointment

    @classmethod
    def get_calendar(cls, current_user, professional_id, date_from, date_to):
        """Calendar range query with actor-aware scope."""
        if not all([professional_id, date_from, date_to]):
            raise ValidationError("Missing required parameters")

        start_date = cls._parse_iso_datetime(date_from, "date_from")
        end_date = cls._parse_iso_datetime(date_to, "date_to")
        try:
            professional_id = int(professional_id)
        except (TypeError, ValueError) as exc:
            raise ValidationError("Invalid professional_id") from exc

        scoped_professional_id, scoped_patient_id = cls.policy.scope_calendar_filters(
            current_user=current_user,
            professional_id=professional_id,
        )

        return cls.repository.list_by_date_range(
            professional_id=scoped_professional_id,
            start_date=start_date,
            end_date=end_date,
            patient_id=scoped_patient_id,
        )

    @staticmethod
    def check_availability(professional_id, date, duration):
        """Check if professional has no conflict at date/time."""
        if isinstance(date, str):
            try:
                date = datetime.fromisoformat(date)
            except ValueError as exc:
                raise ValidationError("Invalid date format") from exc
        if not isinstance(date, datetime):
            raise ValidationError("Invalid date value")

        return not AppointmentRepository.find_conflict(
            professional_id=int(professional_id),
            appointment_date=date,
            duration_minutes=int(duration or DEFAULT_APPOINTMENT_DURATION),
        )

    @staticmethod
    def _parse_iso_datetime(value, field_name):
        """Parse ISO datetime string to datetime object."""
        try:
            return datetime.fromisoformat(value)
        except (TypeError, ValueError) as exc:
            raise ValidationError(f"Invalid {field_name} format") from exc

    @staticmethod
    def _validate_required_fields(data, required_fields):
        """Validate required keys and non-empty values."""
        missing_fields = [
            field for field in required_fields
            if field not in (data or {}) or data.get(field) in (None, "")
        ]
        if missing_fields:
            raise ValidationError(
                "Missing required fields",
                details={"missing_fields": missing_fields},
            )

    @classmethod
    def _validate_create_access(cls, current_user, data):
        """Authorize appointment creation."""
        if not cls.policy.can_create(current_user, data):
            raise AccessDeniedError("Unauthorized")

    @classmethod
    def _validate_update_access(cls, current_user, appointment, data):
        """Authorize appointment update and reassignment edge cases."""
        if not cls.policy.can_update(current_user, appointment):
            raise AccessDeniedError("Unauthorized")

        if "professional_id" in data and data["professional_id"] is not None:
            try:
                requested_professional_id = int(data["professional_id"])
            except (TypeError, ValueError) as exc:
                raise ValidationError("Invalid professional_id") from exc
            if not cls.policy.can_assign_professional(current_user, requested_professional_id):
                raise AccessDeniedError("Unauthorized")

    @staticmethod
    def _resolve_user_specialty_key(current_user):
        """Return normalized specialty scope key for the authenticated professional."""
        return AccessScopeService.resolve_specialty_key(getattr(current_user, "specialty", None))

    @classmethod
    def _ensure_professional_patient_scope(cls, current_user, patient_id, allow_auto_assign=False):
        """Ensure professional can access patient within own specialty scope."""
        specialty_key = cls._resolve_user_specialty_key(current_user)
        has_scope = AccessScopeService.professional_can_access_patient(
            current_user.id,
            patient_id,
            specialty_key=specialty_key,
        )
        if has_scope:
            assignment = ProfessionalPatientAssignment.query.filter_by(
                professional_id=current_user.id,
                patient_id=patient_id,
            ).first()
            if assignment and specialty_key and not assignment.specialty_key:
                assignment.specialty_key = specialty_key
            return

        if not allow_auto_assign:
            raise AccessDeniedError("Professional can only create appointments for linked patients")

        has_any_assignment = ProfessionalPatientAssignment.query.filter_by(
            patient_id=patient_id
        ).first() is not None
        if has_any_assignment:
            raise AccessDeniedError("Professional can only create appointments for linked patients")

        db.session.add(
            ProfessionalPatientAssignment(
                professional_id=current_user.id,
                patient_id=patient_id,
                specialty_key=specialty_key,
            )
        )
