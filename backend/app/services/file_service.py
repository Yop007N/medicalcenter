# -*- coding: utf-8 -*-
"""
File Service - Business logic for file management (upload/download)
"""

import os
import hashlib
from datetime import datetime
from pathlib import Path
from werkzeug.utils import secure_filename
from app.models.file import File
from app.models.medical_record import MedicalRecord
from app.extensions import db


class FileService:
    """File management business logic"""

    ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'gif', 'dcm', 'doc', 'docx', 'txt'}
    STORAGE_BASE = 'storage/files'

    @staticmethod
    def allowed_file(filename):
        """Check if file extension is allowed"""
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in FileService.ALLOWED_EXTENSIONS

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
        name, ext = os.path.splitext(secure_filename(original_filename))
        return f"{name}_{timestamp}{ext}"

    @staticmethod
    def upload_file(file, medical_record_id, file_type, uploaded_by, description=None):
        """
        Upload file to local storage organized by patient and type

        Args:
            file: File object from request
            medical_record_id: Associated medical record ID
            file_type: Type of medical file (lab_result, xray, etc.)
            uploaded_by: User ID who uploaded the file
            description: Optional file description

        Returns:
            Created File model instance
        """
        # Get medical record to find patient
        medical_record = MedicalRecord.query.get(medical_record_id)
        if not medical_record:
            raise ValueError("Medical record not found")

        # Generate unique filename
        unique_filename = FileService.generate_unique_filename(file.filename)

        # Get organized storage path
        storage_path = FileService.get_patient_storage_path(
            medical_record.patient_id,
            file_type
        )

        # Full file path
        file_path = os.path.join(storage_path, unique_filename)

        # Save file
        file.save(file_path)

        # Get file size
        file_size = os.path.getsize(file_path)

        # Create file record
        file_record = File(
            medical_record_id=medical_record_id,
            filename=file.filename,
            file_type=file_type,
            mime_type=file.content_type,
            file_size=file_size,
            storage_type='local',
            file_path=file_path,
            description=description,
            uploaded_by=uploaded_by
        )

        db.session.add(file_record)
        db.session.commit()

        return file_record

    @staticmethod
    def download_file(file_id):
        """
        Get file for download

        Args:
            file_id: ID of the file to download

        Returns:
            File model instance
        """
        file_record = File.query.get(file_id)
        if not file_record:
            raise ValueError("File not found")

        if not os.path.exists(file_record.file_path):
            raise FileNotFoundError("File not found on disk")

        return file_record

    @staticmethod
    def delete_file(file_id):
        """
        Delete file from storage and database

        Args:
            file_id: ID of the file to delete

        Returns:
            bool: True if successful
        """
        file_record = File.query.get(file_id)
        if not file_record:
            raise ValueError("File not found")

        # Delete physical file if exists
        if os.path.exists(file_record.file_path):
            os.remove(file_record.file_path)

        # Delete database record
        db.session.delete(file_record)
        db.session.commit()

        return True

    @staticmethod
    def get_patient_files(patient_id, file_type=None):
        """
        Get all files for a patient, optionally filtered by type

        Args:
            patient_id: Patient ID
            file_type: Optional file type filter

        Returns:
            List of File instances
        """
        from app.models.medical_record import MedicalRecord

        query = File.query.join(MedicalRecord).filter(
            MedicalRecord.patient_id == patient_id
        )

        if file_type:
            query = query.filter(File.file_type == file_type)

        return query.order_by(File.created_at.desc()).all()
