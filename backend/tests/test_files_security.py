# -*- coding: utf-8 -*-
"""
Security Tests for File Management module
"""

import os
import pytest
from app.models.file import File
from app.models.medical_record import MedicalRecord
from app.models.user import User
from app.extensions import db


class TestFileSecurity:
    """Test file security controls"""

    @pytest.fixture
    def patient_user_2(self, app):
        """Create a second patient user for testing IDOR"""
        with app.app_context():
            user = User(
                email='patient2@test.com',
                first_name='Patient',
                last_name='Two',
                role='patient',
                is_active=True
            )
            user.set_password('Patient123')
            db.session.add(user)
            db.session.commit()
            user_id = user.id
            user_email = user.email
            db.session.expunge(user)

        class UserData:
            """Simple user data holder"""
            def __init__(self, uid, email):
                self.id = uid
                self.email = email

        return UserData(user_id, user_email)

    @pytest.fixture
    def patient_auth_headers_2(self, client, patient_user_2):
        """Get authentication headers for second patient user"""
        response = client.post('/api/auth/login', json={
            'email': patient_user_2.email,
            'password': 'Patient123'
        })
        token = response.json['access_token']
        return {'Authorization': f'Bearer {token}'}

    def test_idor_download_file(
        self, client, patient_auth_headers_2, sample_patient, sample_professional, app
    ):
        """
        Test IDOR vulnerability: Patient 2 trying to download Patient 1's file.
        Should return 403 Forbidden (currently returns 200 OK because of vulnerability).
        """
        # Create actual temporary file
        import tempfile
        with tempfile.NamedTemporaryFile(mode='wb', delete=False, suffix='.pdf') as tmp_file:
            tmp_file.write(b"confidential content")
            tmp_path = tmp_file.name

        try:
            with app.app_context():
                # Create medical record for Patient 1
                medical_record = MedicalRecord(
                    patient_id=sample_patient.id,  # Patient 1
                    professional_id=sample_professional.id,
                    chief_complaint='Confidential consultation'
                )
                db.session.add(medical_record)
                db.session.commit()

                # Create file for Patient 1
                file_record = File(
                    medical_record_id=medical_record.id,
                    filename='confidential.pdf',
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

            # Patient 2 tries to download Patient 1's file
            response = client.get(f'/api/files/{file_id}/download', headers=patient_auth_headers_2)

            # This assertion will FAIL if the vulnerability exists (status will be 200)
            assert response.status_code == 403, (
                f"IDOR Vulnerability found! Patient 2 could download Patient 1's file. "
                f"Status: {response.status_code}"
            )

        finally:
            # Cleanup
            try:
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)
            except PermissionError:
                pass
