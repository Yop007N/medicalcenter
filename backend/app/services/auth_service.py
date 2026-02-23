# -*- coding: utf-8 -*-
"""
Authentication Service - Handles user authentication logic
"""

import re
from datetime import timedelta
from app.models.user import User
from app.extensions import db, redis_client


class AuthService:
    """Authentication business logic"""

    @staticmethod
    def revoke_token(jti, expires_at=None):
        """
        Revoke a token by adding it to the blocklist

        Args:
            jti: JWT ID
            expires_at: Expiration timestamp (unix epoch)
        """
        if expires_at:
            redis_client.set(f'blocklist:{jti}', 'revoked', exat=expires_at)
        else:
            redis_client.set(f'blocklist:{jti}', 'revoked', ex=timedelta(hours=24))

    @staticmethod
    def is_token_revoked(jwt_header, jwt_payload):
        """
        Check if a token is revoked (callback for flask-jwt-extended)

        Args:
            jwt_header: JWT Header
            jwt_payload: JWT Payload

        Returns:
            True if token is revoked
        """
        jti = jwt_payload['jti']
        return redis_client.get(f'blocklist:{jti}') is not None

    @staticmethod
    def validate_password(password):
        """
        Validate password strength

        Args:
            password: Password to validate

        Raises:
            ValueError: If password doesn't meet requirements

        Returns:
            True if valid
        """
        if len(password) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not re.search(r'[A-Z]', password):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', password):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', password):
            raise ValueError('Password must contain at least one number')
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
    def register_user(email, password, first_name, last_name, role):
        """
        Register a new user

        Args:
            email: User email
            password: User password
            first_name: User first name
            last_name: User last name
            role: User role

        Returns:
            Created user object
        """
        # Validate password strength
        AuthService.validate_password(password)

        # Check for existing user
        existing = User.query.filter_by(email=email).first()
        if existing:
            raise ValueError('Email already registered')

        user = User(
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=role,
        )
        user.set_password(password)

        db.session.add(user)
        db.session.commit()

        return user
