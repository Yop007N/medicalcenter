# -*- coding: utf-8 -*-
"""Payment service layer."""

from datetime import datetime, timezone
from sqlalchemy.exc import IntegrityError

from app.extensions import db
from app.models.budget import Budget
from app.models.payment import Payment
from app.services.access_scope_service import AccessScopeService
from app.services.budget_service import BudgetService
from app.services.exceptions import (
    AccessDeniedError,
    ConflictError,
    ResourceNotFoundError,
    ValidationError,
)
from app.services.specialty_module_service import SpecialtyModuleService
from app.utils.helpers import normalize_currency_code


class PaymentService:
    """Encapsulates payment business rules."""

    TRANSACTION_ID_CONFLICT_MARKERS = (
        'uq_payments_transaction_id',
        'payments_transaction_id_key',
        'transaction_id',
    )

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
                raise AccessDeniedError('Professional can only access own specialty payments')
            return module_key, None

        module_professional_ids = sorted(
            SpecialtyModuleService.get_professional_ids_for_module(module_key)
        )
        return module_key, module_professional_ids

    @classmethod
    def _scoped_query(
        cls,
        current_user,
        specialty_key=None,
        patient_id=None,
    ):
        """Build role-aware query for payments."""
        module_key, module_professional_ids = cls._resolve_specialty_scope(
            current_user=current_user,
            specialty_key=specialty_key,
        )
        query = Payment.query.outerjoin(Budget, Payment.budget_id == Budget.id)

        if current_user.role == 'patient':
            query = query.filter(Budget.patient_id == current_user.id)
            if module_key:
                if not module_professional_ids:
                    return query.filter(Payment.id == -1), module_key
                query = query.filter(Budget.created_by.in_(module_professional_ids))
        elif current_user.role == 'professional':
            scoped_patient_ids = list(
                AccessScopeService.get_professional_patient_ids(
                    current_user.id,
                    specialty_key=module_key,
                )
            )
            if module_key:
                if not scoped_patient_ids:
                    return query.filter(Payment.id == -1), module_key
                query = query.filter(Budget.patient_id.in_(scoped_patient_ids))
            elif scoped_patient_ids:
                query = query.filter(
                    db.or_(
                        Budget.patient_id.in_(scoped_patient_ids),
                        Payment.budget_id.is_(None),
                    )
                )
            else:
                query = query.filter(Payment.budget_id.is_(None))
        elif current_user.role == 'admin':
            if module_key:
                scoped_patient_ids = BudgetService._module_patient_ids(  # pylint: disable=protected-access
                    module_key=module_key,
                    module_professional_ids=module_professional_ids,
                )
                if not scoped_patient_ids:
                    return query.filter(Payment.id == -1), module_key
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
    def _get_payment_scoped(cls, payment_id, current_user_id, specialty_key=None):
        """Fetch payment with role/specialty scope checks."""
        payment = Payment.query.get(payment_id)
        if not payment:
            raise ResourceNotFoundError('Payment not found')

        current_user = AccessScopeService.get_user_or_raise(current_user_id)
        if payment.budget_id is None:
            if current_user.role in ('admin', 'professional'):
                return payment, current_user
            raise AccessDeniedError('Unauthorized')

        scoped_query, _ = cls._scoped_query(
            current_user=current_user,
            specialty_key=specialty_key,
            patient_id=payment.budget.patient_id if payment.budget else None,
        )
        scoped_query = scoped_query.filter(Payment.id == payment.id)
        if scoped_query.first() is None:
            raise AccessDeniedError('Unauthorized')
        return payment, current_user

    @staticmethod
    def _parse_datetime(value):
        """Parse datetime-like payloads into naive UTC datetimes."""
        if value in (None, ''):
            return None
        if isinstance(value, datetime):
            parsed = value
        elif isinstance(value, str):
            try:
                parsed = datetime.fromisoformat(value.replace('Z', '+00:00'))
            except ValueError as exc:
                raise ValidationError('Invalid datetime format. Use ISO 8601') from exc
        else:
            raise ValidationError('Invalid datetime value')

        if parsed.tzinfo is not None:
            parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)
        return parsed

    @classmethod
    def _commit_with_integrity_handling(cls):
        """Commit DB changes and map transaction_id uniqueness violations to conflict errors."""
        try:
            db.session.commit()
        except IntegrityError as exc:
            db.session.rollback()
            details = str(getattr(exc, 'orig', exc)).lower()
            if any(marker in details for marker in cls.TRANSACTION_ID_CONFLICT_MARKERS):
                raise ConflictError('transaction_id already exists') from exc
            raise ValidationError('Database integrity constraint failed') from exc

    @classmethod
    def list_payments(
        cls,
        current_user_id,
        budget_id=None,
        status=None,
        patient_id=None,
        specialty_key=None,
    ):
        """List payments using optional filters."""
        current_user = AccessScopeService.get_user_or_raise(current_user_id)
        query, module_key = cls._scoped_query(
            current_user=current_user,
            specialty_key=specialty_key,
            patient_id=patient_id,
        )
        if budget_id:
            BudgetService.get_budget(
                budget_id=budget_id,
                current_user_id=current_user.id,
                specialty_key=module_key,
            )
            query = query.filter(Payment.budget_id == budget_id)
        if status:
            query = query.filter(Payment.payment_status == status)
        return query.order_by(db.desc(Payment.created_at)).all()

    @classmethod
    def get_payment(cls, payment_id, current_user_id, specialty_key=None):
        """Get payment by ID."""
        payment, _ = cls._get_payment_scoped(
            payment_id=payment_id,
            current_user_id=current_user_id,
            specialty_key=specialty_key,
        )
        return payment

    @classmethod
    def create_payment(cls, data, current_user_id, specialty_key=None):
        """Create a payment in pending state."""
        required_fields = ['amount', 'payment_method']
        if not all(field in data for field in required_fields):
            raise ValidationError('Missing required fields')

        current_user = AccessScopeService.get_user_or_raise(current_user_id)
        if current_user.role not in ('admin', 'professional'):
            raise AccessDeniedError('Unauthorized')

        budget_id = data.get('budget_id')
        if budget_id is not None:
            BudgetService.get_budget(
                budget_id=budget_id,
                current_user_id=current_user.id,
                specialty_key=specialty_key,
            )

        payment = Payment(
            budget_id=budget_id,
            amount=data['amount'],
            currency=normalize_currency_code(data.get('currency', 'PYG')),
            payment_method=data['payment_method'],
            payment_status='pending',
            transaction_id=data.get('transaction_id') or data.get('transaction_reference'),
            payment_date=cls._parse_datetime(data.get('payment_date')),
            notes=data.get('notes'),
        )

        db.session.add(payment)
        cls._commit_with_integrity_handling()
        return payment

    @classmethod
    def update_payment(cls, payment_id, data, current_user_id, specialty_key=None):
        """Update payment mutable fields."""
        payment, current_user = cls._get_payment_scoped(
            payment_id=payment_id,
            current_user_id=current_user_id,
            specialty_key=specialty_key,
        )

        if current_user.role == 'patient':
            raise AccessDeniedError('Patients cannot update payments')

        if 'amount' in data:
            payment.amount = data['amount']
        if 'currency' in data:
            payment.currency = normalize_currency_code(data['currency'])
        if 'payment_method' in data:
            payment.payment_method = data['payment_method']
        if 'payment_status' in data:
            payment.payment_status = data['payment_status']
        if 'transaction_id' in data:
            payment.transaction_id = data['transaction_id']
        if 'transaction_reference' in data:
            payment.transaction_id = data['transaction_reference']
        if 'payment_date' in data:
            payment.payment_date = cls._parse_datetime(data.get('payment_date'))
        if 'notes' in data:
            payment.notes = data['notes']
        if 'budget_id' in data and data['budget_id'] is not None:
            BudgetService.get_budget(
                budget_id=data['budget_id'],
                current_user_id=current_user.id,
                specialty_key=specialty_key,
            )
            payment.budget_id = data['budget_id']

        cls._commit_with_integrity_handling()
        return payment

    @classmethod
    def delete_payment(cls, payment_id, current_user_id, specialty_key=None):
        """Delete payment by ID."""
        payment, current_user = cls._get_payment_scoped(
            payment_id=payment_id,
            current_user_id=current_user_id,
            specialty_key=specialty_key,
        )
        if current_user.role == 'patient':
            raise AccessDeniedError('Patients cannot delete payments')
        db.session.delete(payment)
        db.session.commit()

    @classmethod
    def process_payment(cls, payment_id, data, current_user_id, specialty_key=None):
        """Mark payment as completed."""
        payment, current_user = cls._get_payment_scoped(
            payment_id=payment_id,
            current_user_id=current_user_id,
            specialty_key=specialty_key,
        )
        if current_user.role == 'patient':
            raise AccessDeniedError('Patients cannot process payments')
        payment.payment_status = 'completed'
        payment.payment_date = datetime.utcnow()
        payment.transaction_id = (
            data.get('transaction_id')
            or data.get('transaction_reference')
            or f'TXN-{payment_id}'
        )

        cls._commit_with_integrity_handling()
        return payment
