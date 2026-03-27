# -*- coding: utf-8 -*-
"""
Authentication Service - Handles user authentication logic
"""

import re
from uuid import uuid4

from app.models.patient import Patient
from app.models.professional import Professional
from app.models.user import User
from app.extensions import db
from app.services.exceptions import ConflictError, ValidationError
from app.utils.validators import validate_email


class AuthService:
    """Authentication business logic"""

    PUBLIC_REGISTRATION_ROLES = {'patient', 'professional'}

    @staticmethod
    def validate_password(password):
        """
        Validate password strength

        Args:
            password: Password to validate

        Raises:
            ValidationError: If password doesn't meet requirements

        Returns:
            True if valid
        """
        if len(password) < 8:
            raise ValidationError('Password must be at least 8 characters')
        if not re.search(r'[A-Z]', password):
            raise ValidationError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', password):
            raise ValidationError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', password):
            raise ValidationError('Password must contain at least one number')
        return True

    @staticmethod
    def authenticate(email, password):
        """
        Authenticate user with email and password

        Args:
            email: User email
            password: User password

        Returns:
            User object if authenticated, None otherwise
        """
        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            return user
        return None

    @staticmethod
    def register_user(email, password, first_name, last_name, role, license_number=None, specialty=None):
        """
        Register a new user

        Args:
            email: User email
            password: User password
            first_name: User first name
            last_name: User last name
            role: User role
            license_number: Optional professional license identifier
            specialty: Optional professional specialty

        Returns:
            Created user object
        """
        # Validate role for public registration
        if role not in AuthService.PUBLIC_REGISTRATION_ROLES:
            allowed = ", ".join(sorted(AuthService.PUBLIC_REGISTRATION_ROLES))
            raise ValidationError(f'Invalid role. Allowed roles: {allowed}')

        # Validate email format
        if not validate_email(email):
            raise ValidationError('Invalid email format')

        # Validate password strength
        AuthService.validate_password(password)

        # Check for existing user
        existing = User.query.filter_by(email=email).first()
        if existing:
            raise ConflictError('Email already registered')

        user = AuthService._build_user_by_role(
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=role,
            license_number=license_number,
            specialty=specialty,
        )
        user.set_password(password)

        db.session.add(user)
        db.session.commit()

        return user

    @staticmethod
    def _build_user_by_role(email, first_name, last_name, role, license_number=None, specialty=None):
        """Create concrete User subclass depending on role."""
        if role == 'patient':
            return Patient(
                email=email,
                first_name=first_name,
                last_name=last_name,
                role=role,
                is_active=True,
            )

        resolved_license = AuthService._resolve_professional_license(license_number)
        return Professional(
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=role,
            license_number=resolved_license,
            specialty=specialty,
            is_active=True,
        )

    @staticmethod
    def _resolve_professional_license(requested_license=None):
        """Return provided license if free, otherwise generate unique one."""
        if requested_license:
            existing = Professional.query.filter_by(license_number=requested_license).first()
            if existing:
                raise ConflictError('Professional license already registered')
            return requested_license

        while True:
            generated = f'PRO-{uuid4().hex[:10].upper()}'
            existing = Professional.query.filter_by(license_number=generated).first()
            if not existing:
                return generated
