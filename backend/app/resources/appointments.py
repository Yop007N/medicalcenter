# -*- coding: utf-8 -*-
"""
Appointment CRUD endpoints
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app.models.appointment import Appointment
from app.schemas.appointment_schema import AppointmentSchema
from app.extensions import db
from app.utils.decorators import professional_required
from app.utils.helpers import get_pagination_params, validate_required_fields
from app.utils.constants import DEFAULT_APPOINTMENT_DURATION

blueprint = Blueprint('appointments', __name__, url_prefix='/api/appointments')

appointment_schema = AppointmentSchema()
appointments_schema = AppointmentSchema(many=True)


@blueprint.route('', methods=['GET'])
@jwt_required()
def list_appointments():
    """List appointments with optional filters and pagination
    ---
    tags:
      - Appointments
    security:
      - Bearer: []
    parameters:
      - in: query
        name: professional_id
        type: integer
        description: ID del profesional
      - in: query
        name: patient_id
        type: integer
        description: ID del paciente
      - in: query
        name: status
        type: string
        description: Estado del turno (scheduled, confirmed, cancelled, completed)
      - in: query
        name: date_from
        type: string
        format: date-time
        description: Fecha desde (ISO format)
      - in: query
        name: date_to
        type: string
        format: date-time
        description: Fecha hasta (ISO format)
      - in: query
        name: page
        type: integer
        default: 1
        description: Número de página
      - in: query
        name: per_page
        type: integer
        default: 20
        description: Elementos por página (máximo 100)
    responses:
      200:
        description: Lista paginada de turnos
        schema:
          type: object
          properties:
            items:
              type: array
            total:
              type: integer
            page:
              type: integer
            pages:
              type: integer
            per_page:
              type: integer
      401:
        description: No autenticado
    """
    # Pagination parameters using helper
    page, per_page = get_pagination_params(request)

    professional_id = request.args.get('professional_id', type=int)
    patient_id = request.args.get('patient_id', type=int)
    status = request.args.get('status')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')

    query = Appointment.query

    if professional_id:
        query = query.filter_by(professional_id=professional_id)
    if patient_id:
        query = query.filter_by(patient_id=patient_id)
    if status:
        query = query.filter_by(status=status)
    if date_from:
        query = query.filter(Appointment.appointment_date >= datetime.fromisoformat(date_from))
    if date_to:
        query = query.filter(Appointment.appointment_date <= datetime.fromisoformat(date_to))

    pagination = query.order_by(Appointment.appointment_date).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        'items': appointments_schema.dump(pagination.items),
        'total': pagination.total,
        'page': pagination.page,
        'pages': pagination.pages,
        'per_page': per_page
    }), 200


@blueprint.route('/<int:appointment_id>', methods=['GET'])
@jwt_required()
def get_appointment(appointment_id):
    """Get appointment by ID
    ---
    tags:
      - Appointments
    security:
      - Bearer: []
    parameters:
      - in: path
        name: appointment_id
        type: integer
        required: true
    responses:
      200:
        description: Turno encontrado
      404:
        description: Turno no encontrado
    """
    appointment = Appointment.query.get(appointment_id)
    if not appointment:
        return jsonify({'msg': 'Appointment not found'}), 404

    return jsonify(appointment_schema.dump(appointment)), 200


@blueprint.route('', methods=['POST'])
@jwt_required()
def create_appointment():
    """Create new appointment
    ---
    tags:
      - Appointments
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
            - professional_id
            - appointment_date
          properties:
            patient_id:
              type: integer
            professional_id:
              type: integer
            appointment_date:
              type: string
              format: date-time
            duration_minutes:
              type: integer
              default: 30
            appointment_type:
              type: string
            reason:
              type: string
            notes:
              type: string
    responses:
      201:
        description: Turno creado exitosamente
      400:
        description: Datos inválidos o campos faltantes
      409:
        description: Conflicto - horario ya reservado
    """
    data = request.get_json() or {}

    # Validate required fields using helper
    required_fields = ['patient_id', 'professional_id', 'appointment_date']
    is_valid, missing_fields = validate_required_fields(data, required_fields)
    if not is_valid:
        return jsonify({
            'msg': 'Missing required fields',
            'missing_fields': missing_fields
        }), 400

    # Parse date
    try:
        appointment_date = datetime.fromisoformat(data['appointment_date'])
    except ValueError:
        return jsonify({'msg': 'Invalid date format'}), 400

    # Check for conflicts
    duration = data.get('duration_minutes', DEFAULT_APPOINTMENT_DURATION)
    conflicts = Appointment.query.filter(
        Appointment.professional_id == data['professional_id'],
        Appointment.appointment_date == appointment_date,
        Appointment.status.in_(['scheduled', 'confirmed'])
    ).first()

    if conflicts:
        return jsonify({'msg': 'Time slot already booked'}), 409

    # Create appointment
    appointment = Appointment(
        patient_id=data['patient_id'],
        professional_id=data['professional_id'],
        appointment_date=appointment_date,
        duration_minutes=duration,
        status='scheduled',
        appointment_type=data.get('appointment_type'),
        reason=data.get('reason'),
        notes=data.get('notes')
    )

    db.session.add(appointment)
    db.session.commit()

    return jsonify(appointment_schema.dump(appointment)), 201


@blueprint.route('/<int:appointment_id>', methods=['PUT'])
@jwt_required()
def update_appointment(appointment_id):
    """Update appointment
    ---
    tags:
      - Appointments
    security:
      - Bearer: []
    parameters:
      - in: path
        name: appointment_id
        type: integer
        required: true
      - in: body
        name: body
        schema:
          type: object
          properties:
            appointment_date:
              type: string
              format: date-time
            duration_minutes:
              type: integer
            status:
              type: string
              enum: [scheduled, confirmed, cancelled, completed]
            appointment_type:
              type: string
            reason:
              type: string
            notes:
              type: string
    responses:
      200:
        description: Turno actualizado
      404:
        description: Turno no encontrado
      400:
        description: Formato de fecha inválido
    """
    appointment = Appointment.query.get(appointment_id)

    if not appointment:
        return jsonify({'msg': 'Appointment not found'}), 404

    data = request.get_json() or {}

    # Update allowed fields
    if 'patient_id' in data:
        appointment.patient_id = data['patient_id']
    if 'professional_id' in data:
        appointment.professional_id = data['professional_id']
    if 'appointment_date' in data:
        try:
            appointment.appointment_date = datetime.fromisoformat(data['appointment_date'])
        except ValueError:
            return jsonify({'msg': 'Invalid date format'}), 400

    if 'duration_minutes' in data:
        appointment.duration_minutes = data['duration_minutes']
    if 'status' in data:
        appointment.status = data['status']
    if 'appointment_type' in data:
        appointment.appointment_type = data['appointment_type']
    if 'reason' in data:
        appointment.reason = data['reason']
    if 'notes' in data:
        appointment.notes = data['notes']

    db.session.commit()

    return jsonify(appointment_schema.dump(appointment)), 200


@blueprint.route('/<int:appointment_id>', methods=['DELETE'])
@jwt_required()
def cancel_appointment(appointment_id):
    """Cancel appointment
    ---
    tags:
      - Appointments
    security:
      - Bearer: []
    parameters:
      - in: path
        name: appointment_id
        type: integer
        required: true
    responses:
      200:
        description: Turno cancelado
      404:
        description: Turno no encontrado
    """
    appointment = Appointment.query.get(appointment_id)

    if not appointment:
        return jsonify({'msg': 'Appointment not found'}), 404

    appointment.status = 'cancelled'
    db.session.commit()

    return jsonify({'msg': 'Appointment cancelled'}), 200


@blueprint.route('/<int:appointment_id>/confirm', methods=['POST'])
@professional_required
def confirm_appointment(appointment_id):
    """Confirm appointment
    ---
    tags:
      - Appointments
    security:
      - Bearer: []
    parameters:
      - in: path
        name: appointment_id
        type: integer
        required: true
    responses:
      200:
        description: Turno confirmado
      404:
        description: Turno no encontrado
      403:
        description: Requiere rol de profesional
    """
    appointment = Appointment.query.get(appointment_id)

    if not appointment:
        return jsonify({'msg': 'Appointment not found'}), 404

    appointment.status = 'confirmed'
    db.session.commit()

    return jsonify(appointment_schema.dump(appointment)), 200


@blueprint.route('/calendar', methods=['GET'])
@jwt_required()
def get_calendar():
    """Get calendar view of appointments"""
    professional_id = request.args.get('professional_id', type=int)
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')

    if not all([professional_id, date_from, date_to]):
        return jsonify({'msg': 'Missing required parameters'}), 400

    try:
        start_date = datetime.fromisoformat(date_from)
        end_date = datetime.fromisoformat(date_to)
    except ValueError:
        return jsonify({'msg': 'Invalid date format'}), 400

    appointments = Appointment.query.filter(
        Appointment.professional_id == professional_id,
        Appointment.appointment_date >= start_date,
        Appointment.appointment_date <= end_date
    ).order_by(Appointment.appointment_date).all()

    return jsonify(appointments_schema.dump(appointments)), 200
