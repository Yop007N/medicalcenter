# -*- coding: utf-8 -*-
"""Patient access policy service.

Centralizes patient-resource access checks so API resources do not duplicate
RBAC logic.
"""

from app.models.user import User


class PatientAccessService:
    """Encapsulates access policy for patient-scoped resources."""

    @staticmethod
    def get_user_role(current_user_id):
        """Return user role when available."""
        if current_user_id is None:
            return None
        try:
            current_user_id = int(current_user_id)
        except (TypeError, ValueError):
            return None

        user = User.query.get(current_user_id)
        return user.role if user else None

    @staticmethod
    def can_access_patient(current_user_id, patient_id):
        """
        Access policy:
        - admin/professional can access any patient resource
        - patient can access only own patient_id
        """
        if current_user_id is None or patient_id is None:
            return False

        try:
            current_user_id = int(current_user_id)
            patient_id = int(patient_id)
        except (TypeError, ValueError):
            return False

        if current_user_id == patient_id:
            return True

        current_user = User.query.get(current_user_id)
        return bool(current_user and current_user.role in ['admin', 'professional'])
