# -*- coding: utf-8 -*-
"""
Tests for File Management module
"""

import pytest
import os
import io
from app.models.file import File
from app.models.medical_record import MedicalRecord
from app.extensions import db


class TestUploadFile:
    """Test file upload functionality"""

    def test_upload_file_success(self, client, auth_headers, sample_patient, sample_professional, app):
        """Test successful file upload"""
        with app.app_context():
            # Create medical record
            medical_record = MedicalRecord(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                chief_complaint='Test consultation'
            )
            db.session.add(medical_record)
            db.session.commit()
            record_id = medical_record.id

        # Create test file
        data = {
            'file': (io.BytesIO(b"test file content"), 'test.pdf'),
            'medical_record_id': str(record_id),
            'file_type': 'lab_result',
            'description': 'Test lab result'
        }

        response = client.post(
            '/api/files/upload',
            data=data,
            content_type='multipart/form-data',
            headers=auth_headers
        )

        assert response.status_code == 201
        json_data = response.get_json()
        assert 'id' in json_data
        assert json_data['filename'] == 'test.pdf'
        assert json_data['file_type'] == 'lab_result'

    def test_upload_file_no_file_provided(self, client, auth_headers):
        """Test upload without file"""
        response = client.post(
            '/api/files/upload',
            data={},
            content_type='multipart/form-data',
            headers=auth_headers
        )

        assert response.status_code == 400
        assert 'No file provided' in response.get_json()['msg']

    def test_upload_file_invalid_extension(self, client, auth_headers, sample_patient, sample_professional, app):
        """Test upload with invalid file extension"""
        with app.app_context():
            medical_record = MedicalRecord(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                chief_complaint='Test consultation'
            )
            db.session.add(medical_record)
            db.session.commit()
            record_id = medical_record.id

        data = {
            'file': (io.BytesIO(b"test"), 'test.exe'),
            'medical_record_id': str(record_id),
            'file_type': 'other'
        }

        response = client.post(
            '/api/files/upload',
            data=data,
            content_type='multipart/form-data',
            headers=auth_headers
        )

        assert response.status_code == 400
        assert 'File type not allowed' in response.get_json()['msg']

    def test_upload_file_missing_medical_record_id(self, client, auth_headers):
        """Test upload without medical_record_id"""
        data = {
            'file': (io.BytesIO(b"test"), 'test.pdf'),
            'file_type': 'lab_result'
        }

        response = client.post(
            '/api/files/upload',
            data=data,
            content_type='multipart/form-data',
            headers=auth_headers
        )

        assert response.status_code == 400
        assert 'medical_record_id is required' in response.get_json()['msg']

    def test_upload_file_invalid_medical_record(self, client, auth_headers):
        """Test upload with non-existent medical record"""
        data = {
            'file': (io.BytesIO(b"test"), 'test.pdf'),
            'medical_record_id': '99999',
            'file_type': 'lab_result'
        }

        response = client.post(
            '/api/files/upload',
            data=data,
            content_type='multipart/form-data',
            headers=auth_headers
        )

        assert response.status_code == 404
        assert 'Medical record not found' in response.get_json()['msg']

    def test_upload_file_unauthorized(self, client, sample_patient, sample_professional, app):
        """Test upload without authentication"""
        with app.app_context():
            medical_record = MedicalRecord(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                chief_complaint='Test consultation'
            )
            db.session.add(medical_record)
            db.session.commit()
            record_id = medical_record.id

        data = {
            'file': (io.BytesIO(b"test"), 'test.pdf'),
            'medical_record_id': str(record_id),
            'file_type': 'lab_result'
        }

        response = client.post(
            '/api/files/upload',
            data=data,
            content_type='multipart/form-data'
        )

        assert response.status_code == 401


class TestGetFile:
    """Test get file metadata"""

    def test_get_file_success(self, client, auth_headers, sample_patient, sample_professional, app):
        """Test getting file metadata"""
        with app.app_context():
            medical_record = MedicalRecord(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                chief_complaint='Test consultation'
            )
            db.session.add(medical_record)
            db.session.commit()

            file_record = File(
                medical_record_id=medical_record.id,
                filename='test.pdf',
                file_type='lab_result',
                mime_type='application/pdf',
                file_size=1024,
                storage_type='local',
                file_path='/tmp/test.pdf',
                uploaded_by=sample_professional.id
            )
            db.session.add(file_record)
            db.session.commit()
            file_id = file_record.id

        response = client.get(f'/api/files/{file_id}', headers=auth_headers)

        assert response.status_code == 200
        json_data = response.get_json()
        assert json_data['filename'] == 'test.pdf'
        assert json_data['file_type'] == 'lab_result'

    def test_get_file_not_found(self, client, auth_headers):
        """Test getting non-existent file"""
        response = client.get('/api/files/99999', headers=auth_headers)
        assert response.status_code == 404

    def test_get_file_unauthorized(self, client, sample_patient, sample_professional, app):
        """Test getting file without authentication"""
        with app.app_context():
            medical_record = MedicalRecord(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                chief_complaint='Test consultation'
            )
            db.session.add(medical_record)
            db.session.commit()

            file_record = File(
                medical_record_id=medical_record.id,
                filename='test.pdf',
                file_type='lab_result',
                mime_type='application/pdf',
                file_size=1024,
                storage_type='local',
                file_path='/tmp/test.pdf',
                uploaded_by=sample_professional.id
            )
            db.session.add(file_record)
            db.session.commit()
            file_id = file_record.id

        response = client.get(f'/api/files/{file_id}')
        assert response.status_code == 401


