# -*- coding: utf-8 -*-
"""
File upload/download endpoints
"""

import os
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app.models.file import File
from app.models.medical_record import MedicalRecord
from app.models.user import User
from app.extensions import db
from app.utils.helpers import generate_unique_filename

blueprint = Blueprint('files', __name__, url_prefix='/api/files')

ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'gif', 'dcm', 'doc', 'docx'}
UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'storage/files')


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def check_file_access(file_record, current_user_id):
    """
    Check if user has access to file
    Returns True if allowed, False otherwise
    """
    user = User.query.get(current_user_id)
    if not user:
        return False

    if user.role in ['admin', 'professional']:
        return True

    # Check if user is the patient owning the record
    medical_record = MedicalRecord.query.get(file_record.medical_record_id)
    if medical_record and medical_record.patient_id == current_user_id:
        return True

    return False


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

    # Check if file is in request
    if 'file' not in request.files:
        return jsonify({'msg': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'msg': 'No file selected'}), 400

    if not allowed_file(file.filename):
        return jsonify({'msg': 'File type not allowed'}), 400

    # Get additional data
    medical_record_id = request.form.get('medical_record_id', type=int)
    file_type = request.form.get('file_type', 'other')
    description = request.form.get('description', '')

    if not medical_record_id:
        return jsonify({'msg': 'medical_record_id is required'}), 400

    # Verify medical record exists
    medical_record = MedicalRecord.query.get(medical_record_id)
    if not medical_record:
        return jsonify({'msg': 'Medical record not found'}), 404

    # Check permissions for upload
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'msg': 'User not found'}), 404

    if user.role == 'patient' and medical_record.patient_id != current_user_id:
        return jsonify({'msg': 'Unauthorized access'}), 403

    # Generate unique filename
    original_filename = secure_filename(file.filename)
    unique_filename = generate_unique_filename(original_filename)

    # Ensure upload directory exists
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    # Save file
    file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
    file.save(file_path)

    # Get file size
    file_size = os.path.getsize(file_path)

    # Create file record
    file_record = File(
        medical_record_id=medical_record_id,
        filename=original_filename,
        file_type=file_type,
        mime_type=file.content_type,
        file_size=file_size,
        storage_type='local',
        file_path=file_path,
        description=description,
        uploaded_by=current_user_id
    )

    db.session.add(file_record)
    db.session.commit()

    return jsonify({
        'id': file_record.id,
        'filename': file_record.filename,
        'file_type': file_record.file_type,
        'file_size': file_record.file_size,
        'created_at': file_record.created_at.isoformat()
    }), 201


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
      403:
        description: Acceso no autorizado
    """
    file_record = File.query.get(file_id)

    if not file_record:
        return jsonify({'msg': 'File not found'}), 404

    current_user_id = int(get_jwt_identity())
    if not check_file_access(file_record, current_user_id):
        return jsonify({'msg': 'Unauthorized access'}), 403

    return jsonify({
        'id': file_record.id,
        'filename': file_record.filename,
        'file_type': file_record.file_type,
        'file_size': file_record.file_size,
        'description': file_record.description,
        'created_at': file_record.created_at.isoformat()
    }), 200


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
      403:
        description: Acceso no autorizado
    """
    file_record = File.query.get(file_id)

    if not file_record:
        return jsonify({'msg': 'File not found'}), 404

    current_user_id = int(get_jwt_identity())
    if not check_file_access(file_record, current_user_id):
        return jsonify({'msg': 'Unauthorized access'}), 403

    if not os.path.exists(file_record.file_path):
        return jsonify({'msg': 'File not found on disk'}), 404

    return send_file(
        file_record.file_path,
        as_attachment=True,
        download_name=file_record.filename,
        mimetype=file_record.mime_type
    )


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
      403:
        description: Acceso no autorizado
    """
    file_record = File.query.get(file_id)

    if not file_record:
        return jsonify({'msg': 'File not found'}), 404

    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'msg': 'User not found'}), 404

    # Only admin and professional can delete files
    if user.role not in ['admin', 'professional']:
        return jsonify({'msg': 'Unauthorized access'}), 403

    # Delete physical file
    if os.path.exists(file_record.file_path):
        os.remove(file_record.file_path)

    # Delete database record
    db.session.delete(file_record)
    db.session.commit()

    return jsonify({'msg': 'File deleted'}), 200
