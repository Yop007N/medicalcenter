# -*- coding: utf-8 -*-
"""
Tests for File Management module
"""

import pytest
import os
import io
from app.models.file import File
from app.models.medical_record import MedicalRecord
from app.models.patient import Patient
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

    def test_upload_file_accepts_category_and_patient_id_alias(
        self,
        client,
        auth_headers,
        sample_patient,
        sample_professional,
        app
    ):
        """Test upload compatibility with frontend category/patient_id payload."""
        with app.app_context():
            medical_record = MedicalRecord(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                chief_complaint='Alias upload'
            )
            db.session.add(medical_record)
            db.session.commit()
            record_id = medical_record.id

        data = {
            'file': (io.BytesIO(b"test alias"), 'alias.pdf'),
            'patient_id': str(sample_patient.id),
            'category': 'lab_result'
        }

        response = client.post(
            '/api/files/upload',
            data=data,
            content_type='multipart/form-data',
            headers=auth_headers
        )

        assert response.status_code == 201
        payload = response.get_json()
        assert payload['file_type'] == 'lab_result'
        assert payload['category'] == 'lab_result'
        assert payload['patient_id'] == sample_patient.id
        assert payload['medical_record_id'] == record_id

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


class TestListFiles:
    """Test listing file metadata."""

    def test_list_files_and_filter_by_patient(
        self,
        client,
        auth_headers,
        sample_patient,
        sample_professional,
        app
    ):
        with app.app_context():
            # Patient 1
            record_1 = MedicalRecord(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                chief_complaint='List files 1'
            )
            db.session.add(record_1)
            db.session.flush()

            file_1 = File(
                medical_record_id=record_1.id,
                filename='file-1.pdf',
                file_type='lab_result',
                mime_type='application/pdf',
                file_size=123,
                storage_type='local',
                file_path='storage/files/file-1.pdf',
                uploaded_by=sample_professional.id
            )
            db.session.add(file_1)

            # Patient 2
            patient_2 = Patient(
                email='file-patient-2@test.com',
                first_name='File',
                last_name='Patient2',
                role='patient'
            )
            patient_2.set_password('Patient123')
            db.session.add(patient_2)
            db.session.flush()

            record_2 = MedicalRecord(
                patient_id=patient_2.id,
                professional_id=sample_professional.id,
                chief_complaint='List files 2'
            )
            db.session.add(record_2)
            db.session.flush()

            file_2 = File(
                medical_record_id=record_2.id,
                filename='file-2.pdf',
                file_type='xray',
                mime_type='application/pdf',
                file_size=456,
                storage_type='local',
                file_path='storage/files/file-2.pdf',
                uploaded_by=sample_professional.id
            )
            db.session.add(file_2)
            db.session.commit()

        all_response = client.get('/api/files', headers=auth_headers)
        assert all_response.status_code == 200
        all_files = all_response.get_json()
        assert len(all_files) == 2

        filtered_response = client.get(
            f'/api/files?patient_id={sample_patient.id}',
            headers=auth_headers
        )
        assert filtered_response.status_code == 200
        filtered = filtered_response.get_json()
        assert len(filtered) == 1
        assert filtered[0]['patient_id'] == sample_patient.id
        assert filtered[0]['filename'] == 'file-1.pdf'


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


class TestMedicalRecordsFilesIntegration:
    """Integration tests spanning medical records and files endpoints."""

    def test_medical_record_and_file_workflow_end_to_end(
        self,
        client,
        auth_headers,
        sample_patient,
        sample_appointment
    ):
        """Test chained flow: medical record CRUD context + file upload lifecycle."""
        create_record_payload = {
            'patient_id': sample_patient.id,
            'appointment_id': sample_appointment.id,
            'chief_complaint': 'Headache and fatigue',
            'diagnosis': 'Tension headache'
        }
        create_record_response = client.post(
            '/api/medical-records',
            json=create_record_payload,
            headers=auth_headers
        )
        assert create_record_response.status_code == 201
        created_record = create_record_response.get_json()
        record_id = created_record['id']

        detail_before_file_response = client.get(
            f'/api/medical-records/{record_id}',
            headers=auth_headers
        )
        assert detail_before_file_response.status_code == 200
        detail_before_file = detail_before_file_response.get_json()
        assert detail_before_file['id'] == record_id
        assert detail_before_file['patient_id'] == sample_patient.id
        assert detail_before_file['files'] == []

        upload_response = client.post(
            '/api/files/upload',
            data={
                'file': (io.BytesIO(b'lab-result-content'), 'lab-result.pdf'),
                'medical_record_id': str(record_id),
                'file_type': 'lab_result',
                'description': 'Initial blood panel'
            },
            content_type='multipart/form-data',
            headers=auth_headers
        )
        assert upload_response.status_code == 201
        uploaded_file = upload_response.get_json()
        file_id = uploaded_file['id']
        assert uploaded_file['medical_record_id'] == record_id
        assert uploaded_file['patient_id'] == sample_patient.id
        assert uploaded_file['file_type'] == 'lab_result'

        files_by_patient_response = client.get(
            f'/api/files?patient_id={sample_patient.id}',
            headers=auth_headers
        )
        assert files_by_patient_response.status_code == 200
        files_by_patient = files_by_patient_response.get_json()
        assert any(file_row['id'] == file_id for file_row in files_by_patient)

        file_metadata_response = client.get(f'/api/files/{file_id}', headers=auth_headers)
        assert file_metadata_response.status_code == 200
        file_metadata = file_metadata_response.get_json()
        assert file_metadata['id'] == file_id
        assert file_metadata['medical_record_id'] == record_id
        assert file_metadata['filename'] == 'lab-result.pdf'

        download_response = client.get(f'/api/files/{file_id}/download', headers=auth_headers)
        assert download_response.status_code == 200
        assert download_response.data == b'lab-result-content'
        download_response.close()

        detail_after_upload_response = client.get(
            f'/api/medical-records/{record_id}',
            headers=auth_headers
        )
        assert detail_after_upload_response.status_code == 200
        detail_after_upload = detail_after_upload_response.get_json()
        assert any(file_row['id'] == file_id for file_row in detail_after_upload['files'])

        delete_file_response = client.delete(f'/api/files/{file_id}', headers=auth_headers)
        assert delete_file_response.status_code == 200

        file_not_found_response = client.get(f'/api/files/{file_id}', headers=auth_headers)
        assert file_not_found_response.status_code == 404

        detail_after_delete_response = client.get(
            f'/api/medical-records/{record_id}',
            headers=auth_headers
        )
        assert detail_after_delete_response.status_code == 200
        detail_after_delete = detail_after_delete_response.get_json()
        assert all(file_row['id'] != file_id for file_row in detail_after_delete['files'])

        delete_record_response = client.delete(
            f'/api/medical-records/{record_id}',
            headers=auth_headers
        )
        assert delete_record_response.status_code == 200

        record_not_found_response = client.get(
            f'/api/medical-records/{record_id}',
            headers=auth_headers
        )
        assert record_not_found_response.status_code == 404
