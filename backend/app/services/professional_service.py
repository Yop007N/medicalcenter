# -*- coding: utf-8 -*-
"""Professional service layer."""

from app.extensions import db
from app.models.professional import Professional
from app.models.user import User
from app.services.exceptions import AccessDeniedError, ResourceNotFoundError, ValidationError
from app.utils.helpers import sanitize_search_input, validate_required_fields


class ProfessionalService:
    """Encapsulates professional CRUD rules."""

    @staticmethod
    def _coerce_bool(value):
        """Coerce common payload values to boolean."""
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            lowered = value.strip().lower()
            if lowered in {'true', '1', 'yes'}:
                return True
            if lowered in {'false', '0', 'no'}:
                return False
        return bool(value)

    @staticmethod
    def list_professionals(specialty=None):
        """List professionals with optional specialty filter."""
        query = Professional.query
        if specialty:
            sanitized_specialty = sanitize_search_input(specialty)
            if sanitized_specialty:
                query = query.filter(Professional.specialty.ilike(f'%{sanitized_specialty}%'))
        return query.all()

    @staticmethod
    def get_professional(professional_id):
        """Get professional by id."""
        professional = Professional.query.get(professional_id)
        if not professional:
            raise ResourceNotFoundError('Professional not found')
        return professional

    @staticmethod
    def create_professional(data):
        """Create professional user."""
        required_fields = ['email', 'password', 'first_name', 'last_name', 'license_number']
        is_valid, missing_fields = validate_required_fields(data, required_fields)
        if not is_valid:
            raise ValidationError('Missing required fields', {'missing_fields': missing_fields})

        from app.services.auth_service import AuthService
        AuthService.validate_password(data['password'])

        if Professional.query.filter_by(email=data['email']).first():
            raise ValidationError('Email already registered')

        if Professional.query.filter_by(license_number=data['license_number']).first():
            raise ValidationError('License number already registered')

        professional = Professional(
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            role='professional',
            license_number=data['license_number'],
            specialty=data.get('specialty'),
            phone=data.get('phone'),
            address=data.get('address') or data.get('office_address'),
        )
        professional.set_password(data['password'])

        db.session.add(professional)
        db.session.commit()
        return professional

    @staticmethod
    def update_professional(professional_id, current_user_id, data):
        """Update professional profile with access checks."""
        professional = Professional.query.get(professional_id)
        if not professional:
            raise ResourceNotFoundError('Professional not found')

        if professional.id != current_user_id:
            current_user = User.query.get(current_user_id)
            if not current_user or current_user.role != 'admin':
                raise AccessDeniedError('Unauthorized')

        if 'first_name' in data:
            professional.first_name = data['first_name']
        if 'last_name' in data:
            professional.last_name = data['last_name']
        if 'specialty' in data:
            professional.specialty = data['specialty']
        if 'phone' in data:
            professional.phone = data['phone']
        if 'address' in data:
            professional.address = data['address']
        if 'office_address' in data:
            professional.address = data['office_address']
        if 'license_number' in data:
            existing = Professional.query.filter(
                Professional.license_number == data['license_number'],
                Professional.id != professional.id,
            ).first()
            if existing:
                raise ValidationError('License number already registered')
            professional.license_number = data['license_number']
        if 'is_active' in data:
            professional.is_active = ProfessionalService._coerce_bool(data['is_active'])
        if 'password' in data:
            from app.services.auth_service import AuthService
            AuthService.validate_password(data['password'])
            professional.set_password(data['password'])

        db.session.commit()
        return professional

    @staticmethod
    def delete_professional(professional_id):
        """Delete professional by id."""
        professional = Professional.query.get(professional_id)
        if not professional:
            raise ResourceNotFoundError('Professional not found')
        db.session.delete(professional)
        db.session.commit()

    @staticmethod
    def get_professional_appointments(professional_id):
        """Get professional appointments."""
        professional = ProfessionalService.get_professional(professional_id)
        return professional.appointments.all()
