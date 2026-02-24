# -*- coding: utf-8 -*-
"""
File Service - Business logic for file management (upload/download)
"""

import hashlib
import os
from datetime import datetime
from pathlib import Path

from werkzeug.utils import secure_filename

from app.extensions import db
from app.models.file import File
from app.models.medical_record import MedicalRecord
from app.services.exceptions import ResourceNotFoundError, ValidationError


class FileService:
    """File management business logic"""

    ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'gif', 'dcm', 'doc', 'docx'}
    STORAGE_BASE = os.getenv('UPLOAD_FOLDER', 'storage/files')
    BACKEND_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

    @staticmethod
    def allowed_file(filename):
        """Check if file extension is allowed"""
        return (
            bool(filename)
            and '.' in filename
            and filename.rsplit('.', 1)[1].lower() in FileService.ALLOWED_EXTENSIONS
        )

    @staticmethod
    def generate_file_hash(file_content):
        """Generate SHA256 hash of file content"""
        return hashlib.sha256(file_content).hexdigest()

    @staticmethod
    def get_patient_storage_path(patient_id, file_type='general'):
        """
        Get storage path organized by patient and file type

        Structure: storage/files/patient_{id}/{file_type}/
        """
        base_path = Path(FileService.STORAGE_BASE)
        patient_folder = f"patient_{patient_id}"
        type_folder = file_type or 'general'

        storage_path = base_path / patient_folder / type_folder
        storage_path.mkdir(parents=True, exist_ok=True)

        return str(storage_path)

    @staticmethod
    def generate_unique_filename(original_filename):
        """Generate unique filename with timestamp"""
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S_%f')
        name, ext = os.path.splitext(secure_filename(original_filename) or 'file')
        return f"{name}_{timestamp}{ext}"

    @classmethod
    def resolve_upload_dir(cls):
        """Resolve upload directory to an absolute path."""
        if os.path.isabs(cls.STORAGE_BASE):
            return cls.STORAGE_BASE
        return os.path.abspath(os.path.join(cls.BACKEND_ROOT, cls.STORAGE_BASE))

    @classmethod
    def resolve_file_path(cls, file_path):
        """Resolve legacy relative file paths to absolute paths."""
        if not file_path:
            return file_path
        if os.path.isabs(file_path):
            return file_path

        backend_candidate = os.path.abspath(os.path.join(cls.BACKEND_ROOT, file_path))
        if os.path.exists(backend_candidate):
            return backend_candidate

        project_candidate = os.path.abspath(os.path.join(cls.BACKEND_ROOT, '..', file_path))
        if os.path.exists(project_candidate):
            return project_candidate

        return backend_candidate

    @staticmethod
    def _safe_int(value):
        """Parse integer-like values returning None on invalid payloads."""
        if value in (None, ''):
            return None
        try:
            return int(value)
        except (TypeError, ValueError):
            return None

    @classmethod
    def _resolve_medical_record_id(cls, medical_record_id=None, patient_id=None):
        """Resolve medical_record_id with patient alias fallback."""
        resolved_record_id = cls._safe_int(medical_record_id)
        if resolved_record_id:
            return resolved_record_id

        resolved_patient_id = cls._safe_int(patient_id)
        if resolved_patient_id:
            latest_record = (
                MedicalRecord.query.filter_by(patient_id=resolved_patient_id)
                .order_by(MedicalRecord.created_at.desc())
                .first()
            )
            if latest_record:
                return latest_record.id

        raise ValidationError('medical_record_id is required')

    @staticmethod
    def list_files(patient_id=None):
        """List file metadata with optional patient filter."""
        query = File.query
        if patient_id:
            query = query.join(MedicalRecord).filter(MedicalRecord.patient_id == patient_id)
        return query.order_by(File.created_at.desc()).all()

    @staticmethod
    def get_file(file_id):
        """Get file by ID or raise ResourceNotFoundError."""
        file_record = File.query.get(file_id)
        if not file_record:
            raise ResourceNotFoundError('File not found')
        return file_record

    @classmethod
    def create_file_record(
        cls,
        file,
        uploaded_by,
        medical_record_id=None,
        patient_id=None,
        file_type='other',
        description='',
    ):
        """Create file from upload payload."""
        if file is None:
            raise ValidationError('No file provided')

        if file.filename == '':
            raise ValidationError('No file selected')

        if not cls.allowed_file(file.filename):
            raise ValidationError('File type not allowed')

        resolved_record_id = cls._resolve_medical_record_id(
            medical_record_id=medical_record_id,
            patient_id=patient_id,
        )

        medical_record = MedicalRecord.query.get(resolved_record_id)
        if not medical_record:
            raise ResourceNotFoundError('Medical record not found')

        original_filename = secure_filename(file.filename)
        unique_filename = cls.generate_unique_filename(original_filename)

        upload_dir = cls.resolve_upload_dir()
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, unique_filename)
        file.save(file_path)

        file_record = File(
            medical_record_id=resolved_record_id,
            filename=original_filename,
            file_type=file_type or 'other',
            mime_type=file.content_type,
            file_size=os.path.getsize(file_path),
            storage_type='local',
            file_path=file_path,
            description=description or '',
            uploaded_by=uploaded_by,
        )

        db.session.add(file_record)
        db.session.commit()
        return file_record

    @staticmethod
    def upload_file(file, medical_record_id, file_type, uploaded_by, description=None):
        """Backward-compatible upload wrapper."""
        return FileService.create_file_record(
            file=file,
            uploaded_by=uploaded_by,
            medical_record_id=medical_record_id,
            file_type=file_type,
            description=description or '',
        )

    @classmethod
    def download_file(cls, file_id):
        """Get file metadata + resolved path for download."""
        file_record = cls.get_file(file_id)
        resolved_path = cls.resolve_file_path(file_record.file_path)
        if not os.path.exists(resolved_path):
            raise ResourceNotFoundError('File not found on disk')
        return file_record, resolved_path

    @classmethod
    def delete_file(cls, file_id):
        """Delete file from storage and database."""
        file_record = cls.get_file(file_id)
        resolved_path = cls.resolve_file_path(file_record.file_path)
        if resolved_path and os.path.exists(resolved_path):
            os.remove(resolved_path)
        db.session.delete(file_record)
        db.session.commit()
        return True

    @staticmethod
    def get_patient_files(patient_id, file_type=None):
        """Get all files for a patient, optionally filtered by type."""
        query = File.query.join(MedicalRecord).filter(
            MedicalRecord.patient_id == patient_id
        )

        if file_type:
            query = query.filter(File.file_type == file_type)

        return query.order_by(File.created_at.desc()).all()
