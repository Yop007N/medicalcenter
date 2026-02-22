# -*- coding: utf-8 -*-
"""
Payment CRUD endpoints
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime, timezone
from app.models.payment import Payment
from app.schemas.payment_schema import PaymentSchema
from app.extensions import db
from app.utils.decorators import professional_required

blueprint = Blueprint('payments', __name__, url_prefix='/api/payments')

payment_schema = PaymentSchema()
payments_schema = PaymentSchema(many=True)


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
            raise ValueError('Invalid datetime format. Use ISO 8601') from exc
    else:
        raise ValueError('Invalid datetime value')

    if parsed.tzinfo is not None:
        parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)
    return parsed


@blueprint.route('', methods=['GET'])
@jwt_required()
def list_payments():
    """List payments with optional filters.
    ---
    tags:
      - Payments
    security:
      - Bearer: []
    parameters:
      - in: query
        name: budget_id
        type: integer
        required: false
        description: Filter by budget ID
      - in: query
        name: status
        type: string
        enum: [pending, completed, failed, refunded]
        required: false
        description: Filter by payment status
    responses:
      200:
        description: Lista de pagos
      401:
        description: No autenticado
    """
    budget_id = request.args.get('budget_id', type=int)
    status = request.args.get('status')

    query = Payment.query

    if budget_id:
        query = query.filter_by(budget_id=budget_id)
    if status:
        query = query.filter_by(payment_status=status)

    payments = query.order_by(db.desc(Payment.created_at)).all()
    return jsonify(payments_schema.dump(payments)), 200


@blueprint.route('/<int:payment_id>', methods=['GET'])
@jwt_required()
def get_payment(payment_id):
    """Get payment by ID.
    ---
    tags:
      - Payments
    security:
      - Bearer: []
    parameters:
      - in: path
        name: payment_id
        type: integer
        required: true
        description: Payment ID
    responses:
      200:
        description: Pago encontrado
      404:
        description: Pago no encontrado
      401:
        description: No autenticado
    """
    payment = Payment.query.get(payment_id)

    if not payment:
        return jsonify({'msg': 'Payment not found'}), 404

    return jsonify(payment_schema.dump(payment)), 200


@blueprint.route('', methods=['POST'])
@professional_required
def create_payment():
    """Create new payment.
    ---
    tags:
      - Payments
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - amount
            - payment_method
          properties:
            budget_id:
              type: integer
            amount:
              type: number
              format: float
              example: 5000.00
            currency:
              type: string
              default: ARS
            payment_method:
              type: string
              enum: [cash, card, transfer, insurance, check, other]
              example: cash
            notes:
              type: string
    responses:
      201:
        description: Pago registrado
      400:
        description: Campos requeridos faltantes
      401:
        description: No autenticado (requiere rol professional)
    """
    data = request.get_json() or {}

    # Validate required fields
    required_fields = ['amount', 'payment_method']
    if not all(field in data for field in required_fields):
        return jsonify({'msg': 'Missing required fields'}), 400

    # Create payment
    try:
        payment_date = _parse_datetime(data.get('payment_date'))
    except ValueError as exc:
        return jsonify({'msg': str(exc)}), 400

    payment = Payment(
        budget_id=data.get('budget_id'),
        amount=data['amount'],
        currency=data.get('currency', 'ARS'),
        payment_method=data['payment_method'],
        payment_status='pending',
        transaction_id=data.get('transaction_id') or data.get('transaction_reference'),
        payment_date=payment_date,
        notes=data.get('notes')
    )

    db.session.add(payment)
    db.session.commit()

    return jsonify(payment_schema.dump(payment)), 201


@blueprint.route('/<int:payment_id>', methods=['PUT'])
@professional_required
def update_payment(payment_id):
    """Update payment.
    ---
    tags:
      - Payments
    security:
      - Bearer: []
    parameters:
      - in: path
        name: payment_id
        type: integer
        required: true
      - in: body
        name: body
        schema:
          type: object
          properties:
            amount:
              type: number
            currency:
              type: string
            payment_method:
              type: string
              enum: [cash, card, transfer, insurance, check, other]
            payment_status:
              type: string
              enum: [pending, completed, failed, refunded]
            transaction_reference:
              type: string
            notes:
              type: string
    responses:
      200:
        description: Pago actualizado
      404:
        description: Pago no encontrado
      401:
        description: No autenticado
    """
    payment = Payment.query.get(payment_id)

    if not payment:
        return jsonify({'msg': 'Payment not found'}), 404

    data = request.get_json() or {}

    # Update allowed fields
    if 'amount' in data:
        payment.amount = data['amount']
    if 'currency' in data:
        payment.currency = data['currency']
    if 'payment_method' in data:
        payment.payment_method = data['payment_method']
    if 'payment_status' in data:
        payment.payment_status = data['payment_status']
    # Support both transaction_id and transaction_reference
    if 'transaction_id' in data:
        payment.transaction_id = data['transaction_id']
    if 'transaction_reference' in data:
        payment.transaction_id = data['transaction_reference']
    if 'payment_date' in data:
        try:
            payment.payment_date = _parse_datetime(data.get('payment_date'))
        except ValueError as exc:
            return jsonify({'msg': str(exc)}), 400
    if 'notes' in data:
        payment.notes = data['notes']

    db.session.commit()

    return jsonify(payment_schema.dump(payment)), 200


@blueprint.route('/<int:payment_id>', methods=['DELETE'])
@professional_required
def delete_payment(payment_id):
    """Delete payment.
    ---
    tags:
      - Payments
    security:
      - Bearer: []
    parameters:
      - in: path
        name: payment_id
        type: integer
        required: true
        description: Payment ID
    responses:
      200:
        description: Pago eliminado
      404:
        description: Pago no encontrado
      401:
        description: No autenticado (requiere rol professional)
    """
    payment = Payment.query.get(payment_id)

    if not payment:
        return jsonify({'msg': 'Payment not found'}), 404

    db.session.delete(payment)
    db.session.commit()

    return jsonify({'msg': 'Payment deleted successfully'}), 200


@blueprint.route('/<int:payment_id>/process', methods=['POST'])
@professional_required
def process_payment(payment_id):
    """Process payment.
    ---
    tags:
      - Payments
    security:
      - Bearer: []
    parameters:
      - in: path
        name: payment_id
        type: integer
        required: true
      - in: body
        name: body
        schema:
          type: object
          properties:
            transaction_id:
              type: string
              description: ID de transacción externo (opcional)
            transaction_reference:
              type: string
              description: Referencia de transacción (alias de transaction_id)
    responses:
      200:
        description: Pago procesado exitosamente
      404:
        description: Pago no encontrado
      400:
        description: Pago ya procesado o inválido
      401:
        description: No autenticado
    """
    payment = Payment.query.get(payment_id)

    if not payment:
        return jsonify({'msg': 'Payment not found'}), 404

    data = request.get_json() or {}

    # Update payment status
    payment.payment_status = 'completed'
    payment.payment_date = datetime.utcnow()
    # Support both transaction_id and transaction_reference from frontend
    payment.transaction_id = data.get('transaction_id') or data.get('transaction_reference') or f'TXN-{payment_id}'

    db.session.commit()

    return jsonify(payment_schema.dump(payment)), 200
