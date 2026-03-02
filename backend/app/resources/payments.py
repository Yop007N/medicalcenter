# -*- coding: utf-8 -*-
"""
Payment CRUD endpoints
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.resources.domain_errors import domain_error_response
from app.schemas.payment_schema import PaymentSchema
from app.services.exceptions import AccessDeniedError, ResourceNotFoundError, ValidationError
from app.services.payment_service import PaymentService
from app.utils.decorators import professional_required

blueprint = Blueprint('payments', __name__, url_prefix='/api/payments')

payment_schema = PaymentSchema()
payments_schema = PaymentSchema(many=True)


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
    patient_id = request.args.get('patient_id', type=int)
    specialty_key = request.args.get('specialty_key')
    try:
        payments = PaymentService.list_payments(
            current_user_id=int(get_jwt_identity()),
            budget_id=budget_id,
            status=status,
            patient_id=patient_id,
            specialty_key=specialty_key,
        )
        return jsonify(payments_schema.dump(payments)), 200
    except (ValidationError, AccessDeniedError) as exc:
        return domain_error_response(exc)


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
    try:
        payment = PaymentService.get_payment(
            payment_id=payment_id,
            current_user_id=int(get_jwt_identity()),
            specialty_key=request.args.get('specialty_key'),
        )
        return jsonify(payment_schema.dump(payment)), 200
    except (ResourceNotFoundError, ValidationError, AccessDeniedError) as exc:
        return domain_error_response(exc)


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
              default: PYG
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
    try:
        specialty_key = request.args.get('specialty_key') or data.get('specialty_key')
        payment = PaymentService.create_payment(
            data=data,
            current_user_id=int(get_jwt_identity()),
            specialty_key=specialty_key,
        )
        return jsonify(payment_schema.dump(payment)), 201
    except (ValidationError, AccessDeniedError) as exc:
        return domain_error_response(exc)


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
    data = request.get_json() or {}
    try:
        specialty_key = request.args.get('specialty_key') or data.get('specialty_key')
        payment = PaymentService.update_payment(
            payment_id=payment_id,
            data=data,
            current_user_id=int(get_jwt_identity()),
            specialty_key=specialty_key,
        )
        return jsonify(payment_schema.dump(payment)), 200
    except (ValidationError, ResourceNotFoundError, AccessDeniedError) as exc:
        return domain_error_response(exc)


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
    try:
        PaymentService.delete_payment(
            payment_id=payment_id,
            current_user_id=int(get_jwt_identity()),
            specialty_key=request.args.get('specialty_key'),
        )
        return jsonify({'msg': 'Payment deleted successfully'}), 200
    except (ResourceNotFoundError, ValidationError, AccessDeniedError) as exc:
        return domain_error_response(exc)


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
    data = request.get_json() or {}
    try:
        specialty_key = request.args.get('specialty_key') or data.get('specialty_key')
        payment = PaymentService.process_payment(
            payment_id=payment_id,
            data=data,
            current_user_id=int(get_jwt_identity()),
            specialty_key=specialty_key,
        )
        return jsonify(payment_schema.dump(payment)), 200
    except (ResourceNotFoundError, ValidationError, AccessDeniedError) as exc:
        return domain_error_response(exc)
