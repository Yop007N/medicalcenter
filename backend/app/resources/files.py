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

ALLOWED_EXTENSIONS = {
    'pdf', 'png', 'jpg', 'jpeg', 'gif', 'dcm', 'doc', 'docx'
}
UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'storage/files')
BACKEND_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..', '..')
)


def allowed_file(filename):
    """Check if file extension is allowed"""
    return ('.' in filename and
            filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS)


def resolve_upload_dir():
    """Resolve upload directory relative to backend root."""
    if os.path.isabs(UPLOAD_FOLDER):
        return UPLOAD_FOLDER
    return os.path.abspath(os.path.join(BACKEND_ROOT, UPLOAD_FOLDER))


def resolve_file_path(file_path):
    """Resolve legacy relative file paths to absolute paths."""
    if not file_path:
        return file_path
    if os.path.isabs(file_path):
        return file_path

    backend_candidate = os.path.abspath(os.path.join(BACKEND_ROOT, file_path))
    if os.path.exists(backend_candidate):
        return backend_candidate

    project_candidate = os.path.abspath(
        os.path.join(BACKEND_ROOT, '..', file_path)
    )
    if os.path.exists(project_candidate):
        return project_candidate

    return backend_candidate


def serialize_file(file_record):
    """Serialize file record with frontend-compatible aliases."""
    patient_id = None
    if file_record.medical_record:
        patient_id = file_record.medical_record.patient_id

    created_at = (file_record.created_at.isoformat()
                  if file_record.created_at else None)
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
        'upload_date': created_at
    }


def _get_current_user():
    """Get the current authenticated user."""
    identity = get_jwt_identity()
    try:
        user_id = int(identity)
    except (TypeError, ValueError):
        return None
    return User.query.get(user_id)


def _can_access_file(file_record, user):
    """
    Check if user has permission to access file.
    - Admin/Professional: Can access all files.
    - Patient: Can only access files linked to their medical record.
    """
    if not user:
        return False

    if user.role in ['admin', 'professional']:
        return True

    if user.role == 'patient':
        # Check if file belongs to patient's medical record
        if (file_record.medical_record and
                file_record.medical_record.patient_id == user.id):
            return True

    return False


@blueprint.route('', methods=['GET'])
@jwt_required()
def list_files():
    """List file metadata with optional patient filter."""
    patient_id = request.args.get('patient_id', type=int)

    query = File.query
    if patient_id:
        query = query.join(MedicalRecord).filter(MedicalRecord.patient_id == patient_id)

    files = query.order_by(File.created_at.desc()).all()
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
    # Accept frontend alias "category" as file_type.
    file_type = (request.form.get('file_type') or
                 request.form.get('category') or 'other')
    description = request.form.get('description', '')
    patient_id = request.form.get('patient_id', type=int)

    if not medical_record_id:
        if patient_id:
            latest_record = MedicalRecord.query.filter_by(
                patient_id=patient_id
            ).order_by(MedicalRecord.created_at.desc()).first()
            if latest_record:
                medical_record_id = latest_record.id
        if not medical_record_id:
            return jsonify({'msg': 'medical_record_id is required'}), 400

    # Verify medical record exists
    medical_record = MedicalRecord.query.get(medical_record_id)
    if not medical_record:
        return jsonify({'msg': 'Medical record not found'}), 404

    # Generate unique filename
    original_filename = secure_filename(file.filename)
    unique_filename = generate_unique_filename(original_filename)

    # Ensure upload directory exists and normalize to absolute path so
    # downstream send_file/delete calls resolve consistently.
    upload_dir = resolve_upload_dir()
    os.makedirs(upload_dir, exist_ok=True)

    # Save file
    file_path = os.path.join(upload_dir, unique_filename)
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
      403:
        description: Acceso denegado
      404:
        description: Archivo no encontrado
      401:
        description: No autenticado
    """
    file_record = File.query.get(file_id)

    if not file_record:
        return jsonify({'msg': 'File not found'}), 404

    current_user = _get_current_user()
    if not _can_access_file(file_record, current_user):
        return jsonify({'msg': 'Access denied'}), 403

    return jsonify(serialize_file(file_record)), 200


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
      403:
        description: Acceso denegado
      404:
        description: Archivo no encontrado
      401:
        description: No autenticado
    """
    file_record = File.query.get(file_id)

    if not file_record:
        return jsonify({'msg': 'File not found'}), 404

    current_user = _get_current_user()
    if not _can_access_file(file_record, current_user):
        return jsonify({'msg': 'Access denied'}), 403

    resolved_path = resolve_file_path(file_record.file_path)
    if not os.path.exists(resolved_path):
        return jsonify({'msg': 'File not found on disk'}), 404

    return send_file(
        resolved_path,
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
      403:
        description: Acceso denegado
      404:
        description: Archivo no encontrado
      401:
        description: No autenticado
    """
    file_record = File.query.get(file_id)

    if not file_record:
        return jsonify({'msg': 'File not found'}), 404

    current_user = _get_current_user()
    if not _can_access_file(file_record, current_user):
        return jsonify({'msg': 'Access denied'}), 403

    # Delete physical file
    resolved_path = resolve_file_path(file_record.file_path)
    if os.path.exists(resolved_path):
        os.remove(resolved_path)

    # Delete database record
    db.session.delete(file_record)
    db.session.commit()

    return jsonify({'msg': 'File deleted'}), 200
