# -*- coding: utf-8 -*-
"""
Tests for IDOR vulnerability in File Management
"""

import pytest
import io
import os
from app.models.file import File
from app.models.medical_record import MedicalRecord
from app.models.patient import Patient
from app.extensions import db


class TestFileIDOR:
    """Test IDOR vulnerabilities in file endpoints"""

    @pytest.fixture
    def victim_patient(self, app):
        """Create a victim patient"""
        with app.app_context():
            patient = Patient(
                email='victim@test.com',
                first_name='Victim',
                last_name='Patient',
                role='patient'
            )
            patient.set_password('Victim123')
            db.session.add(patient)
            db.session.commit()
            patient_id = patient.id
            db.session.expunge(patient)

        class PatientData:
            def __init__(self, id, email):
                self.id = id
                self.email = email
        return PatientData(patient_id, 'victim@test.com')

    @pytest.fixture
    def attacker_patient(self, app):
        """Create an attacker patient"""
        with app.app_context():
            patient = Patient(
                email='attacker@test.com',
                first_name='Attacker',
                last_name='Patient',
                role='patient'
            )
            patient.set_password('Attacker123')
            db.session.add(patient)
            db.session.commit()
            patient_id = patient.id
            db.session.expunge(patient)

        class PatientData:
            def __init__(self, id, email):
                self.id = id
                self.email = email
        return PatientData(patient_id, 'attacker@test.com')

    @pytest.fixture
    def attacker_headers(self, client, attacker_patient):
        """Get authentication headers for attacker"""
        response = client.post('/api/auth/login', json={
            'email': attacker_patient.email,
            'password': 'Attacker123'
        })
        token = response.json['access_token']
        return {'Authorization': f'Bearer {token}'}

    def test_idor_download_file(self, client, attacker_headers, victim_patient, sample_professional, app):
        """Test that an attacker can download a victim's file (Vulnerability Confirmation)"""

        # Create a file for the victim
        import tempfile
        with tempfile.NamedTemporaryFile(mode='wb', delete=False, suffix='.txt') as tmp_file:
            tmp_file.write(b"sensitive victim data")
            tmp_path = tmp_file.name

        try:
            with app.app_context():
                medical_record = MedicalRecord(
                    patient_id=victim_patient.id,
                    professional_id=sample_professional.id,
                    chief_complaint='Victim consultation'
                )
                db.session.add(medical_record)
                db.session.commit()

                file_record = File(
                    medical_record_id=medical_record.id,
                    filename='victim_sensitive.txt',
                    file_type='lab_result',
                    mime_type='text/plain',
                    file_size=20,
                    storage_type='local',
                    file_path=tmp_path,
                    uploaded_by=sample_professional.id
                )
                db.session.add(file_record)
                db.session.commit()
                file_id = file_record.id

            # Attacker attempts to download the file
            response = client.get(f'/api/files/{file_id}/download', headers=attacker_headers)

            # AFTER FIX: Should be 403 Forbidden
            assert response.status_code == 403
            assert b"Unauthorized access" in response.data

        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
