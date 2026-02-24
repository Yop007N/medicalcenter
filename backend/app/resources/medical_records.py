# -*- coding: utf-8 -*-
"""
Medical Record CRUD endpoints
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.schemas.medical_record_schema import MedicalRecordSchema
from app.services.exceptions import ResourceNotFoundError, ValidationError
from app.services.medical_record_service import MedicalRecordService
from app.utils.decorators import professional_required

blueprint = Blueprint('medical_records', __name__, url_prefix='/api/medical-records')

medical_record_schema = MedicalRecordSchema()
medical_records_schema = MedicalRecordSchema(many=True)


@blueprint.route('', methods=['GET'])
@jwt_required()
def list_medical_records():
    """List medical records with optional filters.
    ---
    tags:
      - Medical Records
    security:
      - Bearer: []
    parameters:
      - in: query
        name: patient_id
        type: integer
        required: false
        description: Filter by patient ID
      - in: query
        name: professional_id
        type: integer
        required: false
        description: Filter by professional ID
    responses:
      200:
        description: Lista de historiales médicos
        schema:
          type: array
          items:
            type: object
            properties:
              id:
                type: integer
              patient_id:
                type: integer
              professional_id:
                type: integer
              record_date:
                type: string
                format: date-time
              chief_complaint:
                type: string
              diagnosis:
                type: string
      401:
        description: No autenticado
    """
    patient_id = request.args.get('patient_id', type=int)
    professional_id = request.args.get('professional_id', type=int)
    records = MedicalRecordService.list_medical_records(
        patient_id=patient_id,
        professional_id=professional_id,
    )
    return jsonify(medical_records_schema.dump(records)), 200


@blueprint.route('/<int:record_id>', methods=['GET'])
@jwt_required()
def get_medical_record(record_id):
    """Get medical record by ID.
    ---
    tags:
      - Medical Records
    security:
      - Bearer: []
    parameters:
      - in: path
        name: record_id
        type: integer
        required: true
        description: Medical record ID
    responses:
      200:
        description: Historial médico encontrado
        schema:
          type: object
          properties:
            id:
              type: integer
            patient_id:
              type: integer
            professional_id:
              type: integer
            chief_complaint:
              type: string
            diagnosis:
              type: string
            treatment:
              type: string
      404:
        description: Historial no encontrado
      401:
        description: No autenticado
    """
    try:
        record = MedicalRecordService.get_medical_record(record_id)
        return jsonify(medical_record_schema.dump(record)), 200
    except ResourceNotFoundError as exc:
        return jsonify({'msg': exc.message}), 404


@blueprint.route('', methods=['POST'])
@professional_required
def create_medical_record():
    """Create new medical record.
    ---
    tags:
      - Medical Records
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
              example: 1
            appointment_id:
              type: integer
            chief_complaint:
              type: string
              example: "Dolor de cabeza persistente"
            symptoms:
              type: string
            diagnosis:
              type: string
            treatment:
              type: string
            prescriptions:
              type: string
            notes:
              type: string
            blood_pressure:
              type: string
              example: "120/80"
            heart_rate:
              type: integer
            temperature:
              type: number
            weight:
              type: number
            height:
              type: number
    responses:
      201:
        description: Historial médico creado
      400:
        description: Campos requeridos faltantes
      401:
        description: No autenticado (requiere rol professional)
    """
    current_user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    try:
        record = MedicalRecordService.create_medical_record(data, current_user_id)
        return jsonify(medical_record_schema.dump(record)), 201
    except ValidationError as exc:
        return jsonify({'msg': exc.message}), 400


@blueprint.route('/<int:record_id>', methods=['PUT'])
@professional_required
def update_medical_record(record_id):
    """Update medical record.
    ---
    tags:
      - Medical Records
    security:
      - Bearer: []
    parameters:
      - in: path
        name: record_id
        type: integer
        required: true
      - in: body
        name: body
        schema:
          type: object
          properties:
            chief_complaint:
              type: string
            diagnosis:
              type: string
            treatment:
              type: string
            prescriptions:
              type: string
            notes:
              type: string
    responses:
      200:
        description: Historial actualizado
      404:
        description: Historial no encontrado
      401:
        description: No autenticado
    """
    data = request.get_json() or {}
    try:
        record = MedicalRecordService.update_medical_record(record_id, data)
        return jsonify(medical_record_schema.dump(record)), 200
    except ResourceNotFoundError as exc:
        return jsonify({'msg': exc.message}), 404


@blueprint.route('/<int:record_id>', methods=['DELETE'])
@professional_required
def delete_medical_record(record_id):
    """Delete medical record.
    ---
    tags:
      - Medical Records
    security:
      - Bearer: []
    parameters:
      - in: path
        name: record_id
        type: integer
        required: true
        description: Medical record ID to delete
    responses:
      200:
        description: Historial eliminado
      404:
        description: Historial no encontrado
      401:
        description: No autenticado (requiere rol professional)
    """
    try:
        MedicalRecordService.delete_medical_record(record_id)
        return jsonify({'msg': 'Medical record deleted'}), 200
    except ResourceNotFoundError as exc:
        return jsonify({'msg': exc.message}), 404
