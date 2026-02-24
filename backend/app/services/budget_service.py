# -*- coding: utf-8 -*-
"""
Budget Service - Business logic for budget management
"""

from datetime import date, datetime
from app.models.budget import Budget
from app.extensions import db
from app.services.exceptions import ValidationError, ResourceNotFoundError


VALID_BUDGET_STATUSES = {'draft', 'sent', 'accepted', 'rejected', 'expired'}


class BudgetService:
    """Budget management business logic"""

    @staticmethod
    def _parse_date(value):
        """Parse date-like payloads into date objects."""
        if value in (None, ''):
            return None
        if isinstance(value, datetime):
            return value.date()
        if isinstance(value, date):
            return value
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value.replace('Z', '+00:00')).date()
            except ValueError as exc:
                raise ValidationError('Invalid date format. Use YYYY-MM-DD') from exc
        raise ValidationError('Invalid date value')

    @classmethod
    def create_budget(cls, data, created_by):
        """Create new budget"""
        required_fields = ['patient_id', 'title', 'total_amount']
        if not all(field in data for field in required_fields):
            raise ValidationError('Missing required fields')

        budget = Budget(
            patient_id=data['patient_id'],
            created_by=created_by,
            title=data['title'],
            description=data.get('description'),
            total_amount=data['total_amount'],
            currency=data.get('currency', 'ARS'),
            status='draft',
            valid_until=cls._parse_date(data.get('valid_until')),
            items=data.get('items', [])
        )
        db.session.add(budget)
        db.session.commit()
        return budget

    @staticmethod
    def update_budget(budget_id, data):
        """Update budget"""
        budget = Budget.query.get(budget_id)
        if not budget:
            raise ResourceNotFoundError('Budget not found')

        if 'title' in data:
            budget.title = data['title']
        if 'patient_id' in data:
            budget.patient_id = data['patient_id']
        if 'description' in data:
            budget.description = data['description']
        if 'total_amount' in data:
            budget.total_amount = data['total_amount']
        if 'currency' in data:
            budget.currency = data['currency']
        if 'valid_until' in data:
            budget.valid_until = BudgetService._parse_date(data['valid_until'])
        if 'status' in data:
            if data['status'] not in VALID_BUDGET_STATUSES:
                raise ValidationError('Invalid budget status')
            budget.status = data['status']
        if 'items' in data:
            budget.items = data['items']

        db.session.commit()
        return budget

    @staticmethod
    def send_budget_to_patient(budget_id):
        """Send budget to patient (email/notification)"""
        budget = Budget.query.get(budget_id)
        if not budget:
            raise ResourceNotFoundError('Budget not found')

        budget.status = 'sent'
        db.session.commit()
        return budget

    @staticmethod
    def accept_budget(budget_id):
        """Mark budget as accepted by patient"""
        budget = Budget.query.get(budget_id)
        if not budget:
            raise ResourceNotFoundError('Budget not found')

        budget.status = 'accepted'
        db.session.commit()
        return budget

    @staticmethod
    def delete_budget(budget_id):
        """Delete budget."""
        budget = Budget.query.get(budget_id)
        if not budget:
            raise ResourceNotFoundError('Budget not found')

        db.session.delete(budget)
        db.session.commit()

    @staticmethod
    def calculate_total(items):
        """Calculate total amount from budget items"""
        total = sum(item.get('quantity', 0) * item.get('unit_price', 0) for item in items or [])
        return total
