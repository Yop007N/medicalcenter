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
from app.models.professional import Professional
from app.models.professional_patient_assignment import ProfessionalPatientAssignment
from app.extensions import db


def professional_headers(client, email, password='Doctor123'):
    response = client.post(
        '/api/auth/login',
        json={'email': email, 'password': password},
    )
    assert response.status_code == 200
    return {'Authorization': f"Bearer {response.get_json()['access_token']}"}


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


class TestListFilesScope:
    """Specialty scoped listing contracts."""

    def test_professional_can_list_files_scoped_by_own_specialty(self, client, app):
        with app.app_context():
            cardio_professional = Professional(
                email='file-scope-cardio-prof@test.com',
                first_name='Carla',
                last_name='Cardio',
                role='professional',
                license_number='FILE-SCOPE-CARD-001',
                specialty='Cardiología',
            )
            cardio_professional.set_password('Doctor123')

            derm_professional = Professional(
                email='file-scope-derm-prof@test.com',
                first_name='Diego',
                last_name='Derma',
                role='professional',
                license_number='FILE-SCOPE-DERM-001',
                specialty='Dermatología',
            )
            derm_professional.set_password('Doctor123')

            cardio_patient = Patient(
                email='file-scope-cardio-patient@test.com',
                first_name='Paciente',
                last_name='Cardio',
                role='patient',
            )
            cardio_patient.set_password('Patient123')

            derm_patient = Patient(
                email='file-scope-derm-patient@test.com',
                first_name='Paciente',
                last_name='Derm',
                role='patient',
            )
            derm_patient.set_password('Patient123')

            db.session.add_all([cardio_professional, derm_professional, cardio_patient, derm_patient])
            db.session.flush()

            db.session.add_all([
                ProfessionalPatientAssignment(
                    professional_id=cardio_professional.id,
                    patient_id=cardio_patient.id,
                    specialty_key='cardiology',
                ),
                ProfessionalPatientAssignment(
                    professional_id=derm_professional.id,
                    patient_id=derm_patient.id,
                    specialty_key='dermatology',
                ),
            ])

            cardio_record = MedicalRecord(
                patient_id=cardio_patient.id,
                professional_id=cardio_professional.id,
                chief_complaint='Control cardiología',
            )
            derm_record = MedicalRecord(
                patient_id=derm_patient.id,
                professional_id=derm_professional.id,
                chief_complaint='Control dermatología',
            )
            db.session.add_all([cardio_record, derm_record])
            db.session.flush()

            cardio_file = File(
                medical_record_id=cardio_record.id,
                filename='cardio.pdf',
                file_type='study',
                mime_type='application/pdf',
                file_size=1024,
                storage_type='local',
                file_path='/tmp/cardio.pdf',
                uploaded_by=cardio_professional.id,
            )
            derm_file = File(
                medical_record_id=derm_record.id,
                filename='derm.pdf',
                file_type='study',
                mime_type='application/pdf',
                file_size=1024,
                storage_type='local',
                file_path='/tmp/derm.pdf',
                uploaded_by=derm_professional.id,
            )
            db.session.add_all([cardio_file, derm_file])
            db.session.commit()
            cardio_file_id = cardio_file.id
            derm_file_id = derm_file.id
            cardio_patient_id = cardio_patient.id

        headers = professional_headers(client, 'file-scope-cardio-prof@test.com')
        response = client.get(
            f'/api/files?specialty_key=cardiology&patient_id={cardio_patient_id}',
            headers=headers,
        )

        assert response.status_code == 200
        payload = response.get_json()
        returned_ids = {item['id'] for item in payload}
        assert cardio_file_id in returned_ids
        assert derm_file_id not in returned_ids

    def test_professional_file_scope_rejects_mismatched_specialty_key(self, client, app):
        with app.app_context():
            cardio_professional = Professional(
                email='file-scope-mismatch@test.com',
                first_name='Cora',
                last_name='Mismatch',
                role='professional',
                license_number='FILE-SCOPE-MISMATCH',
                specialty='Cardiología',
            )
            cardio_professional.set_password('Doctor123')
            db.session.add(cardio_professional)
            db.session.commit()

        headers = professional_headers(client, 'file-scope-mismatch@test.com')
        response = client.get('/api/files?specialty_key=dermatology', headers=headers)
        assert response.status_code == 403

    def test_get_file_forbidden_for_unlinked_professional(
        self,
        client,
        auth_headers,
        app,
    ):
        """Professional should not fetch files from unrelated patients."""
        with app.app_context():
            other_professional = Professional(
                email='file-other-prof@test.com',
                first_name='Other',
                last_name='Doctor',
                role='professional',
                license_number='FIL-OTH-001',
                specialty='Cardiología',
            )
            other_professional.set_password('Doctor123')
            db.session.add(other_professional)
            db.session.flush()

            patient_2 = Patient(
                email='file-unlinked-patient@test.com',
                first_name='File',
                last_name='Unlinked',
                role='patient',
            )
            patient_2.set_password('Patient123')
            db.session.add(patient_2)
            db.session.flush()

            medical_record = MedicalRecord(
                patient_id=patient_2.id,
                professional_id=other_professional.id,
                chief_complaint='Scoped file',
            )
            db.session.add(medical_record)
            db.session.flush()

            file_record = File(
                medical_record_id=medical_record.id,
                filename='scoped.pdf',
                file_type='lab_result',
                mime_type='application/pdf',
                file_size=123,
                storage_type='local',
                file_path='/tmp/scoped.pdf',
                uploaded_by=other_professional.id,
            )
            db.session.add(file_record)
            db.session.commit()
            file_id = file_record.id

        response = client.get(f'/api/files/{file_id}', headers=auth_headers)
        assert response.status_code == 403


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

    def test_admin_can_filter_files_by_specialty_key(self, client, admin_auth_headers, app):
        """Admin specialty_key filter should return only module files."""
        with app.app_context():
            cardio_professional = Professional(
                email='file-cardio-prof@test.com',
                first_name='Cardio',
                last_name='Doctor',
                role='professional',
                license_number='FIL-CARD-001',
                specialty='Cardiología',
            )
            cardio_professional.set_password('Doctor123')
            db.session.add(cardio_professional)

            derm_professional = Professional(
                email='file-derm-prof@test.com',
                first_name='Derm',
                last_name='Doctor',
                role='professional',
                license_number='FIL-DERM-001',
                specialty='Dermatología',
            )
            derm_professional.set_password('Doctor123')
            db.session.add(derm_professional)
            db.session.flush()

            cardio_patient = Patient(
                email='file-cardio-patient@test.com',
                first_name='Cardio',
                last_name='Patient',
                role='patient',
            )
            cardio_patient.set_password('Patient123')
            derm_patient = Patient(
                email='file-derm-patient@test.com',
                first_name='Derm',
                last_name='Patient',
                role='patient',
            )
            derm_patient.set_password('Patient123')
            db.session.add_all([cardio_patient, derm_patient])
            db.session.flush()

            cardio_record = MedicalRecord(
                patient_id=cardio_patient.id,
                professional_id=cardio_professional.id,
                chief_complaint='Cardio file',
            )
            derm_record = MedicalRecord(
                patient_id=derm_patient.id,
                professional_id=derm_professional.id,
                chief_complaint='Derm file',
            )
            db.session.add_all([cardio_record, derm_record])
            db.session.flush()

            cardio_file = File(
                medical_record_id=cardio_record.id,
                filename='cardio-file.pdf',
                file_type='xray',
                mime_type='application/pdf',
                file_size=100,
                storage_type='local',
                file_path='storage/files/cardio-file.pdf',
                uploaded_by=cardio_professional.id,
            )
            derm_file = File(
                medical_record_id=derm_record.id,
                filename='derm-file.pdf',
                file_type='xray',
                mime_type='application/pdf',
                file_size=200,
                storage_type='local',
                file_path='storage/files/derm-file.pdf',
                uploaded_by=derm_professional.id,
            )
            db.session.add_all([cardio_file, derm_file])
            db.session.commit()
            cardio_file_id = cardio_file.id
            derm_file_id = derm_file.id

        response = client.get(
            '/api/files?specialty_key=cardiology',
            headers=admin_auth_headers,
        )
        assert response.status_code == 200
        payload = response.get_json()
        returned_ids = {item['id'] for item in payload}
        assert cardio_file_id in returned_ids
        assert derm_file_id not in returned_ids


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
