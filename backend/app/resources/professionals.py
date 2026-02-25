# -*- coding: utf-8 -*-
"""
Professional CRUD endpoints
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.schemas.professional_schema import ProfessionalSchema
from app.extensions import cache
from app.resources.domain_errors import domain_error_response
from app.services.exceptions import AccessDeniedError, ResourceNotFoundError, ValidationError
from app.services.professional_service import ProfessionalService
from app.utils.decorators import admin_required
from app.utils.constants import CACHE_TTL_SHORT

blueprint = Blueprint('professionals', __name__, url_prefix='/api/professionals')

professional_schema = ProfessionalSchema()
professionals_schema = ProfessionalSchema(many=True)


def serialize_professional(professional):
    """Serialize professional payload with frontend-compatible aliases."""
    payload = professional_schema.dump(professional)
    office_address = payload.get('address')
    payload.setdefault('office_address', office_address)
    payload.setdefault('working_hours', None)
    payload.setdefault('consultation_fee', None)
    payload.setdefault('bio', None)
    payload.setdefault('is_active', True)
    return payload


@blueprint.route('', methods=['GET'])
@jwt_required()
@cache.cached(timeout=CACHE_TTL_SHORT, query_string=True)
def list_professionals():
    """List all professionals (cached for 5 minutes)
    ---
    tags:
      - Professionals
    security:
      - Bearer: []
    parameters:
      - in: query
        name: specialty
        type: string
        description: Filtrar por especialidad médica
    responses:
      200:
        description: Lista de profesionales (cacheada 5 minutos)
        schema:
          type: array
          items:
            type: object
      401:
        description: No autenticado
    """
    specialty = request.args.get('specialty')
    current_user_id = int(get_jwt_identity())
    professionals = ProfessionalService.list_professionals(
        specialty=specialty,
        current_user_id=current_user_id,
    )
    return jsonify([serialize_professional(professional) for professional in professionals]), 200


@blueprint.route('/<int:professional_id>', methods=['GET'])
@jwt_required()
def get_professional(professional_id):
    """Get professional by ID
    ---
    tags:
      - Professionals
    security:
      - Bearer: []
    parameters:
      - in: path
        name: professional_id
        type: integer
        required: true
        description: ID del profesional
    responses:
      200:
        description: Profesional encontrado
      404:
        description: Profesional no encontrado
      401:
        description: No autenticado
    """
    try:
        professional = ProfessionalService.get_professional(professional_id)
        return jsonify(serialize_professional(professional)), 200
    except ResourceNotFoundError as exc:
        return domain_error_response(exc)


@blueprint.route('', methods=['POST'])
@admin_required
def create_professional():
    """Create new professional
    ---
    tags:
      - Professionals
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - email
            - password
            - first_name
            - last_name
            - license_number
          properties:
            email:
              type: string
            password:
              type: string
            first_name:
              type: string
            last_name:
              type: string
            license_number:
              type: string
            specialty:
              type: string
            phone:
              type: string
            address:
              type: string
    responses:
      201:
        description: Profesional creado exitosamente
      400:
        description: Datos inválidos o email/licencia duplicados
      401:
        description: No autenticado
      403:
        description: Requiere rol de administrador
    """
    data = request.get_json() or {}
    try:
        professional = ProfessionalService.create_professional(data)
        cache.delete_memoized(list_professionals)
        return jsonify(serialize_professional(professional)), 201
    except ValidationError as exc:
        return domain_error_response(exc)


@blueprint.route('/<int:professional_id>', methods=['PUT'])
@jwt_required()
def update_professional(professional_id):
    """Update professional
    ---
    tags:
      - Professionals
    security:
      - Bearer: []
    parameters:
      - in: path
        name: professional_id
        type: integer
        required: true
      - in: body
        name: body
        schema:
          type: object
          properties:
            first_name:
              type: string
            last_name:
              type: string
            specialty:
              type: string
            phone:
              type: string
            address:
              type: string
            password:
              type: string
    responses:
      200:
        description: Profesional actualizado
      404:
        description: Profesional no encontrado
      403:
        description: No autorizado
    """
    current_user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    try:
        professional = ProfessionalService.update_professional(
            professional_id=professional_id,
            current_user_id=current_user_id,
            data=data,
        )
        cache.delete_memoized(list_professionals)
        return jsonify(serialize_professional(professional)), 200
    except (ResourceNotFoundError, AccessDeniedError, ValidationError) as exc:
        return domain_error_response(exc)


@blueprint.route('/<int:professional_id>', methods=['DELETE'])
@admin_required
def delete_professional(professional_id):
    """Delete professional
    ---
    tags:
      - Professionals
    security:
      - Bearer: []
    parameters:
      - in: path
        name: professional_id
        type: integer
        required: true
    responses:
      200:
        description: Profesional eliminado
      404:
        description: Profesional no encontrado
      403:
        description: Requiere rol de administrador
    """
    try:
        ProfessionalService.delete_professional(professional_id)
        cache.delete_memoized(list_professionals)
        return jsonify({'msg': 'Professional deleted'}), 200
    except ResourceNotFoundError as exc:
        return domain_error_response(exc)


@blueprint.route('/<int:professional_id>/appointments', methods=['GET'])
@jwt_required()
def get_professional_appointments(professional_id):
    """Get professional's appointments
    ---
    tags:
      - Professionals
    security:
      - Bearer: []
    parameters:
      - in: path
        name: professional_id
        type: integer
        required: true
    responses:
      200:
        description: Lista de turnos del profesional
        schema:
          type: array
          items:
            type: object
      404:
        description: Profesional no encontrado
    """
    from app.schemas.appointment_schema import AppointmentSchema
    appointments_schema = AppointmentSchema(many=True)
    try:
        appointments = ProfessionalService.get_professional_appointments(professional_id)
        return jsonify(appointments_schema.dump(appointments)), 200
    except ResourceNotFoundError as exc:
        return domain_error_response(exc)
