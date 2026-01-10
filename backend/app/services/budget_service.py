# -*- coding: utf-8 -*-
"""
Budget Service - Business logic for budget management
"""

from app.models.budget import Budget
from app.extensions import db


class BudgetService:
    """Budget management business logic"""

    @staticmethod
    def create_budget(data):
        """Create new budget"""
        # TODO: Implement budget creation
        pass

    @staticmethod
    def update_budget(budget_id, data):
        """Update budget"""
        # TODO: Implement budget update logic
        pass

    @staticmethod
    def send_budget_to_patient(budget_id):
        """Send budget to patient (email/notification)"""
        # TODO: Implement budget sending logic with notification
        pass

    @staticmethod
    def accept_budget(budget_id):
        """Mark budget as accepted by patient"""
        # TODO: Implement budget acceptance logic
        pass

    @staticmethod
    def calculate_total(items):
        """Calculate total amount from budget items"""
        total = sum(item['quantity'] * item['unit_price'] for item in items)
        return total
