# -*- coding: utf-8 -*-
"""
Patient CRUD endpoints
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.resources.domain_errors import domain_error_response
from app.schemas.patient_schema import PatientSchema
from app.services.exceptions import AccessDeniedError, ResourceNotFoundError, ValidationError
from app.services.patient_service import PatientService
from app.utils.decorators import professional_required

blueprint = Blueprint('patients', __name__, url_prefix='/api/patients')

patient_schema = PatientSchema()
patients_schema = PatientSchema(many=True)


def serialize_patient(patient):
    """Serialize patient payload with frontend-friendly defaults."""
    payload = patient_schema.dump(patient)
    payload.setdefault('is_active', True)
    payload.setdefault('notes', None)
    payload.setdefault('insurance_provider', None)
    payload.setdefault('insurance_number', None)
    payload.setdefault('document_type', None)
    payload.setdefault('document_number', None)
    payload.setdefault('gender', None)
    return payload


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
      - in: query
        name: specialty_key
        type: string
        description: Filtro opcional por modulo/especialidad para scope profesional
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
    current_user_id = int(get_jwt_identity())
    search = request.args.get('search') or request.args.get('q')
    specialty_key = request.args.get('specialty_key')
    try:
        patients = PatientService.list_patients(
            current_user_id=current_user_id,
            search=search,
            specialty_key=specialty_key,
        )
        return jsonify([serialize_patient(patient) for patient in patients]), 200
    except AccessDeniedError as exc:
        return domain_error_response(exc)


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
      403:
        description: No autorizado
    """
    current_user_id = int(get_jwt_identity())
    try:
        patient = PatientService.get_patient(patient_id=patient_id, current_user_id=current_user_id)
        return jsonify(serialize_patient(patient)), 200
    except (ResourceNotFoundError, AccessDeniedError) as exc:
        return domain_error_response(exc)


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
            professional_id:
              type: integer
              description: Opcional (admin), asigna paciente al profesional indicado.
            specialty_key:
              type: string
              description: Opcional, resuelve asignacion inicial automatica al modulo/especialidad.
    responses:
      201:
        description: Paciente creado exitosamente
      400:
        description: Datos inválidos o email duplicado
      403:
        description: Requiere rol de profesional
    """
    data = request.get_json() or {}
    current_user_id = int(get_jwt_identity())
    try:
        patient = PatientService.create_patient(data, current_user_id=current_user_id)
        return jsonify(serialize_patient(patient)), 201
    except ValidationError as exc:
        return domain_error_response(exc)


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
    data = request.get_json() or {}
    try:
        patient = PatientService.update_patient(
            patient_id=patient_id,
            current_user_id=current_user_id,
            data=data,
        )
        return jsonify(serialize_patient(patient)), 200
    except (ResourceNotFoundError, AccessDeniedError, ValidationError) as exc:
        return domain_error_response(exc)


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
    try:
        PatientService.delete_patient(
            patient_id=patient_id,
            current_user_id=int(get_jwt_identity()),
        )
        return jsonify({'msg': 'Patient deleted'}), 200
    except (ResourceNotFoundError, AccessDeniedError) as exc:
        return domain_error_response(exc)


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
      403:
        description: No autorizado
    """
    from app.schemas.medical_record_schema import MedicalRecordSchema
    medical_records_schema = MedicalRecordSchema(many=True)
    current_user_id = int(get_jwt_identity())
    try:
        records = PatientService.get_patient_medical_history(patient_id, current_user_id)
        return jsonify(medical_records_schema.dump(records)), 200
    except (ResourceNotFoundError, AccessDeniedError) as exc:
        return domain_error_response(exc)


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
      403:
        description: No autorizado
    """
    from app.schemas.appointment_schema import AppointmentSchema
    appointments_schema = AppointmentSchema(many=True)
    current_user_id = int(get_jwt_identity())
    try:
        appointments = PatientService.get_patient_appointments(patient_id, current_user_id)
        return jsonify(appointments_schema.dump(appointments)), 200
    except (ResourceNotFoundError, AccessDeniedError) as exc:
        return domain_error_response(exc)


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
      403:
        description: No autorizado
    """
    from app.schemas.medical_record_schema import MedicalRecordSchema
    medical_records_schema = MedicalRecordSchema(many=True)
    current_user_id = int(get_jwt_identity())
    try:
        records = PatientService.get_patient_medical_records(patient_id, current_user_id)
        return jsonify(medical_records_schema.dump(records)), 200
    except (ResourceNotFoundError, AccessDeniedError) as exc:
        return domain_error_response(exc)


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
      403:
        description: No autorizado
    """
    from app.schemas.budget_schema import BudgetSchema
    budgets_schema = BudgetSchema(many=True)
    current_user_id = int(get_jwt_identity())
    try:
        budgets = PatientService.get_patient_budgets(patient_id, current_user_id)
        return jsonify(budgets_schema.dump(budgets)), 200
    except (ResourceNotFoundError, AccessDeniedError) as exc:
        return domain_error_response(exc)


@blueprint.route('/<int:patient_id>/odontogram', methods=['GET'])
@jwt_required()
def get_patient_odontogram(patient_id):
    """Get patient's active odontogram
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
        description: Odontograma activo del paciente
      404:
        description: Odontograma no encontrado
      403:
        description: No autorizado
    """
    from app.schemas.odontogram_schema import OdontogramSchema, ToothSchema

    odontogram_schema = OdontogramSchema()
    tooth_schema = ToothSchema(many=True)
    current_user_id = int(get_jwt_identity())
    try:
        odontogram = PatientService.get_patient_odontogram(patient_id, current_user_id)
        payload = odontogram_schema.dump(odontogram)
        payload['teeth'] = tooth_schema.dump(
            odontogram.teeth.order_by('tooth_number').all()
        )
        return jsonify(payload), 200
    except (ResourceNotFoundError, AccessDeniedError) as exc:
        return domain_error_response(exc)
