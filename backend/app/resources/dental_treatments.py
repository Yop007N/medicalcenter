# -*- coding: utf-8 -*-
"""
Dental Treatment CRUD endpoints
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.resources.domain_errors import domain_error_response
from app.schemas.odontogram_schema import DentalTreatmentSchema
from app.services.dental_treatment_service import DentalTreatmentService
from app.services.exceptions import ResourceNotFoundError, ValidationError
from app.utils.decorators import module_access_required
from app.utils.helpers import get_pagination_params

blueprint = Blueprint('dental_treatments', __name__, url_prefix='/api/dental-treatments')

treatment_schema = DentalTreatmentSchema()
treatments_schema = DentalTreatmentSchema(many=True)


@blueprint.before_request
@module_access_required('odontology')
def _enforce_module_scope():
    return None


@blueprint.route('', methods=['GET'])
@jwt_required()
def list_treatments():
    """List dental treatments with optional filters
    ---
    tags:
      - Dental Treatments
    security:
      - Bearer: []
    parameters:
      - in: query
        name: patient_id
        type: integer
        description: Filtrar por paciente
      - in: query
        name: professional_id
        type: integer
        description: Filtrar por profesional
      - in: query
        name: treatment_type
        type: string
        description: Tipo de tratamiento
      - in: query
        name: status
        type: string
        description: Estado (planned, in_progress, completed, cancelled)
      - in: query
        name: date_from
        type: string
        format: date
        description: Fecha desde
      - in: query
        name: date_to
        type: string
        format: date
        description: Fecha hasta
      - in: query
        name: page
        type: integer
        default: 1
      - in: query
        name: per_page
        type: integer
        default: 20
    responses:
      200:
        description: Lista paginada de tratamientos
    """
    page, per_page = get_pagination_params(request)

    filters = {
        'patient_id': request.args.get('patient_id', type=int),
        'professional_id': request.args.get('professional_id', type=int),
        'treatment_type': request.args.get('treatment_type'),
        'status': request.args.get('status'),
        'date_from': request.args.get('date_from'),
        'date_to': request.args.get('date_to'),
    }

    try:
        pagination = DentalTreatmentService.list_treatments(filters, page, per_page)
    except ValidationError as exc:
        return domain_error_response(exc)

    return jsonify({
        'items': treatments_schema.dump(pagination.items),
        'total': pagination.total,
        'page': pagination.page,
        'pages': pagination.pages,
        'per_page': per_page
    }), 200


@blueprint.route('/<int:treatment_id>', methods=['GET'])
@jwt_required()
def get_treatment(treatment_id):
    """Get dental treatment by ID
    ---
    tags:
      - Dental Treatments
    security:
      - Bearer: []
    parameters:
      - in: path
        name: treatment_id
        type: integer
        required: true
    responses:
      200:
        description: Tratamiento encontrado
      404:
        description: Tratamiento no encontrado
    """
    try:
        treatment = DentalTreatmentService.get_treatment(treatment_id)
        return jsonify(treatment_schema.dump(treatment)), 200
    except ResourceNotFoundError as exc:
        return domain_error_response(exc)


@blueprint.route('', methods=['POST'])
@jwt_required()
def create_treatment():
    """Create new dental treatment
    ---
    tags:
      - Dental Treatments
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
            - treatment_type
            - treatment_date
          properties:
            patient_id:
              type: integer
            treatment_type:
              type: string
            treatment_date:
              type: string
              format: date
            affected_teeth:
              type: array
              items:
                type: integer
            description:
              type: string
            materials_used:
              type: array
              items:
                type: string
            estimated_cost:
              type: number
    responses:
      201:
        description: Tratamiento creado exitosamente
      400:
        description: Datos inválidos
    """
    data = request.get_json() or {}
    current_user_id = int(get_jwt_identity())
    try:
        treatment = DentalTreatmentService.create_treatment(data, current_user_id)
        return jsonify(treatment_schema.dump(treatment)), 201
    except (ValidationError, ResourceNotFoundError) as exc:
        return domain_error_response(exc)


@blueprint.route('/<int:treatment_id>', methods=['PUT'])
@jwt_required()
def update_treatment(treatment_id):
    """Update dental treatment
    ---
    tags:
      - Dental Treatments
    security:
      - Bearer: []
    parameters:
      - in: path
        name: treatment_id
        type: integer
        required: true
      - in: body
        name: body
        schema:
          type: object
          properties:
            status:
              type: string
            description:
              type: string
            post_treatment_notes:
              type: string
            complications:
              type: string
            final_cost:
              type: number
            completion_date:
              type: string
              format: date
    responses:
      200:
        description: Tratamiento actualizado
      404:
        description: Tratamiento no encontrado
    """
    data = request.get_json() or {}
    try:
        treatment = DentalTreatmentService.update_treatment(treatment_id, data)
        return jsonify(treatment_schema.dump(treatment)), 200
    except (ValidationError, ResourceNotFoundError) as exc:
        return domain_error_response(exc)


@blueprint.route('/<int:treatment_id>', methods=['DELETE'])
@jwt_required()
def delete_treatment(treatment_id):
    """Delete dental treatment
    ---
    tags:
      - Dental Treatments
    security:
      - Bearer: []
    parameters:
      - in: path
        name: treatment_id
        type: integer
        required: true
    responses:
      200:
        description: Tratamiento eliminado
      404:
        description: Tratamiento no encontrado
    """
    try:
        DentalTreatmentService.delete_treatment(treatment_id)
        return jsonify({'msg': 'Treatment deleted successfully'}), 200
    except ResourceNotFoundError as exc:
        return domain_error_response(exc)


@blueprint.route('/patient/<int:patient_id>/history', methods=['GET'])
@jwt_required()
def get_patient_treatment_history(patient_id):
    """Get complete treatment history for a patient
    ---
    tags:
      - Dental Treatments
    security:
      - Bearer: []
    parameters:
      - in: path
        name: patient_id
        type: integer
        required: true
    responses:
      200:
        description: Historial completo de tratamientos
      404:
        description: Paciente no encontrado
    """
    page, per_page = get_pagination_params(request)
    status = request.args.get('status')
    try:
        pagination = DentalTreatmentService.get_patient_treatment_history(
            patient_id=patient_id,
            status=status,
            page=page,
            per_page=per_page,
        )
        return jsonify({
            'treatments': treatments_schema.dump(pagination.items),
            'total': pagination.total,
            'page': pagination.page,
            'pages': pagination.pages
        }), 200
    except ResourceNotFoundError as exc:
        return domain_error_response(exc)


@blueprint.route('/<int:treatment_id>/complete', methods=['POST'])
@jwt_required()
def complete_treatment(treatment_id):
    """Mark treatment as completed
    ---
    tags:
      - Dental Treatments
    security:
      - Bearer: []
    parameters:
      - in: path
        name: treatment_id
        type: integer
        required: true
      - in: body
        name: body
        schema:
          type: object
          properties:
            completion_notes:
              type: string
            final_cost:
              type: number
            treatment_success:
              type: boolean
    responses:
      200:
        description: Tratamiento marcado como completado
      404:
        description: Tratamiento no encontrado
    """
    data = request.get_json() or {}
    try:
        treatment = DentalTreatmentService.complete_treatment(treatment_id, data)
        return jsonify({
            'msg': 'Treatment completed successfully',
            'treatment': treatment_schema.dump(treatment)
        }), 200
    except ResourceNotFoundError as exc:
        return domain_error_response(exc)


@blueprint.route('/<int:treatment_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_treatment(treatment_id):
    """Cancel a dental treatment
    ---
    tags:
      - Dental Treatments
    security:
      - Bearer: []
    parameters:
      - in: path
        name: treatment_id
        type: integer
        required: true
      - in: body
        name: body
        schema:
          type: object
          properties:
            cancellation_reason:
              type: string
    responses:
      200:
        description: Tratamiento cancelado
      404:
        description: Tratamiento no encontrado
    """
    data = request.get_json() or {}
    try:
        treatment = DentalTreatmentService.cancel_treatment(treatment_id, data)
        return jsonify(treatment_schema.dump(treatment)), 200
    except ResourceNotFoundError as exc:
        return domain_error_response(exc)
