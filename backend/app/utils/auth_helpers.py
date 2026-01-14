# -*- coding: utf-8 -*-
"""
Authentication and Authorization Helpers
"""

from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from app.models.user import User


def check_patient_access(patient_id):
    """
    Check if the current user is authorized to access the patient's data.
    Allows access if:
    1. User is the patient (id matches)
    2. User is a professional or admin

    Args:
        patient_id (int): The ID of the patient resource being accessed.

    Returns:
        tuple: (response, status_code) if unauthorized, else None
    """
    try:
        current_user_id = int(get_jwt_identity())

        # If the user is the patient, they are authorized
        # Ensure patient_id is int for comparison
        if current_user_id == int(patient_id):
            return None

        # If not the patient, check if professional or admin
        current_user = User.query.get(current_user_id)
        if not current_user or current_user.role not in ['admin', 'professional']:
            return jsonify({'msg': 'Unauthorized access to patient data'}), 403

        return None
    except Exception:
        # If any error occurs during auth check (e.g. invalid token format), deny access
        return jsonify({'msg': 'Authorization check failed'}), 401
