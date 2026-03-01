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
from app.services.access_scope_service import AccessScopeService
from app.services.exceptions import AccessDeniedError, ResourceNotFoundError, ValidationError
from app.services.specialty_module_service import SpecialtyModuleService


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
            raise ValidationError(
                'El paciente no tiene historial médico. Crea un historial o indica medical_record_id.'
            )

        raise ValidationError('medical_record_id is required')

    @staticmethod
    def _resolve_specialty_scope(current_user, specialty_key):
        """Validate specialty_key and return normalized module metadata."""
        effective_specialty_key = specialty_key
        if current_user.role == 'professional' and not effective_specialty_key:
            effective_specialty_key = AccessScopeService.resolve_specialty_key(
                getattr(current_user, 'specialty', None)
            )

        if not effective_specialty_key:
            return None, None

        normalized_specialty_key = AccessScopeService.normalize_text(effective_specialty_key)
        module = SpecialtyModuleService.get_module_by_key(normalized_specialty_key)
        if not module:
            raise ValidationError('Invalid specialty_key')

        module_key = module.get('key')
        if current_user.role == 'professional':
            professional_specialty_key = AccessScopeService.resolve_specialty_key(
                getattr(current_user, 'specialty', None)
            )
            if professional_specialty_key != module_key:
                raise AccessDeniedError('Professional can only access own specialty files')
            return module_key, None

        module_professional_ids = sorted(
            SpecialtyModuleService.get_professional_ids_for_module(module_key)
        )
        return module_key, module_professional_ids

    @classmethod
    def _scoped_query(cls, current_user, specialty_key=None):
        """Build a scoped file query for current actor."""
        module_key, module_professional_ids = cls._resolve_specialty_scope(
            current_user=current_user,
            specialty_key=specialty_key,
        )
        query = File.query.join(MedicalRecord)

        if current_user.role == 'patient':
            query = query.filter(MedicalRecord.patient_id == current_user.id)
            if module_key:
                if not module_professional_ids:
                    return query.filter(File.id == -1), module_key
                query = query.filter(MedicalRecord.professional_id.in_(module_professional_ids))
        elif current_user.role == 'professional':
            scoped_patient_ids = list(
                AccessScopeService.get_professional_patient_ids(
                    current_user.id,
                    specialty_key=module_key,
                )
            )
            if not scoped_patient_ids:
                return query.filter(File.id == -1), module_key
            query = query.filter(MedicalRecord.patient_id.in_(scoped_patient_ids))
        elif current_user.role == 'admin':
            if module_key:
                if not module_professional_ids:
                    return query.filter(File.id == -1), module_key
                query = query.filter(MedicalRecord.professional_id.in_(module_professional_ids))
        else:
            raise AccessDeniedError('Unauthorized')

        return query, module_key

    @classmethod
    def _ensure_medical_record_access(cls, current_user, medical_record, specialty_key=None):
        """Validate actor permissions over a medical record used by files flow."""
        patient_id = getattr(medical_record, 'patient_id', None)
        if patient_id is None:
            raise ValidationError('Invalid medical record context')

        module_key, module_professional_ids = cls._resolve_specialty_scope(
            current_user=current_user,
            specialty_key=specialty_key,
        )

        AccessScopeService.ensure_patient_access_scope(current_user.id, patient_id)
        if current_user.role == 'professional' and module_key and not AccessScopeService.professional_can_access_patient(
            current_user.id,
            patient_id,
            specialty_key=module_key,
        ):
            raise AccessDeniedError('Professional can only access linked patients in this specialty')

        if current_user.role == 'admin' and module_key:
            if not module_professional_ids or medical_record.professional_id not in module_professional_ids:
                raise AccessDeniedError('Medical record is outside requested specialty scope')

        return module_key

    @classmethod
    def list_files(cls, current_user_id, patient_id=None, specialty_key=None):
        """List file metadata with optional patient and specialty scopes."""
        current_user = AccessScopeService.get_user_or_raise(current_user_id)
        query, module_key = cls._scoped_query(current_user=current_user, specialty_key=specialty_key)

        if patient_id is not None:
            AccessScopeService.ensure_patient_access_scope(current_user.id, patient_id)
            if current_user.role == 'professional' and module_key and not AccessScopeService.professional_can_access_patient(
                current_user.id,
                patient_id,
                specialty_key=module_key,
            ):
                raise AccessDeniedError('Professional can only access linked patients in this specialty')
            query = query.filter(MedicalRecord.patient_id == patient_id)

        return query.order_by(File.created_at.desc()).all()

    @classmethod
    def get_file(cls, file_id, current_user_id, specialty_key=None):
        """Get file by ID or raise ResourceNotFoundError."""
        file_record = File.query.get(file_id)
        if not file_record:
            raise ResourceNotFoundError('File not found')
        medical_record = file_record.medical_record
        if not medical_record:
            raise ResourceNotFoundError('Medical record not found')

        current_user = AccessScopeService.get_user_or_raise(current_user_id)
        cls._ensure_medical_record_access(
            current_user=current_user,
            medical_record=medical_record,
            specialty_key=specialty_key,
        )
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
        specialty_key=None,
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

        current_user = AccessScopeService.get_user_or_raise(uploaded_by)
        cls._ensure_medical_record_access(
            current_user=current_user,
            medical_record=medical_record,
            specialty_key=specialty_key,
        )

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
    def upload_file(
        file,
        medical_record_id,
        file_type,
        uploaded_by,
        description=None,
        specialty_key=None,
    ):
        """Backward-compatible upload wrapper."""
        return FileService.create_file_record(
            file=file,
            uploaded_by=uploaded_by,
            medical_record_id=medical_record_id,
            file_type=file_type,
            description=description or '',
            specialty_key=specialty_key,
        )

    @classmethod
    def download_file(cls, file_id, current_user_id, specialty_key=None):
        """Get file metadata + resolved path for download."""
        file_record = cls.get_file(
            file_id=file_id,
            current_user_id=current_user_id,
            specialty_key=specialty_key,
        )
        resolved_path = cls.resolve_file_path(file_record.file_path)
        if not os.path.exists(resolved_path):
            raise ResourceNotFoundError('File not found on disk')
        return file_record, resolved_path

    @classmethod
    def delete_file(cls, file_id, current_user_id, specialty_key=None):
        """Delete file from storage and database."""
        current_user = AccessScopeService.get_user_or_raise(current_user_id)
        if current_user.role == 'patient':
            raise AccessDeniedError('Patients cannot delete files')
        file_record = cls.get_file(
            file_id=file_id,
            current_user_id=current_user_id,
            specialty_key=specialty_key,
        )
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
