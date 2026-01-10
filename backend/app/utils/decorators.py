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
