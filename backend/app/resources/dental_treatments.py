# -*- coding: utf-8 -*-
"""
Dental Treatment CRUD endpoints
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app.models.odontogram import DentalTreatment
from app.models.patient import Patient
from app.models.professional import Professional
from app.schemas.odontogram_schema import DentalTreatmentSchema
from app.extensions import db
from app.utils.helpers import get_pagination_params, validate_required_fields

blueprint = Blueprint('dental_treatments', __name__, url_prefix='/api/dental-treatments')

treatment_schema = DentalTreatmentSchema()
treatments_schema = DentalTreatmentSchema(many=True)


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

    # Filters
    patient_id = request.args.get('patient_id', type=int)
    professional_id = request.args.get('professional_id', type=int)
    treatment_type = request.args.get('treatment_type')
    status = request.args.get('status')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')

    query = DentalTreatment.query

    if patient_id:
        query = query.filter_by(patient_id=patient_id)
    if professional_id:
        query = query.filter_by(professional_id=professional_id)
    if treatment_type:
        query = query.filter_by(treatment_type=treatment_type)
    if status:
        query = query.filter_by(status=status)
    if date_from:
        query = query.filter(DentalTreatment.treatment_date >= datetime.fromisoformat(date_from).date())
    if date_to:
        query = query.filter(DentalTreatment.treatment_date <= datetime.fromisoformat(date_to).date())

    pagination = query.order_by(DentalTreatment.treatment_date.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

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
    treatment = DentalTreatment.query.get(treatment_id)

    if not treatment:
        return jsonify({'msg': 'Treatment not found'}), 404

    return jsonify(treatment_schema.dump(treatment)), 200


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

    # Validar campos requeridos
    required_fields = ['patient_id', 'treatment_type', 'treatment_date']
    is_valid, missing_fields = validate_required_fields(data, required_fields)
    if not is_valid:
        return jsonify({
            'msg': 'Missing required fields',
            'missing_fields': missing_fields
        }), 400

    # Verificar que el paciente existe
    patient = Patient.query.get(data['patient_id'])
    if not patient:
        return jsonify({'msg': 'Patient not found'}), 404

    # Parse date
    try:
        treatment_date = datetime.fromisoformat(data['treatment_date']).date()
    except ValueError:
        return jsonify({'msg': 'Invalid date format'}), 400

    # Determine professional_id
    current_user_id = int(get_jwt_identity())
    professional_id = data.get('professional_id')

    if professional_id:
        # Verify the provided professional exists
        professional = Professional.query.get(professional_id)
        if not professional:
            return jsonify({'msg': 'Professional not found'}), 404
    else:
        # Check if current user is a professional
        professional = Professional.query.get(current_user_id)
        if professional:
            professional_id = current_user_id
        else:
            # Current user is not a professional (e.g., admin), get first available professional
            professional = Professional.query.first()
            if not professional:
                return jsonify({'msg': 'No professional available. Please specify professional_id'}), 400
            professional_id = professional.id

    # Crear tratamiento
    treatment = DentalTreatment(
        patient_id=data['patient_id'],
        professional_id=professional_id,
        medical_record_id=data.get('medical_record_id'),
        appointment_id=data.get('appointment_id'),
        treatment_code=data.get('treatment_code'),
        treatment_type=data['treatment_type'],
        affected_teeth=data.get('affected_teeth', []),
        description=data.get('description'),
        materials_used=data.get('materials_used', []),
        technique=data.get('technique'),
        anesthesia_type=data.get('anesthesia_type'),
        anesthesia_details=data.get('anesthesia_details'),
        treatment_date=treatment_date,
        duration_minutes=data.get('duration_minutes'),
        sessions_required=data.get('sessions_required', 1),
        session_number=data.get('session_number', 1),
        status=data.get('status', 'planned'),
        estimated_cost=data.get('estimated_cost'),
        pre_treatment_notes=data.get('pre_treatment_notes'),
        care_instructions=data.get('care_instructions')
    )

    db.session.add(treatment)
    db.session.commit()

    return jsonify(treatment_schema.dump(treatment)), 201


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
    treatment = DentalTreatment.query.get(treatment_id)

    if not treatment:
        return jsonify({'msg': 'Treatment not found'}), 404

    data = request.get_json() or {}

    # Actualizar campos permitidos
    if 'status' in data:
        treatment.status = data['status']
    if 'description' in data:
        treatment.description = data['description']
    if 'materials_used' in data:
        treatment.materials_used = data['materials_used']
    if 'technique' in data:
        treatment.technique = data['technique']
    if 'duration_minutes' in data:
        treatment.duration_minutes = data['duration_minutes']
    if 'post_treatment_notes' in data:
        treatment.post_treatment_notes = data['post_treatment_notes']
    if 'complications' in data:
        treatment.complications = data['complications']
    if 'final_cost' in data:
        treatment.final_cost = data['final_cost']
    if 'insurance_covered' in data:
        treatment.insurance_covered = data['insurance_covered']
    if 'patient_payment' in data:
        treatment.patient_payment = data['patient_payment']
    if 'care_instructions' in data:
        treatment.care_instructions = data['care_instructions']
    if 'medications_prescribed' in data:
        treatment.medications_prescribed = data['medications_prescribed']
    if 'patient_satisfaction' in data:
        treatment.patient_satisfaction = data['patient_satisfaction']
    if 'treatment_success' in data:
        treatment.treatment_success = data['treatment_success']
    if 'requires_followup' in data:
        treatment.requires_followup = data['requires_followup']
    if 'followup_notes' in data:
        treatment.followup_notes = data['followup_notes']

    # Update dates
    if 'completion_date' in data:
        try:
            treatment.completion_date = datetime.fromisoformat(data['completion_date']).date()
        except ValueError:
            return jsonify({'msg': 'Invalid completion_date format'}), 400

    if 'next_appointment' in data:
        try:
            treatment.next_appointment = datetime.fromisoformat(data['next_appointment']).date()
        except ValueError:
            return jsonify({'msg': 'Invalid next_appointment format'}), 400

    if 'followup_date' in data:
        try:
            treatment.followup_date = datetime.fromisoformat(data['followup_date']).date()
        except ValueError:
            return jsonify({'msg': 'Invalid followup_date format'}), 400

    db.session.commit()

    return jsonify(treatment_schema.dump(treatment)), 200


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
    treatment = DentalTreatment.query.get(treatment_id)

    if not treatment:
        return jsonify({'msg': 'Treatment not found'}), 404

    db.session.delete(treatment)
    db.session.commit()

    return jsonify({'msg': 'Treatment deleted successfully'}), 200


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
    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({'msg': 'Patient not found'}), 404

    page, per_page = get_pagination_params(request)
    status = request.args.get('status')

    query = DentalTreatment.query.filter_by(patient_id=patient_id)

    if status:
        query = query.filter_by(status=status)

    query = query.order_by(DentalTreatment.treatment_date.desc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'treatments': treatments_schema.dump(pagination.items),
        'total': pagination.total,
        'page': pagination.page,
        'pages': pagination.pages
    }), 200


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
    treatment = DentalTreatment.query.get(treatment_id)

    if not treatment:
        return jsonify({'msg': 'Treatment not found'}), 404

    data = request.get_json() or {}

    treatment.status = 'completed'
    treatment.completion_date = datetime.utcnow().date()

    if 'completion_notes' in data:
        treatment.post_treatment_notes = data['completion_notes']
    if 'final_cost' in data:
        treatment.final_cost = data['final_cost']
    if 'treatment_success' in data:
        treatment.treatment_success = data['treatment_success']

    db.session.commit()

    return jsonify({
        'msg': 'Treatment completed successfully',
        'treatment': treatment_schema.dump(treatment)
    }), 200


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
    treatment = DentalTreatment.query.get(treatment_id)

    if not treatment:
        return jsonify({'msg': 'Treatment not found'}), 404

    data = request.get_json() or {}

    treatment.status = 'cancelled'
    if 'cancellation_reason' in data:
        treatment.post_treatment_notes = data['cancellation_reason']

    db.session.commit()

    return jsonify(treatment_schema.dump(treatment)), 200