class TestDownloadFile:
    """Test file download"""

    def test_download_file_success(self, client, auth_headers, sample_patient, sample_professional, app):
        """Test downloading file"""
        # Create actual temporary file
        import tempfile
        with tempfile.NamedTemporaryFile(mode='wb', delete=False, suffix='.pdf') as tmp_file:
            tmp_file.write(b"test content")
            tmp_path = tmp_file.name

        try:
            with app.app_context():
                medical_record = MedicalRecord(
                    patient_id=sample_patient.id,
                    professional_id=sample_professional.id,
                    chief_complaint='Test consultation'
                )
                db.session.add(medical_record)
                db.session.commit()

                file_record = File(
                    medical_record_id=medical_record.id,
                    filename='test.pdf',
                    file_type='lab_result',
                    mime_type='application/pdf',
                    file_size=12,
                    storage_type='local',
                    file_path=tmp_path,
                    uploaded_by=sample_professional.id
                )
                db.session.add(file_record)
                db.session.commit()
                file_id = file_record.id

            response = client.get(f'/api/files/{file_id}/download', headers=auth_headers)

            assert response.status_code == 200
            assert response.data == b"test content"
        finally:
            # Cleanup - try to remove, but don't fail if file is locked on Windows
            try:
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)
            except PermissionError:
                pass  # File is still in use on Windows, will be cleaned up later

    def test_download_file_not_found(self, client, auth_headers):
        """Test downloading non-existent file"""
        response = client.get('/api/files/99999/download', headers=auth_headers)
        assert response.status_code == 404

    def test_download_file_not_on_disk(self, client, auth_headers, sample_patient, sample_professional, app):
        """Test downloading file that doesn't exist on disk"""
        with app.app_context():
            medical_record = MedicalRecord(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                chief_complaint='Test consultation'
            )
            db.session.add(medical_record)
            db.session.commit()

            file_record = File(
                medical_record_id=medical_record.id,
                filename='test.pdf',
                file_type='lab_result',
                mime_type='application/pdf',
                file_size=1024,
                storage_type='local',
                file_path='/nonexistent/path/test.pdf',
                uploaded_by=sample_professional.id
            )
            db.session.add(file_record)
            db.session.commit()
            file_id = file_record.id

        response = client.get(f'/api/files/{file_id}/download', headers=auth_headers)
        assert response.status_code == 404
        assert 'File not found on disk' in response.get_json()['msg']


class TestDeleteFile:
    """Test file deletion"""

    def test_delete_file_success(self, client, auth_headers, sample_patient, sample_professional, app):
        """Test deleting file"""
        # Create actual temporary file
        import tempfile
        with tempfile.NamedTemporaryFile(mode='wb', delete=False, suffix='.pdf') as tmp_file:
            tmp_file.write(b"test content")
            tmp_path = tmp_file.name

        with app.app_context():
            medical_record = MedicalRecord(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                chief_complaint='Test consultation'
            )
            db.session.add(medical_record)
            db.session.commit()

            file_record = File(
                medical_record_id=medical_record.id,
                filename='test.pdf',
                file_type='lab_result',
                mime_type='application/pdf',
                file_size=12,
                storage_type='local',
                file_path=tmp_path,
                uploaded_by=sample_professional.id
            )
            db.session.add(file_record)
            db.session.commit()
            file_id = file_record.id

        response = client.delete(f'/api/files/{file_id}', headers=auth_headers)

        assert response.status_code == 200
        assert 'File deleted' in response.get_json()['msg']

        # Verify file is deleted from disk
        assert not os.path.exists(tmp_path)

    def test_delete_file_not_found(self, client, auth_headers):
        """Test deleting non-existent file"""
        response = client.delete('/api/files/99999', headers=auth_headers)
        assert response.status_code == 404

    def test_delete_file_missing_on_disk(self, client, auth_headers, sample_patient, sample_professional, app):
        """Test deleting file that doesn't exist on disk (should still delete record)"""
        with app.app_context():
            medical_record = MedicalRecord(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                chief_complaint='Test consultation'
            )
            db.session.add(medical_record)
            db.session.commit()

            file_record = File(
                medical_record_id=medical_record.id,
                filename='test.pdf',
                file_type='lab_result',
                mime_type='application/pdf',
                file_size=1024,
                storage_type='local',
                file_path='/nonexistent/path/test.pdf',
                uploaded_by=sample_professional.id
            )
            db.session.add(file_record)
            db.session.commit()
            file_id = file_record.id

        response = client.delete(f'/api/files/{file_id}', headers=auth_headers)

        assert response.status_code == 200
        assert 'File deleted' in response.get_json()['msg']

    def test_delete_file_unauthorized(self, client, sample_patient, sample_professional, app):
        """Test deleting file without authentication"""
        with app.app_context():
            medical_record = MedicalRecord(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                chief_complaint='Test consultation'
            )
            db.session.add(medical_record)
            db.session.commit()

            file_record = File(
                medical_record_id=medical_record.id,
                filename='test.pdf',
                file_type='lab_result',
                mime_type='application/pdf',
                file_size=1024,
                storage_type='local',
                file_path='/tmp/test.pdf',
                uploaded_by=sample_professional.id
            )
            db.session.add(file_record)
            db.session.commit()
            file_id = file_record.id

        response = client.delete(f'/api/files/{file_id}')
        assert response.status_code == 401
