# -*- coding: utf-8 -*-
"""
Odontogram CRUD endpoints
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.schemas.odontogram_schema import OdontogramSchema, ToothSchema
from app.services.exceptions import ResourceNotFoundError, ValidationError
from app.services.odontogram_service import OdontogramService

blueprint = Blueprint('odontograms', __name__, url_prefix='/api/odontograms')

odontogram_schema = OdontogramSchema()
odontograms_schema = OdontogramSchema(many=True)
tooth_schema = ToothSchema()
teeth_schema = ToothSchema(many=True)


def _service_error_response(error):
    status_map = {
        ValidationError: 400,
        ResourceNotFoundError: 404,
    }
    status = status_map.get(type(error), 400)
    payload = {'msg': error.message}
    if getattr(error, 'details', None):
        payload.update(error.details)
    return jsonify(payload), status


@blueprint.route('', methods=['GET'])
@jwt_required()
def list_odontograms():
    """List odontograms with optional patient filter
    ---
    tags:
      - Odontograms
    security:
      - Bearer: []
    parameters:
      - in: query
        name: patient_id
        type: integer
        required: false
        description: Filter by patient ID
    responses:
      200:
        description: List of odontograms
    """
    try:
        odontograms = OdontogramService.list_odontograms(
            patient_id=request.args.get('patient_id', type=int)
        )
        return jsonify(odontograms_schema.dump(odontograms)), 200
    except (ValidationError, ResourceNotFoundError) as error:
        return _service_error_response(error)


@blueprint.route('/patient/<int:patient_id>', methods=['GET'])
@jwt_required()
def get_patient_odontogram(patient_id):
    """Get active odontogram for a patient
    ---
    tags:
      - Odontograms
    security:
      - Bearer: []
    parameters:
      - in: path
        name: patient_id
        type: integer
        required: true
        description: ID del paciente
    responses:
      200:
        description: Odontograma activo del paciente
      404:
        description: No se encontró odontograma
    """
    try:
        payload = OdontogramService.get_patient_odontogram(patient_id)
        payload['teeth'] = teeth_schema.dump(payload['teeth'])
        return jsonify(payload), 200
    except (ValidationError, ResourceNotFoundError) as error:
        return _service_error_response(error)


@blueprint.route('', methods=['POST'])
@jwt_required()
def create_odontogram():
    """Create new odontogram
    ---
    tags:
      - Odontograms
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
          properties:
            patient_id:
              type: integer
            notes:
              type: string
            teeth:
              type: array
              items:
                type: object
                properties:
                  tooth_number:
                    type: integer
                  status:
                    type: string
                  mesial:
                    type: string
                  distal:
                    type: string
                  oclusal:
                    type: string
                  vestibular:
                    type: string
                  lingual:
                    type: string
                  notes:
                    type: string
    responses:
      201:
        description: Odontograma creado exitosamente
      400:
        description: Datos inválidos
    """
    try:
        odontogram = OdontogramService.create_odontogram(
            current_user_id=get_jwt_identity(),
            data=request.get_json() or {},
        )
        return jsonify(odontogram_schema.dump(odontogram)), 201
    except (ValidationError, ResourceNotFoundError) as error:
        return _service_error_response(error)


@blueprint.route('/<int:odontogram_id>', methods=['GET'])
@jwt_required()
def get_odontogram(odontogram_id):
    """Get odontogram by ID
    ---
    tags:
      - Odontograms
    security:
      - Bearer: []
    parameters:
      - in: path
        name: odontogram_id
        type: integer
        required: true
    responses:
      200:
        description: Odontograma encontrado
      404:
        description: Odontograma no encontrado
    """
    try:
        odontogram = OdontogramService.get_odontogram(odontogram_id)
        return jsonify(odontogram_schema.dump(odontogram)), 200
    except (ValidationError, ResourceNotFoundError) as error:
        return _service_error_response(error)


@blueprint.route('/<int:odontogram_id>', methods=['PUT'])
@jwt_required()
def update_odontogram(odontogram_id):
    """Update odontogram
    ---
    tags:
      - Odontograms
    security:
      - Bearer: []
    parameters:
      - in: path
        name: odontogram_id
        type: integer
        required: true
      - in: body
        name: body
        schema:
          type: object
          properties:
            notes:
              type: string
            is_active:
              type: boolean
    responses:
      200:
        description: Odontograma actualizado
      404:
        description: Odontograma no encontrado
    """
    try:
        odontogram = OdontogramService.update_odontogram(
            odontogram_id=odontogram_id,
            data=request.get_json() or {},
        )
        return jsonify(odontogram_schema.dump(odontogram)), 200
    except (ValidationError, ResourceNotFoundError) as error:
        return _service_error_response(error)


@blueprint.route('/<int:odontogram_id>/tooth', methods=['POST'])
@jwt_required()
def add_tooth_to_odontogram(odontogram_id):
    """Add or update tooth in odontogram
    ---
    tags:
      - Odontograms
    security:
      - Bearer: []
    parameters:
      - in: path
        name: odontogram_id
        type: integer
        required: true
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - tooth_number
          properties:
            tooth_number:
              type: integer
            status:
              type: string
            mesial:
              type: string
            distal:
              type: string
            oclusal:
              type: string
            vestibular:
              type: string
            lingual:
              type: string
    responses:
      201:
        description: Diente agregado/actualizado
      404:
        description: Odontograma no encontrado
    """
    try:
        tooth, _created = OdontogramService.add_or_update_tooth(
            odontogram_id=odontogram_id,
            data=request.get_json() or {},
        )
        return jsonify(tooth_schema.dump(tooth)), 201
    except (ValidationError, ResourceNotFoundError) as error:
        return _service_error_response(error)


@blueprint.route('/<int:odontogram_id>/teeth', methods=['GET'])
@jwt_required()
def get_odontogram_teeth(odontogram_id):
    """Get all teeth for an odontogram
    ---
    tags:
      - Odontograms
    security:
      - Bearer: []
    parameters:
      - in: path
        name: odontogram_id
        type: integer
        required: true
    responses:
      200:
        description: Lista de dientes del odontograma
      404:
        description: Odontograma no encontrado
    """
    try:
        teeth = OdontogramService.list_teeth(odontogram_id)
        return jsonify({'teeth': teeth_schema.dump(teeth)}), 200
    except (ValidationError, ResourceNotFoundError) as error:
        return _service_error_response(error)


@blueprint.route('/<int:odontogram_id>/tooth/<int:tooth_number>', methods=['GET'])
@blueprint.route('/<int:odontogram_id>/teeth/<int:tooth_number>', methods=['GET'])
@jwt_required()
def get_tooth(odontogram_id, tooth_number):
    """Get specific tooth from odontogram
    ---
    tags:
      - Odontograms
    security:
      - Bearer: []
    parameters:
      - in: path
        name: odontogram_id
        type: integer
        required: true
      - in: path
        name: tooth_number
        type: integer
        required: true
    responses:
      200:
        description: Información del diente
      404:
        description: Diente no encontrado
    """
    try:
        tooth = OdontogramService.get_tooth(odontogram_id, tooth_number)
        return jsonify(tooth_schema.dump(tooth)), 200
    except (ValidationError, ResourceNotFoundError) as error:
        return _service_error_response(error)


@blueprint.route('/<int:odontogram_id>/tooth/<int:tooth_number>', methods=['PUT'])
@blueprint.route('/<int:odontogram_id>/teeth/<int:tooth_number>', methods=['PUT'])
@jwt_required()
def update_tooth(odontogram_id, tooth_number):
    """Update specific tooth in odontogram
    ---
    tags:
      - Odontograms
    security:
      - Bearer: []
    parameters:
      - in: path
        name: odontogram_id
        type: integer
        required: true
      - in: path
        name: tooth_number
        type: integer
        required: true
      - in: body
        name: body
        schema:
          type: object
          properties:
            status:
              type: string
            mesial:
              type: string
            distal:
              type: string
            oclusal:
              type: string
            vestibular:
              type: string
            lingual:
              type: string
            notes:
              type: string
    responses:
      200:
        description: Diente actualizado
      404:
        description: Diente no encontrado
    """
    try:
        tooth = OdontogramService.upsert_tooth(
            odontogram_id=odontogram_id,
            tooth_number=tooth_number,
            data=request.get_json() or {},
        )
        return jsonify(tooth_schema.dump(tooth)), 200
    except (ValidationError, ResourceNotFoundError) as error:
        return _service_error_response(error)


@blueprint.route('/<int:odontogram_id>/tooth/<int:tooth_number>', methods=['DELETE'])
@blueprint.route('/<int:odontogram_id>/teeth/<int:tooth_number>', methods=['DELETE'])
@jwt_required()
def delete_tooth(odontogram_id, tooth_number):
    """Delete tooth from odontogram
    ---
    tags:
      - Odontograms
    security:
      - Bearer: []
    parameters:
      - in: path
        name: odontogram_id
        type: integer
        required: true
      - in: path
        name: tooth_number
        type: integer
        required: true
    responses:
      200:
        description: Diente eliminado
      404:
        description: Diente no encontrado
    """
    try:
        OdontogramService.delete_tooth(odontogram_id, tooth_number)
        return jsonify({'msg': 'Tooth deleted successfully'}), 200
    except (ValidationError, ResourceNotFoundError) as error:
        return _service_error_response(error)
