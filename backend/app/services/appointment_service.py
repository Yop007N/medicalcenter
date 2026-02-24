# -*- coding: utf-8 -*-
"""
Appointment Service - Business logic for appointment management
"""

from datetime import datetime

from app.models.appointment import Appointment
from app.models.user import User
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
        professional_id = int(data["professional_id"])

        if cls.repository.find_conflict(professional_id=professional_id, appointment_date=appointment_date):
            raise ConflictError("Time slot already booked")

        appointment = Appointment(
            patient_id=int(data["patient_id"]),
            professional_id=professional_id,
            appointment_date=appointment_date,
            duration_minutes=int(data.get("duration_minutes", DEFAULT_APPOINTMENT_DURATION)),
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

        next_professional_id = appointment.professional_id
        next_date = appointment.appointment_date

        if "professional_id" in data and data["professional_id"] is not None:
            next_professional_id = int(data["professional_id"])
        if "appointment_date" in data and data["appointment_date"] is not None:
            next_date = cls._parse_iso_datetime(data["appointment_date"], "appointment_date")

        if (
            next_professional_id != appointment.professional_id
            or next_date != appointment.appointment_date
        ) and cls.repository.find_conflict(
            professional_id=next_professional_id,
            appointment_date=next_date,
            exclude_id=appointment.id,
        ):
            raise ConflictError("Time slot already booked")

        if "patient_id" in data and data["patient_id"] is not None:
            appointment.patient_id = int(data["patient_id"])
        if "professional_id" in data and data["professional_id"] is not None:
            appointment.professional_id = next_professional_id
        if "appointment_date" in data and data["appointment_date"] is not None:
            appointment.appointment_date = next_date
        if "duration_minutes" in data and data["duration_minutes"] is not None:
            appointment.duration_minutes = int(data["duration_minutes"])
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
