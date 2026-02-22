# -*- coding: utf-8 -*-
"""
Budget CRUD endpoints
"""

from datetime import date, datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.budget import Budget
from app.schemas.budget_schema import BudgetSchema
from app.extensions import db
from app.utils.decorators import professional_required

blueprint = Blueprint('budgets', __name__, url_prefix='/api/budgets')

budget_schema = BudgetSchema()
budgets_schema = BudgetSchema(many=True)

VALID_BUDGET_STATUSES = {'draft', 'sent', 'accepted', 'rejected', 'expired'}


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
            raise ValueError('Invalid date format. Use YYYY-MM-DD') from exc
    raise ValueError('Invalid date value')


@blueprint.route('', methods=['GET'])
@jwt_required()
def list_budgets():
    """List budgets with optional filters.
    ---
    tags:
      - Budgets
    security:
      - Bearer: []
    parameters:
      - in: query
        name: patient_id
        type: integer
        required: false
        description: Filter by patient ID
      - in: query
        name: status
        type: string
        enum: [draft, sent, accepted, rejected, expired]
        required: false
        description: Filter by status
    responses:
      200:
        description: Lista de presupuestos
      401:
        description: No autenticado
    """
    patient_id = request.args.get('patient_id', type=int)
    status = request.args.get('status')

    query = Budget.query

    if patient_id:
        query = query.filter_by(patient_id=patient_id)
    if status:
        query = query.filter_by(status=status)

    budgets = query.order_by(db.desc(Budget.created_at)).all()
    return jsonify(budgets_schema.dump(budgets)), 200


@blueprint.route('/<int:budget_id>', methods=['GET'])
@jwt_required()
def get_budget(budget_id):
    """Get budget by ID.
    ---
    tags:
      - Budgets
    security:
      - Bearer: []
    parameters:
      - in: path
        name: budget_id
        type: integer
        required: true
        description: Budget ID
    responses:
      200:
        description: Presupuesto encontrado
      404:
        description: Presupuesto no encontrado
      401:
        description: No autenticado
    """
    budget = Budget.query.get(budget_id)

    if not budget:
        return jsonify({'msg': 'Budget not found'}), 404

    return jsonify(budget_schema.dump(budget)), 200


@blueprint.route('', methods=['POST'])
@professional_required
def create_budget():
    """Create new budget.
    ---
    tags:
      - Budgets
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - patient_id
            - title
            - total_amount
          properties:
            patient_id:
              type: integer
              example: 1
            title:
              type: string
              example: "Tratamiento de ortodoncia"
            description:
              type: string
            total_amount:
              type: number
              format: float
              example: 15000.00
            currency:
              type: string
              default: ARS
            valid_until:
              type: string
              format: date
            items:
              type: array
              items:
                type: object
    responses:
      201:
        description: Presupuesto creado
      400:
        description: Campos requeridos faltantes
      401:
        description: No autenticado (requiere rol professional)
    """
    current_user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    # Validate required fields
    required_fields = ['patient_id', 'title', 'total_amount']
    if not all(field in data for field in required_fields):
        return jsonify({'msg': 'Missing required fields'}), 400

    # Create budget
    try:
        valid_until = _parse_date(data.get('valid_until'))
    except ValueError as exc:
        return jsonify({'msg': str(exc)}), 400

    budget = Budget(
        patient_id=data['patient_id'],
        created_by=current_user_id,
        title=data['title'],
        description=data.get('description'),
        total_amount=data['total_amount'],
        currency=data.get('currency', 'ARS'),
        status='draft',
        valid_until=valid_until,
        items=data.get('items', [])
    )

    db.session.add(budget)
    db.session.commit()

    return jsonify(budget_schema.dump(budget)), 201


@blueprint.route('/<int:budget_id>', methods=['PUT'])
@professional_required
def update_budget(budget_id):
    """Update budget.
    ---
    tags:
      - Budgets
    security:
      - Bearer: []
    parameters:
      - in: path
        name: budget_id
        type: integer
        required: true
      - in: body
        name: body
        schema:
          type: object
          properties:
            title:
              type: string
            description:
              type: string
            total_amount:
              type: number
            valid_until:
              type: string
              format: date
    responses:
      200:
        description: Presupuesto actualizado
      404:
        description: Presupuesto no encontrado
      401:
        description: No autenticado
    """
    budget = Budget.query.get(budget_id)

    if not budget:
        return jsonify({'msg': 'Budget not found'}), 404

    data = request.get_json() or {}

    # Update allowed fields
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
        try:
            budget.valid_until = _parse_date(data['valid_until'])
        except ValueError as exc:
            return jsonify({'msg': str(exc)}), 400
    if 'status' in data:
        if data['status'] not in VALID_BUDGET_STATUSES:
            return jsonify({'msg': 'Invalid budget status'}), 400
        budget.status = data['status']
    if 'items' in data:
        budget.items = data['items']

    db.session.commit()

    return jsonify(budget_schema.dump(budget)), 200


@blueprint.route('/<int:budget_id>', methods=['DELETE'])
@professional_required
def delete_budget(budget_id):
    """Delete budget.
    ---
    tags:
      - Budgets
    security:
      - Bearer: []
    parameters:
      - in: path
        name: budget_id
        type: integer
        required: true
    responses:
      200:
        description: Presupuesto eliminado
      404:
        description: Presupuesto no encontrado
      401:
        description: No autenticado
    """
    budget = Budget.query.get(budget_id)

    if not budget:
        return jsonify({'msg': 'Budget not found'}), 404

    db.session.delete(budget)
    db.session.commit()

    return jsonify({'msg': 'Budget deleted'}), 200


@blueprint.route('/<int:budget_id>/send', methods=['POST'])
@professional_required
def send_budget(budget_id):
    """Send budget to patient.
    ---
    tags:
      - Budgets
    security:
      - Bearer: []
    parameters:
      - in: path
        name: budget_id
        type: integer
        required: true
    responses:
      200:
        description: Presupuesto enviado al paciente
      404:
        description: Presupuesto no encontrado
      401:
        description: No autenticado
    """
    budget = Budget.query.get(budget_id)

    if not budget:
        return jsonify({'msg': 'Budget not found'}), 404

    budget.status = 'sent'
    db.session.commit()

    # TODO: Send notification to patient

    return jsonify(budget_schema.dump(budget)), 200


@blueprint.route('/<int:budget_id>/accept', methods=['POST'])
@jwt_required()
def accept_budget(budget_id):
    """Accept budget (patient action)"""
    budget = Budget.query.get(budget_id)

    if not budget:
        return jsonify({'msg': 'Budget not found'}), 404

    budget.status = 'accepted'
    db.session.commit()

    return jsonify(budget_schema.dump(budget)), 200
