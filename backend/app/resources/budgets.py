# -*- coding: utf-8 -*-
"""
Budget CRUD endpoints
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.budget import Budget
from app.schemas.budget_schema import BudgetSchema
from app.extensions import db
from app.services.budget_service import BudgetService
from app.services.exceptions import ValidationError, ResourceNotFoundError
from app.utils.decorators import professional_required

blueprint = Blueprint('budgets', __name__, url_prefix='/api/budgets')

budget_schema = BudgetSchema()
budgets_schema = BudgetSchema(many=True)


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
    try:
        budget = BudgetService.create_budget(data, current_user_id)
        return jsonify(budget_schema.dump(budget)), 201
    except ValidationError as exc:
        return jsonify({'msg': exc.message}), 400


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
    data = request.get_json() or {}
    try:
        budget = BudgetService.update_budget(budget_id, data)
        return jsonify(budget_schema.dump(budget)), 200
    except ValidationError as exc:
        return jsonify({'msg': exc.message}), 400
    except ResourceNotFoundError as exc:
        return jsonify({'msg': exc.message}), 404


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
    try:
        BudgetService.delete_budget(budget_id)
        return jsonify({'msg': 'Budget deleted'}), 200
    except ResourceNotFoundError as exc:
        return jsonify({'msg': exc.message}), 404


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
    try:
        budget = BudgetService.send_budget_to_patient(budget_id)
        return jsonify(budget_schema.dump(budget)), 200
    except ResourceNotFoundError as exc:
        return jsonify({'msg': exc.message}), 404


@blueprint.route('/<int:budget_id>/accept', methods=['POST'])
@jwt_required()
def accept_budget(budget_id):
    """Accept budget (patient action)"""
    try:
        budget = BudgetService.accept_budget(budget_id)
        return jsonify(budget_schema.dump(budget)), 200
    except ResourceNotFoundError as exc:
        return jsonify({'msg': exc.message}), 404
