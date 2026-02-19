# -*- coding: utf-8 -*-
"""
Patient CRUD endpoints
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app.models.patient import Patient
from app.schemas.patient_schema import PatientSchema
from app.extensions import db
from app.utils.decorators import professional_required
from app.services.auth_service import AuthService
from app.utils.helpers import validate_required_fields, sanitize_search_input
from sqlalchemy.orm import subqueryload

blueprint = Blueprint('patients', __name__, url_prefix='/api/patients')

patient_schema = PatientSchema()
patients_schema = PatientSchema(many=True)


@blueprint.route('', methods=['GET'])
@jwt_required()
def list_patients():
    """List all patients
    ---
    tags:
      - Patients
    security:
      - Bearer: []
    parameters:
      - in: query
        name: search
        type: string
        description: Buscar por nombre, apellido o email
    responses:
      200:
        description: Lista de pacientes
        schema:
          type: array
          items:
            type: object
      401:
        description: No autenticado
    """
    search = request.args.get('search')

    query = Patient.query
    if search:
        # Sanitize search input to prevent SQL injection
        sanitized_search = sanitize_search_input(search)
        if sanitized_search:
            search_filter = f'%{sanitized_search}%'
            query = query.filter(
                db.or_(
                    Patient.first_name.ilike(search_filter),
                    Patient.last_name.ilike(search_filter),
                    Patient.email.ilike(search_filter)
                )
            )

    patients = query.all()
    return jsonify(patients_schema.dump(patients)), 200


@blueprint.route('/<int:patient_id>', methods=['GET'])
@jwt_required()
def get_patient(patient_id):
    """Get patient by ID
    ---
    tags:
      - Patients
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
        description: Paciente encontrado
      404:
        description: Paciente no encontrado
      401:
        description: No autenticado
    """
    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({'msg': 'Patient not found'}), 404

    return jsonify(patient_schema.dump(patient)), 200


@blueprint.route('', methods=['POST'])
@professional_required
def create_patient():
    """Create new patient
    ---
    tags:
      - Patients
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
          properties:
            email:
              type: string
            password:
              type: string
            first_name:
              type: string
            last_name:
              type: string
            date_of_birth:
              type: string
              format: date
            phone:
              type: string
            address:
              type: string
            emergency_contact:
              type: string
            emergency_phone:
              type: string
            blood_type:
              type: string
            allergies:
              type: string
            medical_history:
              type: string
    responses:
      201:
        description: Paciente creado exitosamente
      400:
        description: Datos inválidos o email duplicado
      403:
        description: Requiere rol de profesional
    """
    data = request.get_json() or {}

    # Validate required fields using helper
    required_fields = ['email', 'password', 'first_name', 'last_name']
    is_valid, missing_fields = validate_required_fields(data, required_fields)
    if not is_valid:
        return jsonify({
            'msg': 'Missing required fields',
            'missing_fields': missing_fields
        }), 400

    # Validate password strength
    try:
        AuthService.validate_password(data['password'])
    except ValueError as e:
        return jsonify({'msg': str(e)}), 400

    # Check if email already exists
    if Patient.query.filter_by(email=data['email']).first():
        return jsonify({'msg': 'Email already registered'}), 400

    # Parse date_of_birth if provided
    date_of_birth = None
    if data.get('date_of_birth'):
        try:
            if isinstance(data['date_of_birth'], str):
                date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
            else:
                date_of_birth = data['date_of_birth']
        except ValueError:
            return jsonify({'msg': 'Invalid date format. Use YYYY-MM-DD'}), 400

    # Create patient
    patient = Patient(
        email=data['email'],
        first_name=data['first_name'],
        last_name=data['last_name'],
        role='patient',
        date_of_birth=date_of_birth,
        phone=data.get('phone'),
        address=data.get('address'),
        emergency_contact=data.get('emergency_contact'),
        emergency_phone=data.get('emergency_phone'),
        blood_type=data.get('blood_type'),
        allergies=data.get('allergies'),
        medical_history=data.get('medical_history')
    )
    patient.set_password(data['password'])

    db.session.add(patient)
    db.session.commit()

    return jsonify(patient_schema.dump(patient)), 201


@blueprint.route('/<int:patient_id>', methods=['PUT'])
@jwt_required()
def update_patient(patient_id):
    """Update patient
    ---
    tags:
      - Patients
    security:
      - Bearer: []
    parameters:
      - in: path
        name: patient_id
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
            phone:
              type: string
            address:
              type: string
            emergency_contact:
              type: string
            emergency_phone:
              type: string
            blood_type:
              type: string
            allergies:
              type: string
            medical_history:
              type: string
            date_of_birth:
              type: string
              format: date
            password:
              type: string
    responses:
      200:
        description: Paciente actualizado
      404:
        description: Paciente no encontrado
      403:
        description: No autorizado
    """
    current_user_id = int(get_jwt_identity())
    patient = Patient.query.get(patient_id)

    if not patient:
        return jsonify({'msg': 'Patient not found'}), 404

    # Only allow updating own profile unless professional/admin
    if patient.id != current_user_id:
        from app.models.user import User
        current_user = User.query.get(current_user_id)
        if not current_user or current_user.role not in ['admin', 'professional']:
            return jsonify({'msg': 'Unauthorized'}), 403

    data = request.get_json() or {}

    # Update allowed fields
    updatable_fields = [
        'first_name', 'last_name', 'phone', 'address',
        'emergency_contact', 'emergency_phone', 'blood_type',
        'allergies', 'medical_history', 'date_of_birth'
    ]

    for field in updatable_fields:
        if field in data:
            setattr(patient, field, data[field])

    if 'password' in data:
        patient.set_password(data['password'])

    db.session.commit()

    return jsonify(patient_schema.dump(patient)), 200


@blueprint.route('/<int:patient_id>', methods=['DELETE'])
@professional_required
def delete_patient(patient_id):
    """Delete patient
    ---
    tags:
      - Patients
    security:
      - Bearer: []
    parameters:
      - in: path
        name: patient_id
        type: integer
        required: true
    responses:
      200:
        description: Paciente eliminado
      404:
        description: Paciente no encontrado
      403:
        description: Requiere rol de profesional
    """
    patient = Patient.query.get(patient_id)

    if not patient:
        return jsonify({'msg': 'Patient not found'}), 404

    db.session.delete(patient)
    db.session.commit()

    return jsonify({'msg': 'Patient deleted'}), 200


@blueprint.route('/<int:patient_id>/medical-history', methods=['GET'])
@jwt_required()
def get_patient_medical_history(patient_id):
    """Get patient's complete medical history
    ---
    tags:
      - Patients
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
        description: Historia clínica del paciente
        schema:
          type: array
          items:
            type: object
      404:
        description: Paciente no encontrado
    """
    patient = Patient.query.get(patient_id)

    if not patient:
        return jsonify({'msg': 'Patient not found'}), 404

    from app.schemas.medical_record_schema import MedicalRecordSchema
    from app.models.medical_record import MedicalRecord
    medical_records_schema = MedicalRecordSchema(many=True)

    # Get all medical records ordered by date
    records = patient.medical_records.options(subqueryload(MedicalRecord.files)).order_by(db.desc('record_date')).all()

    return jsonify(medical_records_schema.dump(records)), 200


@blueprint.route('/<int:patient_id>/appointments', methods=['GET'])
@jwt_required()
def get_patient_appointments(patient_id):
    """Get patient's appointments
    ---
    tags:
      - Patients
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
        description: Citas del paciente
        schema:
          type: array
          items:
            type: object
      404:
        description: Paciente no encontrado
    """
    patient = Patient.query.get(patient_id)

    if not patient:
        return jsonify({'msg': 'Patient not found'}), 404

    from app.models.appointment import Appointment
    from app.schemas.appointment_schema import AppointmentSchema
    appointments_schema = AppointmentSchema(many=True)

    appointments = Appointment.query.filter_by(patient_id=patient_id).order_by(
        Appointment.appointment_date.desc()
    ).all()

    return jsonify(appointments_schema.dump(appointments)), 200


@blueprint.route('/<int:patient_id>/medical-records', methods=['GET'])
@jwt_required()
def get_patient_medical_records(patient_id):
    """Get patient's medical records
    ---
    tags:
      - Patients
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
        description: Registros médicos del paciente
        schema:
          type: array
          items:
            type: object
      404:
        description: Paciente no encontrado
    """
    patient = Patient.query.get(patient_id)

    if not patient:
        return jsonify({'msg': 'Patient not found'}), 404

    from app.models.medical_record import MedicalRecord
    from app.schemas.medical_record_schema import MedicalRecordSchema
    medical_records_schema = MedicalRecordSchema(many=True)

    records = MedicalRecord.query.filter_by(patient_id=patient_id).options(subqueryload(MedicalRecord.files)).order_by(
        MedicalRecord.record_date.desc()
    ).all()

    return jsonify(medical_records_schema.dump(records)), 200


@blueprint.route('/<int:patient_id>/budgets', methods=['GET'])
@jwt_required()
def get_patient_budgets(patient_id):
    """Get patient's budgets
    ---
    tags:
      - Patients
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
        description: Presupuestos del paciente
        schema:
          type: array
          items:
            type: object
      404:
        description: Paciente no encontrado
    """
    patient = Patient.query.get(patient_id)

    if not patient:
        return jsonify({'msg': 'Patient not found'}), 404

    from app.models.budget import Budget
    from app.schemas.budget_schema import BudgetSchema
    budgets_schema = BudgetSchema(many=True)

    budgets = Budget.query.filter_by(patient_id=patient_id).order_by(
        Budget.created_at.desc()
    ).all()

    return jsonify(budgets_schema.dump(budgets)), 200

