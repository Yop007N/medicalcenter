# -*- coding: utf-8 -*-
"""
Security Tests for File Management
"""

import pytest
import os
import io
from app.models.file import File
from app.models.medical_record import MedicalRecord
from app.models.patient import Patient
from app.models.professional import Professional
from app.extensions import db
from flask_jwt_extended import create_access_token

class TestFileIDOR:
    """Test IDOR vulnerabilities in file endpoints"""

    def test_patient_cannot_download_other_patient_file(self, client, patient_auth_headers, app):
        """
        Test that a patient (attacker) cannot download a file belonging to another patient (victim).
        The `patient_auth_headers` corresponds to `patient@test.com` (attacker).
        """
        import tempfile

        # Create a temporary file
        with tempfile.NamedTemporaryFile(mode='wb', delete=False, suffix='.pdf') as tmp_file:
            tmp_file.write(b"victim secret content")
            tmp_path = tmp_file.name

        try:
            with app.app_context():
                # Create a VICTIM patient
                victim = Patient(
                    email='victim@test.com',
                    first_name='Victim',
                    last_name='Patient',
                    role='patient'
                )
                victim.set_password('Victim123')
                db.session.add(victim)
                db.session.commit() # Commit to get ID

                # Create a professional (needed for medical record)
                prof = Professional(
                    email='doc@test.com',
                    first_name='Doc',
                    last_name='Tor',
                    role='professional',
                    license_number='DOC123'
                )
                prof.set_password('Doc123')
                db.session.add(prof)
                db.session.commit()

                # Create medical record for VICTIM
                medical_record = MedicalRecord(
                    patient_id=victim.id,
                    professional_id=prof.id,
                    chief_complaint='Victim consultation'
                )
                db.session.add(medical_record)
                db.session.commit()

                # Create file for VICTIM
                file_record = File(
                    medical_record_id=medical_record.id,
                    filename='victim_secret.pdf',
                    file_type='lab_result',
                    mime_type='application/pdf',
                    file_size=1024,
                    storage_type='local',
                    file_path=tmp_path,
                    uploaded_by=prof.id
                )
                db.session.add(file_record)
                db.session.commit()
                file_id = file_record.id

            # Now, as the ATTACKER (patient_auth_headers), try to download the victim's file
            # The attacker is 'patient@test.com' created in conftest.py

            response = client.get(f'/api/files/{file_id}/download', headers=patient_auth_headers)

            # This should be 403 Forbidden
            # Currently expected to FAIL (return 200) until fixed
            assert response.status_code == 403

        finally:
             if os.path.exists(tmp_path):
                os.remove(tmp_path)
