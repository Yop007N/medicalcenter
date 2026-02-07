# -*- coding: utf-8 -*-
"""
Medical Record CRUD endpoints
"""

from app.extensions import db
from app.models.medical_record import MedicalRecord
from app.schemas.medical_record_schema import MedicalRecordSchema
from app.utils.decorators import professional_required
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy.orm import subqueryload

blueprint = Blueprint(
    "medical_records", __name__, url_prefix="/api/medical-records"
)

medical_record_schema = MedicalRecordSchema()
medical_records_schema = MedicalRecordSchema(many=True)


@blueprint.route("", methods=["GET"])
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
    patient_id = request.args.get("patient_id", type=int)
    professional_id = request.args.get("professional_id", type=int)

    query = MedicalRecord.query

    if patient_id:
        query = query.filter_by(patient_id=patient_id)
    if professional_id:
        query = query.filter_by(professional_id=professional_id)

    # Eagerly load files to prevent N+1 queries
    records = (
        query.options(subqueryload(MedicalRecord.files))
        .order_by(db.desc(MedicalRecord.record_date))
        .all()
    )
    return jsonify(medical_records_schema.dump(records)), 200


@blueprint.route("/<int:record_id>", methods=["GET"])
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
    record = MedicalRecord.query.get(record_id)
    if not record:
        return jsonify({"msg": "Medical record not found"}), 404

    return jsonify(medical_record_schema.dump(record)), 200


@blueprint.route("", methods=["POST"])
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

    # Validate required fields
    required_fields = ["patient_id"]
    if not all(field in data for field in required_fields):
        return jsonify({"msg": "Missing required fields"}), 400

    # Create medical record
    record = MedicalRecord(
        patient_id=data["patient_id"],
        professional_id=current_user_id,
        appointment_id=data.get("appointment_id"),
        chief_complaint=data.get("chief_complaint"),
        symptoms=data.get("symptoms"),
        diagnosis=data.get("diagnosis"),
        treatment=data.get("treatment"),
        prescriptions=data.get("prescriptions"),
        notes=data.get("notes"),
        blood_pressure=data.get("blood_pressure"),
        heart_rate=data.get("heart_rate"),
        temperature=data.get("temperature"),
        weight=data.get("weight"),
        height=data.get("height"),
    )

    db.session.add(record)
    db.session.commit()

    return jsonify(medical_record_schema.dump(record)), 201


@blueprint.route("/<int:record_id>", methods=["PUT"])
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
    record = MedicalRecord.query.get(record_id)

    if not record:
        return jsonify({"msg": "Medical record not found"}), 404

    data = request.get_json() or {}

    # Update allowed fields
    updatable_fields = [
        "chief_complaint",
        "symptoms",
        "diagnosis",
        "treatment",
        "prescriptions",
        "notes",
        "blood_pressure",
        "heart_rate",
        "temperature",
        "weight",
        "height",
    ]

    for field in updatable_fields:
        if field in data:
            setattr(record, field, data[field])

    db.session.commit()

    return jsonify(medical_record_schema.dump(record)), 200


@blueprint.route("/<int:record_id>", methods=["DELETE"])
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
    record = MedicalRecord.query.get(record_id)

    if not record:
        return jsonify({"msg": "Medical record not found"}), 404

    db.session.delete(record)
    db.session.commit()

    return jsonify({"msg": "Medical record deleted"}), 200
