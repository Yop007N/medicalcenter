# -*- coding: utf-8 -*-
"""File upload/download endpoints."""

from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.resources.domain_errors import domain_error_response
from app.services.exceptions import ResourceNotFoundError, ValidationError
from app.services.file_service import FileService

blueprint = Blueprint('files', __name__, url_prefix='/api/files')


def serialize_file(file_record):
    """Serialize file record with frontend-compatible aliases."""
    patient_id = None
    patient_payload = None
    if file_record.medical_record:
        patient_id = file_record.medical_record.patient_id
        patient = getattr(file_record.medical_record, 'patient', None)
        if patient:
            patient_payload = {
                'id': patient.id,
                'first_name': patient.first_name,
                'last_name': patient.last_name,
            }

    created_at = file_record.created_at.isoformat() if file_record.created_at else None
    file_type = file_record.file_type or 'other'

    return {
        'id': file_record.id,
        'patient_id': patient_id,
        'uploaded_by': file_record.uploaded_by,
        'filename': file_record.filename,
        'original_filename': file_record.filename,
        'file_type': file_type,
        'category': file_type,
        'file_size': file_record.file_size,
        'description': file_record.description,
        'medical_record_id': file_record.medical_record_id,
        'is_private': False,
        'created_at': created_at,
        'upload_date': created_at,
        'patient': patient_payload,
    }


@blueprint.route('', methods=['GET'])
@jwt_required()
def list_files():
    """List file metadata with optional patient filter."""
    patient_id = request.args.get('patient_id', type=int)
    files = FileService.list_files(patient_id=patient_id)
    return jsonify([serialize_file(file_record) for file_record in files]), 200


@blueprint.route('/upload', methods=['POST'])
@jwt_required()
def upload_file():
    """Upload medical file.
    ---
    tags:
      - Files
    security:
      - Bearer: []
    consumes:
      - multipart/form-data
    parameters:
      - in: formData
        name: file
        type: file
        required: true
        description: Archivo médico a subir (pdf, png, jpg, jpeg, gif, dcm, doc, docx)
      - in: formData
        name: medical_record_id
        type: integer
        required: true
        description: ID del historial médico
      - in: formData
        name: file_type
        type: string
        description: Tipo de archivo (xray, lab, prescription, other)
      - in: formData
        name: description
        type: string
        description: Descripción del archivo
    responses:
      201:
        description: Archivo subido exitosamente
        schema:
          type: object
          properties:
            id:
              type: integer
            filename:
              type: string
            file_type:
              type: string
            file_size:
              type: integer
      400:
        description: Archivo no proporcionado o inválido
      404:
        description: Historial médico no encontrado
      401:
        description: No autenticado
    """
    current_user_id = int(get_jwt_identity())
    file_obj = request.files.get('file')
    file_type = request.form.get('file_type') or request.form.get('category') or 'other'
    description = request.form.get('description', '')
    medical_record_id = request.form.get('medical_record_id')
    patient_id = request.form.get('patient_id')

    try:
        file_record = FileService.create_file_record(
            file=file_obj,
            uploaded_by=current_user_id,
            medical_record_id=medical_record_id,
            patient_id=patient_id,
            file_type=file_type,
            description=description,
        )
    except (ValidationError, ResourceNotFoundError) as exc:
        return domain_error_response(exc)

    return jsonify(serialize_file(file_record)), 201


@blueprint.route('/<int:file_id>', methods=['GET'])
@jwt_required()
def get_file(file_id):
    """Get file metadata.
    ---
    tags:
      - Files
    security:
      - Bearer: []
    parameters:
      - in: path
        name: file_id
        type: integer
        required: true
        description: File ID
    responses:
      200:
        description: Metadatos del archivo
        schema:
          type: object
          properties:
            id:
              type: integer
            filename:
              type: string
            file_type:
              type: string
            file_size:
              type: integer
            description:
              type: string
      404:
        description: Archivo no encontrado
      401:
        description: No autenticado
    """
    try:
        file_record = FileService.get_file(file_id)
        return jsonify(serialize_file(file_record)), 200
    except ResourceNotFoundError as exc:
        return domain_error_response(exc)


@blueprint.route('/<int:file_id>/download', methods=['GET'])
@jwt_required()
def download_file(file_id):
    """Download file.
    ---
    tags:
      - Files
    security:
      - Bearer: []
    parameters:
      - in: path
        name: file_id
        type: integer
        required: true
        description: File ID to download
    produces:
      - application/octet-stream
    responses:
      200:
        description: Archivo descargado
        schema:
          type: file
      404:
        description: Archivo no encontrado
      401:
        description: No autenticado
    """
    try:
        file_record, resolved_path = FileService.download_file(file_id)
        return send_file(
            resolved_path,
            as_attachment=True,
            download_name=file_record.filename,
            mimetype=file_record.mime_type,
        )
    except ResourceNotFoundError as exc:
        return domain_error_response(exc)


@blueprint.route('/<int:file_id>', methods=['DELETE'])
@jwt_required()
def delete_file(file_id):
    """Delete file.
    ---
    tags:
      - Files
    security:
      - Bearer: []
    parameters:
      - in: path
        name: file_id
        type: integer
        required: true
        description: File ID to delete
    responses:
      200:
        description: Archivo eliminado
      404:
        description: Archivo no encontrado
      401:
        description: No autenticado
    """
    try:
        FileService.delete_file(file_id)
        return jsonify({'msg': 'File deleted'}), 200
    except ResourceNotFoundError as exc:
        return domain_error_response(exc)
