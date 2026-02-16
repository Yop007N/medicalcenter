# -*- coding: utf-8 -*-
"""
Security tests for File Management module
"""

import pytest
import os
from app.models.file import File
from app.models.medical_record import MedicalRecord
from app.models.patient import Patient
from app.extensions import db

class TestFileIDOR:
    """Test Insecure Direct Object Reference on files"""

    def test_idor_download_file(self, client, app, sample_professional):
        """
        VULNERABILITY REPRODUCTION:
        Test that a patient CANNOT download another patient's file.
        """
        # 1. Create Patient A (Victim)
        with app.app_context():
            patient_a = Patient(
                email='victim@test.com',
                first_name='Victim',
                last_name='Patient',
                role='patient'
            )
            patient_a.set_password('Victim123')
            db.session.add(patient_a)
            db.session.commit()
            patient_a_id = patient_a.id

            # Create Medical Record for Patient A
            record_a = MedicalRecord(
                patient_id=patient_a_id,
                professional_id=sample_professional.id,
                chief_complaint='Victim complaint'
            )
            db.session.add(record_a)
            db.session.commit()

            # Create File for Patient A
            # Create actual temporary file
            import tempfile
            with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as tmp_file:
                tmp_file.write("SECRET DATA")
                tmp_path = tmp_file.name

            file_a = File(
                medical_record_id=record_a.id,
                filename='secret.txt',
                file_path=tmp_path,
                file_type='lab_result',
                mime_type='text/plain',
                file_size=11,
                storage_type='local'
            )
            db.session.add(file_a)
            db.session.commit()
            file_a_id = file_a.id

        # 2. Create Patient B (Attacker)
        with app.app_context():
            patient_b = Patient(
                email='attacker@test.com',
                first_name='Attacker',
                last_name='Patient',
                role='patient'
            )
            patient_b.set_password('Attacker123')
            db.session.add(patient_b)
            db.session.commit()

        # 3. Login as Patient B
        response = client.post('/api/auth/login', json={
            'email': 'attacker@test.com',
            'password': 'Attacker123'
        })
        token = response.json['access_token']
        attacker_headers = {'Authorization': f'Bearer {token}'}

        # 4. Attempt to download Patient A's file
        response = client.get(f'/api/files/{file_a_id}/download', headers=attacker_headers)

        # 5. Assert Access Denied (403)
        # If IDOR exists, this will return 200 and fail the test (which is what we want for reproduction)
        assert response.status_code == 403, "IDOR Vulnerability: Attacker could download victim's file!"

        # Cleanup
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
