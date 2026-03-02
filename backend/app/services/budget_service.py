# -*- coding: utf-8 -*-
"""
Budget Service - Business logic for budget management
"""

from datetime import date, datetime

from app.models.budget import Budget
from app.models.professional_patient_assignment import ProfessionalPatientAssignment
from app.extensions import db
from app.services.access_scope_service import AccessScopeService
from app.services.exceptions import AccessDeniedError, ValidationError, ResourceNotFoundError
from app.services.specialty_module_service import SpecialtyModuleService
from app.utils.helpers import normalize_currency_code


VALID_BUDGET_STATUSES = {'draft', 'sent', 'accepted', 'rejected', 'expired'}


class BudgetService:
    """Budget management business logic"""

    @staticmethod
    def _module_patient_ids(module_key, module_professional_ids=None):
        """Collect patient ids related to a specialty module."""
        patient_ids = {
            value
            for (value,) in db.session.query(ProfessionalPatientAssignment.patient_id)
            .filter(ProfessionalPatientAssignment.specialty_key == module_key)
            .distinct()
            .all()
            if value is not None
        }

        if module_professional_ids:
            budget_patient_ids = {
                value
                for (value,) in db.session.query(Budget.patient_id)
                .filter(Budget.created_by.in_(module_professional_ids))
                .distinct()
                .all()
                if value is not None
            }
            patient_ids.update(budget_patient_ids)

        return patient_ids

    @staticmethod
    def _resolve_specialty_scope(current_user, specialty_key):
        """Validate specialty scope and return normalized module info."""
        effective_specialty_key = specialty_key
        if current_user.role == 'professional' and not effective_specialty_key:
            effective_specialty_key = AccessScopeService.resolve_specialty_key(
                getattr(current_user, 'specialty', None)
            )

        if not effective_specialty_key:
            return None, None

        normalized_specialty_key = AccessScopeService.normalize_text(effective_specialty_key)
        module = SpecialtyModuleService.get_module_by_key(normalized_specialty_key)
        if not module:
            raise ValidationError('Invalid specialty_key')

        module_key = module.get('key')
        if current_user.role == 'professional':
            professional_specialty_key = AccessScopeService.resolve_specialty_key(
                getattr(current_user, 'specialty', None)
            )
            if professional_specialty_key != module_key:
                raise AccessDeniedError('Professional can only access own specialty budgets')
            return module_key, None

        module_professional_ids = sorted(
            SpecialtyModuleService.get_professional_ids_for_module(module_key)
        )
        return module_key, module_professional_ids

    @classmethod
    def _apply_scope_filters(
        cls,
        query,
        current_user,
        specialty_key=None,
        patient_id=None,
    ):
        """Apply actor/specialty scope restrictions to budget queries."""
        module_key, module_professional_ids = cls._resolve_specialty_scope(
            current_user=current_user,
            specialty_key=specialty_key,
        )

        if current_user.role == 'patient':
            query = query.filter(Budget.patient_id == current_user.id)
            if module_key:
                if not module_professional_ids:
                    return query.filter(Budget.id == -1), module_key
                query = query.filter(Budget.created_by.in_(module_professional_ids))
        elif current_user.role == 'professional':
            scoped_patient_ids = list(
                AccessScopeService.get_professional_patient_ids(
                    current_user.id,
                    specialty_key=module_key,
                )
            )
            if not scoped_patient_ids:
                return query.filter(Budget.id == -1), module_key
            query = query.filter(Budget.patient_id.in_(scoped_patient_ids))
        elif current_user.role == 'admin':
            if module_key:
                scoped_patient_ids = cls._module_patient_ids(
                    module_key=module_key,
                    module_professional_ids=module_professional_ids,
                )
                if not scoped_patient_ids:
                    return query.filter(Budget.id == -1), module_key
                query = query.filter(Budget.patient_id.in_(sorted(scoped_patient_ids)))
        else:
            raise AccessDeniedError('Unauthorized')

        if patient_id is not None:
            AccessScopeService.ensure_patient_access_scope(current_user.id, patient_id)
            if current_user.role == 'professional' and module_key and not AccessScopeService.professional_can_access_patient(
                current_user.id,
                patient_id,
                specialty_key=module_key,
            ):
                raise AccessDeniedError('Professional can only access linked patients in this specialty')
            query = query.filter(Budget.patient_id == patient_id)

        return query, module_key

    @classmethod
    def _get_budget_scoped(cls, budget_id, current_user_id, specialty_key=None):
        """Return budget and enforce actor/specialty access."""
        budget = Budget.query.get(budget_id)
        if not budget:
            raise ResourceNotFoundError('Budget not found')

        current_user = AccessScopeService.get_user_or_raise(current_user_id)
        scoped_query, _ = cls._apply_scope_filters(
            query=Budget.query.filter(Budget.id == budget.id),
            current_user=current_user,
            specialty_key=specialty_key,
            patient_id=budget.patient_id,
        )
        if scoped_query.first() is None:
            raise AccessDeniedError('Unauthorized')
        return budget, current_user

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
    def create_budget(cls, data, created_by, specialty_key=None):
        """Create new budget"""
        required_fields = ['patient_id', 'title', 'total_amount']
        if not all(field in data for field in required_fields):
            raise ValidationError('Missing required fields')

        current_user = AccessScopeService.get_user_or_raise(created_by)
        if current_user.role not in ('admin', 'professional'):
            raise AccessDeniedError('Unauthorized')

        module_key, _ = cls._resolve_specialty_scope(current_user, specialty_key)
        patient_id = data['patient_id']

        if current_user.role == 'professional':
            has_scope = AccessScopeService.professional_can_access_patient(
                current_user.id,
                patient_id,
                specialty_key=module_key,
            )
            if not has_scope:
                has_any_assignment = ProfessionalPatientAssignment.query.filter_by(
                    patient_id=patient_id
                ).first() is not None
                if has_any_assignment:
                    raise AccessDeniedError('Professional can only create budgets for linked patients')

                db.session.add(
                    ProfessionalPatientAssignment(
                        professional_id=current_user.id,
                        patient_id=patient_id,
                        specialty_key=module_key or AccessScopeService.resolve_specialty_key(
                            getattr(current_user, 'specialty', None)
                        ),
                    )
                )
        else:
            AccessScopeService.ensure_patient_access_scope(current_user.id, patient_id)

        budget = Budget(
            patient_id=patient_id,
            created_by=current_user.id,
            title=data['title'],
            description=data.get('description'),
            total_amount=data['total_amount'],
            currency=normalize_currency_code(data.get('currency', 'PYG')),
            status='draft',
            valid_until=cls._parse_date(data.get('valid_until')),
            items=data.get('items', [])
        )
        db.session.add(budget)
        db.session.commit()
        return budget

    @classmethod
    def update_budget(cls, budget_id, data, current_user_id, specialty_key=None):
        """Update budget"""
        budget, current_user = cls._get_budget_scoped(
            budget_id=budget_id,
            current_user_id=current_user_id,
            specialty_key=specialty_key,
        )

        module_key, _ = cls._resolve_specialty_scope(current_user, specialty_key)

        if 'title' in data:
            budget.title = data['title']
        if 'patient_id' in data:
            target_patient_id = data['patient_id']
            if current_user.role == 'professional':
                has_scope = AccessScopeService.professional_can_access_patient(
                    current_user.id,
                    target_patient_id,
                    specialty_key=module_key,
                )
                if not has_scope:
                    has_any_assignment = ProfessionalPatientAssignment.query.filter_by(
                        patient_id=target_patient_id
                    ).first() is not None
                    if has_any_assignment:
                        raise AccessDeniedError('Professional can only assign linked patients')
                    db.session.add(
                        ProfessionalPatientAssignment(
                            professional_id=current_user.id,
                            patient_id=target_patient_id,
                            specialty_key=module_key or AccessScopeService.resolve_specialty_key(
                                getattr(current_user, 'specialty', None)
                            ),
                        )
                    )
            AccessScopeService.ensure_patient_access_scope(current_user.id, target_patient_id)
            budget.patient_id = data['patient_id']
        if 'description' in data:
            budget.description = data['description']
        if 'total_amount' in data:
            budget.total_amount = data['total_amount']
        if 'currency' in data:
            budget.currency = normalize_currency_code(data['currency'])
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

    @classmethod
    def send_budget_to_patient(cls, budget_id, current_user_id, specialty_key=None):
        """Send budget to patient (email/notification)"""
        budget, current_user = cls._get_budget_scoped(
            budget_id=budget_id,
            current_user_id=current_user_id,
            specialty_key=specialty_key,
        )
        if current_user.role == 'patient':
            raise AccessDeniedError('Patients cannot send budgets')

        budget.status = 'sent'
        db.session.commit()
        return budget

    @classmethod
    def accept_budget(cls, budget_id, current_user_id, specialty_key=None):
        """Mark budget as accepted by patient"""
        budget, _ = cls._get_budget_scoped(
            budget_id=budget_id,
            current_user_id=current_user_id,
            specialty_key=specialty_key,
        )

        budget.status = 'accepted'
        db.session.commit()
        return budget

    @classmethod
    def delete_budget(cls, budget_id, current_user_id, specialty_key=None):
        """Delete budget."""
        budget, current_user = cls._get_budget_scoped(
            budget_id=budget_id,
            current_user_id=current_user_id,
            specialty_key=specialty_key,
        )
        if current_user.role == 'patient':
            raise AccessDeniedError('Patients cannot delete budgets')

        db.session.delete(budget)
        db.session.commit()

    @classmethod
    def list_budgets(
        cls,
        current_user_id,
        patient_id=None,
        status=None,
        specialty_key=None,
    ):
        """List budgets with actor and specialty scope controls."""
        current_user = AccessScopeService.get_user_or_raise(current_user_id)
        query = Budget.query
        query, _ = cls._apply_scope_filters(
            query=query,
            current_user=current_user,
            specialty_key=specialty_key,
            patient_id=patient_id,
        )
        if status:
            query = query.filter(Budget.status == status)
        return query.order_by(db.desc(Budget.created_at)).all()

    @classmethod
    def get_budget(cls, budget_id, current_user_id, specialty_key=None):
        """Get budget by id with scope checks."""
        budget, _ = cls._get_budget_scoped(
            budget_id=budget_id,
            current_user_id=current_user_id,
            specialty_key=specialty_key,
        )
        return budget

    @staticmethod
    def calculate_total(items):
        """Calculate total amount from budget items"""
        total = sum(item.get('quantity', 0) * item.get('unit_price', 0) for item in items or [])
        return total
