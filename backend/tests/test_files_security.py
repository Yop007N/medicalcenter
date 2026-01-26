# -*- coding: utf-8 -*-
"""
Security Tests for File Management module
"""

import pytest
import os
import io
from app.models.file import File
from app.models.medical_record import MedicalRecord
from app.models.patient import Patient
from app.extensions import db
from werkzeug.security import generate_password_hash

class TestFileSecurity:
    """Test file security and IDOR vulnerabilities"""

    @pytest.fixture
    def patient_b_auth_headers(self, client, app):
        """Create a second patient and return auth headers"""
        with app.app_context():
            patient = Patient(
                email='patient_b@test.com',
                first_name='Patient',
                last_name='B',
                role='patient'
            )
            patient.set_password('PatientB123')
            db.session.add(patient)
            db.session.commit()

            # Login
            response = client.post('/api/auth/login', json={
                'email': 'patient_b@test.com',
                'password': 'PatientB123'
            })
            token = response.json['access_token']
            return {'Authorization': f'Bearer {token}'}

    def test_idor_get_file(self, client, patient_b_auth_headers, sample_patient, sample_professional, app):
        """
        Test IDOR vulnerability: Patient B tries to access Patient A's file.
        This test should FAIL if the vulnerability is fixed (expecting 403),
        but PASS if the vulnerability exists (expecting 200).
        """
        with app.app_context():
            # Create medical record for Patient A (sample_patient)
            medical_record = MedicalRecord(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                chief_complaint='Test consultation'
            )
            db.session.add(medical_record)
            db.session.commit()

            # Create file for Patient A
            file_record = File(
                medical_record_id=medical_record.id,
                filename='patient_a_file.pdf',
                file_type='lab_result',
                mime_type='application/pdf',
                file_size=1024,
                storage_type='local',
                file_path='/tmp/patient_a_file.pdf',
                uploaded_by=sample_professional.id
            )
            db.session.add(file_record)
            db.session.commit()
            file_id = file_record.id

        # Try to access as Patient B
        response = client.get(f'/api/files/{file_id}', headers=patient_b_auth_headers)

        # Vulnerability fixed: Patient B cannot access Patient A's file
        assert response.status_code == 403
        json_data = response.get_json()
        assert 'Unauthorized access' in json_data['msg']

    def test_idor_download_file(self, client, patient_b_auth_headers, sample_patient, sample_professional, app):
        """
        Test IDOR vulnerability: Patient B tries to download Patient A's file.
        """
        import tempfile
        with tempfile.NamedTemporaryFile(mode='wb', delete=False, suffix='.pdf') as tmp_file:
            tmp_file.write(b"patient a content")
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
                    filename='patient_a_file.pdf',
                    file_type='lab_result',
                    mime_type='application/pdf',
                    file_size=17,
                    storage_type='local',
                    file_path=tmp_path,
                    uploaded_by=sample_professional.id
                )
                db.session.add(file_record)
                db.session.commit()
                file_id = file_record.id

            # Try to download as Patient B
            response = client.get(f'/api/files/{file_id}/download', headers=patient_b_auth_headers)

            # Vulnerability fixed
            assert response.status_code == 403
            assert b"Unauthorized access" in response.data or b"Unauthorized access" in response.get_json()['msg'].encode()

        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    def test_idor_delete_file(self, client, patient_b_auth_headers, sample_patient, sample_professional, app):
        """
        Test IDOR vulnerability: Patient B tries to delete Patient A's file.
        """
        import tempfile
        with tempfile.NamedTemporaryFile(mode='wb', delete=False, suffix='.pdf') as tmp_file:
            tmp_file.write(b"patient a content")
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
                filename='patient_a_file.pdf',
                file_type='lab_result',
                mime_type='application/pdf',
                file_size=17,
                storage_type='local',
                file_path=tmp_path,
                uploaded_by=sample_professional.id
            )
            db.session.add(file_record)
            db.session.commit()
            file_id = file_record.id

        # Try to delete as Patient B
        response = client.delete(f'/api/files/{file_id}', headers=patient_b_auth_headers)

        # Vulnerability fixed
        assert response.status_code == 403

        # Verify file is NOT deleted
        assert os.path.exists(tmp_path)
        os.remove(tmp_path)
