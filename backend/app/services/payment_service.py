# -*- coding: utf-8 -*-
"""Payment service layer."""

from datetime import datetime, timezone

from app.extensions import db
from app.models.payment import Payment
from app.services.exceptions import ResourceNotFoundError, ValidationError


class PaymentService:
    """Encapsulates payment business rules."""

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

    @staticmethod
    def list_payments(budget_id=None, status=None):
        """List payments using optional filters."""
        query = Payment.query
        if budget_id:
            query = query.filter_by(budget_id=budget_id)
        if status:
            query = query.filter_by(payment_status=status)
        return query.order_by(db.desc(Payment.created_at)).all()

    @staticmethod
    def get_payment(payment_id):
        """Get payment by ID."""
        payment = Payment.query.get(payment_id)
        if not payment:
            raise ResourceNotFoundError('Payment not found')
        return payment

    @classmethod
    def create_payment(cls, data):
        """Create a payment in pending state."""
        required_fields = ['amount', 'payment_method']
        if not all(field in data for field in required_fields):
            raise ValidationError('Missing required fields')

        payment = Payment(
            budget_id=data.get('budget_id'),
            amount=data['amount'],
            currency=data.get('currency', 'ARS'),
            payment_method=data['payment_method'],
            payment_status='pending',
            transaction_id=data.get('transaction_id') or data.get('transaction_reference'),
            payment_date=cls._parse_datetime(data.get('payment_date')),
            notes=data.get('notes'),
        )

        db.session.add(payment)
        db.session.commit()
        return payment

    @classmethod
    def update_payment(cls, payment_id, data):
        """Update payment mutable fields."""
        payment = cls.get_payment(payment_id)

        if 'amount' in data:
            payment.amount = data['amount']
        if 'currency' in data:
            payment.currency = data['currency']
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

        db.session.commit()
        return payment

    @staticmethod
    def delete_payment(payment_id):
        """Delete payment by ID."""
        payment = PaymentService.get_payment(payment_id)
        db.session.delete(payment)
        db.session.commit()

    @staticmethod
    def process_payment(payment_id, data):
        """Mark payment as completed."""
        payment = PaymentService.get_payment(payment_id)
        payment.payment_status = 'completed'
        payment.payment_date = datetime.utcnow()
        payment.transaction_id = (
            data.get('transaction_id')
            or data.get('transaction_reference')
            or f'TXN-{payment_id}'
        )

        db.session.commit()
        return payment
