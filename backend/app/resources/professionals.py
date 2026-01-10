# -*- coding: utf-8 -*-
"""
Professional CRUD endpoints
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.professional import Professional
from app.schemas.professional_schema import ProfessionalSchema
from app.extensions import db, cache
from app.utils.decorators import admin_required
from app.utils.helpers import validate_required_fields, sanitize_search_input
from app.utils.constants import CACHE_TTL_SHORT

blueprint = Blueprint('professionals', __name__, url_prefix='/api/professionals')

professional_schema = ProfessionalSchema()
professionals_schema = ProfessionalSchema(many=True)


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

    query = Professional.query
    if specialty:
        # Sanitize search input to prevent SQL injection
        sanitized_specialty = sanitize_search_input(specialty)
        if sanitized_specialty:
            query = query.filter(Professional.specialty.ilike(f'%{sanitized_specialty}%'))

    professionals = query.all()
    return jsonify(professionals_schema.dump(professionals)), 200


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
    professional = Professional.query.get(professional_id)
    if not professional:
        return jsonify({'msg': 'Professional not found'}), 404

    return jsonify(professional_schema.dump(professional)), 200


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

    # Validate required fields using helper
    required_fields = ['email', 'password', 'first_name', 'last_name', 'license_number']
    is_valid, missing_fields = validate_required_fields(data, required_fields)
    if not is_valid:
        return jsonify({
            'msg': 'Missing required fields',
            'missing_fields': missing_fields
        }), 400

    # Check if email or license already exists
    if Professional.query.filter_by(email=data['email']).first():
        return jsonify({'msg': 'Email already registered'}), 400

    if Professional.query.filter_by(license_number=data['license_number']).first():
        return jsonify({'msg': 'License number already registered'}), 400

    # Create professional
    professional = Professional(
        email=data['email'],
        first_name=data['first_name'],
        last_name=data['last_name'],
        role='professional',
        license_number=data['license_number'],
        specialty=data.get('specialty'),
        phone=data.get('phone'),
        address=data.get('address')
    )
    professional.set_password(data['password'])

    db.session.add(professional)
    db.session.commit()

    return jsonify(professional_schema.dump(professional)), 201


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
    professional = Professional.query.get(professional_id)

    if not professional:
        return jsonify({'msg': 'Professional not found'}), 404

    # Only allow updating own profile unless admin
    # This is simplified - in production check role properly
    if professional.id != current_user_id:
        from app.models.user import User
        current_user = User.query.get(current_user_id)
        if not current_user or current_user.role != 'admin':
            return jsonify({'msg': 'Unauthorized'}), 403

    data = request.get_json() or {}

    # Update allowed fields
    if 'first_name' in data:
        professional.first_name = data['first_name']
    if 'last_name' in data:
        professional.last_name = data['last_name']
    if 'specialty' in data:
        professional.specialty = data['specialty']
    if 'phone' in data:
        professional.phone = data['phone']
    if 'address' in data:
        professional.address = data['address']
    if 'password' in data:
        professional.set_password(data['password'])

    db.session.commit()

    return jsonify(professional_schema.dump(professional)), 200


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
    professional = Professional.query.get(professional_id)

    if not professional:
        return jsonify({'msg': 'Professional not found'}), 404

    db.session.delete(professional)
    db.session.commit()

    return jsonify({'msg': 'Professional deleted'}), 200


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
    professional = Professional.query.get(professional_id)

    if not professional:
        return jsonify({'msg': 'Professional not found'}), 404

    from app.schemas.appointment_schema import AppointmentSchema
    appointments_schema = AppointmentSchema(many=True)

    appointments = professional.appointments.all()
    return jsonify(appointments_schema.dump(appointments)), 200
