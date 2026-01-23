# -*- coding: utf-8 -*-
"""
Custom decorators for API endpoints
"""

from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from app.models.user import User


def role_required(*allowed_roles):
    """
    Decorator to check if user has required role

    Usage:
        @role_required('admin', 'professional')
        def my_endpoint():
            pass
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = int(get_jwt_identity())
            user = User.query.get(user_id)

            if not user or user.role not in allowed_roles:
                return jsonify({'message': 'Insufficient permissions'}), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator


def admin_required(fn):
    """Decorator to require admin role"""
    return role_required('admin')(fn)


def professional_required(fn):
    """Decorator to require professional role"""
    return role_required('professional', 'admin')(fn)


def patient_access_required(fn):
    """
    Decorator to ensure user can only access their own patient data
    unless they are admin or professional
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        try:
            current_user_id = int(get_jwt_identity())
        except (ValueError, TypeError):
            return jsonify({'msg': 'Invalid token identity'}), 401

        user = User.query.get(current_user_id)

        if not user:
            return jsonify({'msg': 'Unauthorized'}), 403

        # Allow admin and professional
        if user.role in ['admin', 'professional']:
            return fn(*args, **kwargs)

        # Check if patient_id matches current user
        patient_id = kwargs.get('patient_id')
        if patient_id is not None and user.id == int(patient_id):
            return fn(*args, **kwargs)

        return jsonify({'msg': 'Unauthorized'}), 403
    return wrapper
