# -*- coding: utf-8 -*-
"""Authorization and visibility policy for appointments."""


class AppointmentAccessPolicy:
    """Role-based policy for appointment workflows."""

    @staticmethod
    def can_access(current_user, appointment):
        """Check if user can view appointment."""
        if not current_user or not appointment:
            return False

        if current_user.role == "admin":
            return True
        if current_user.role == "professional":
            return appointment.professional_id == current_user.id
        if current_user.role == "patient":
            return appointment.patient_id == current_user.id
        return False

    @staticmethod
    def can_create(current_user, data):
        """Check if user can create appointment."""
        if not current_user:
            return False
        if current_user.role == "admin":
            return True

        try:
            patient_id = int(data.get("patient_id"))
            professional_id = int(data.get("professional_id"))
        except (TypeError, ValueError):
            return False

        if current_user.role == "professional":
            return professional_id == current_user.id
        if current_user.role == "patient":
            return patient_id == current_user.id
        return False

    @staticmethod
    def can_update(current_user, appointment):
        """Check if user can update/cancel appointment."""
        if not current_user or not appointment:
            return False
        if current_user.role == "admin":
            return True
        if current_user.role == "professional":
            return appointment.professional_id == current_user.id
        if current_user.role == "patient":
            return appointment.patient_id == current_user.id
        return False

    @staticmethod
    def can_assign_professional(current_user, professional_id):
        """Only admin can assign other professionals."""
        if not current_user:
            return False
        if current_user.role == "admin":
            return True
        if current_user.role == "professional":
            return current_user.id == professional_id
        return False

    @staticmethod
    def can_confirm(current_user, appointment):
        """Confirm action requires admin/professional, scoped to own appointment."""
        if not current_user or not appointment:
            return False
        if current_user.role == "admin":
            return True
        if current_user.role == "professional":
            return appointment.professional_id == current_user.id
        return False

    @staticmethod
    def scope_filters(current_user, filters):
        """Inject role-specific filters to avoid data leaks."""
        scoped = dict(filters or {})

        if not current_user:
            return scoped

        if current_user.role == "professional":
            scoped["professional_id"] = current_user.id
        elif current_user.role == "patient":
            scoped["patient_id"] = current_user.id

        return scoped

    @staticmethod
    def scope_calendar_filters(current_user, professional_id):
        """Scope calendar request to actor visibility."""
        if not current_user:
            return professional_id, None

        if current_user.role == "admin":
            return professional_id, None
        if current_user.role == "professional":
            return current_user.id, None
        if current_user.role == "patient":
            return professional_id, current_user.id
        return professional_id, None
