# -*- coding: utf-8 -*-
"""
User Service - Business logic for user management
"""

from app.models.user import User
from app.extensions import db
from app.services.auth_service import AuthService
from app.utils.validators import validate_email
from sqlalchemy.exc import IntegrityError


class UserService:
    """User management business logic"""

    @staticmethod
    def get_user_by_id(user_id):
        """Get user by ID"""
        return User.query.get(user_id)

    @staticmethod
    def get_all_users(filters=None):
        """Get all users with optional filters"""
        # Simple filtering implementation: supports filtering by role and email
        query = User.query
        if not filters:
            return query.all()

        role = filters.get('role')
        email = filters.get('email')
        if role:
            query = query.filter_by(role=role)
        if email:
            query = query.filter(User.email.ilike(f"%{email}%"))

        return query.all()

    @staticmethod
    def get_all_users_paginated(page=1, per_page=20, filters=None):
        """Get paginated users with optional filters"""
        query = User.query

        if filters:
            role = filters.get('role')
            email = filters.get('email')
            if role:
                query = query.filter_by(role=role)
            if email:
                query = query.filter(User.email.ilike(f"%{email}%"))

        return query.paginate(page=page, per_page=per_page, error_out=False)

    @staticmethod
    def create_user(data):
        """Create new user"""
        # Expecting dict with keys: email, password, first_name, last_name, role
        email = data.get('email')
        password = data.get('password')
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        role = data.get('role')

        if not all([email, password, first_name, last_name, role]):
            raise ValueError('Missing required user fields')

        if not validate_email(email):
            raise ValueError('Invalid email format')

        # Validate password strength
        AuthService.validate_password(password)

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

    @staticmethod
    def update_user(user_id, data):
        """Update existing user"""
        user = User.query.get(user_id)
        if not user:
            return None

        # Update allowed fields
        for field in ('email', 'first_name', 'last_name', 'role'):
            if field in data:
                if field == 'email' and not validate_email(data[field]):
                    raise ValueError('Invalid email format')
                setattr(user, field, data[field])

        # Handle password separately
        if data.get('password'):
            user.set_password(data.get('password'))

        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            raise ValueError('Email already exists')

        return user

    @staticmethod
    def delete_user(user_id):
        """Delete user"""
        user = User.query.get(user_id)
        if not user:
            return False

        db.session.delete(user)
        db.session.commit()
        return True
