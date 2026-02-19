
import pytest
import io
import os
import tempfile
from app.models.user import User
from app.models.medical_record import MedicalRecord
from app.models.file import File
from app.extensions import db

class TestSecurityVulnerability:
    """Test security vulnerabilities"""

    def test_idor_vulnerability_file_access(self, client, app):
        """
        Verify that a patient CANNOT access another patient's file (IDOR).
        """
        tmp_path = None
        try:
            # 1. Setup: Create users and data
            with app.app_context():
                # Create Professional (uploader)
                professional = User(
                    email='doc_security@test.com',
                    first_name='Dr',
                    last_name='Security',
                    role='professional'
                )
                professional.set_password('Doc123')
                db.session.add(professional)

                # Create Patient A (victim)
                patient_a = User(
                    email='victim@test.com',
                    first_name='Victim',
                    last_name='Patient',
                    role='patient'
                )
                patient_a.set_password('Victim123')
                db.session.add(patient_a)

                # Create Patient B (attacker)
                patient_b = User(
                    email='attacker@test.com',
                    first_name='Attacker',
                    last_name='Patient',
                    role='patient'
                )
                patient_b.set_password('Attacker123')
                db.session.add(patient_b)
                db.session.commit()

                patient_a_id = patient_a.id
                prof_id = professional.id

                # Create Medical Record for Patient A
                medical_record = MedicalRecord(
                    patient_id=patient_a_id,
                    professional_id=prof_id,
                    chief_complaint='Confidential Issue'
                )
                db.session.add(medical_record)
                db.session.commit()

                # Create actual temporary file
                with tempfile.NamedTemporaryFile(mode='wb', delete=False, suffix='.pdf') as tmp_file:
                    tmp_file.write(b"CONFIDENTIAL PATIENT DATA")
                    tmp_path = tmp_file.name

                file_record = File(
                    medical_record_id=medical_record.id,
                    filename='confidential.pdf',
                    file_type='lab_result',
                    mime_type='application/pdf',
                    file_size=12,
                    storage_type='local',
                    file_path=tmp_path,
                    uploaded_by=prof_id
                )
                db.session.add(file_record)
                db.session.commit()
                file_id = file_record.id

            # 2. Log in as Patient B (Attacker)
            response = client.post('/api/auth/login', json={
                'email': 'attacker@test.com',
                'password': 'Attacker123'
            })
            assert response.status_code == 200
            token = response.json['access_token']
            headers = {'Authorization': f'Bearer {token}'}

            # 3. Patient B tries to download Patient A's file
            # This MUST FAIL with 403 Forbidden
            response = client.get(f'/api/files/{file_id}/download', headers=headers)

            assert response.status_code == 403, f"Expected 403 Forbidden, but got {response.status_code}"
            assert 'Unauthorized access' in response.get_json()['msg']

        finally:
            if tmp_path and os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except:
                    pass

    def test_patient_cannot_delete_file(self, client, app):
        """
        Verify that a patient cannot delete files (even their own).
        """
        tmp_path = None
        try:
            # 1. Setup: Create users and data
            with app.app_context():
                # Create Professional
                professional = User(
                    email='doc_del@test.com',
                    first_name='Dr',
                    last_name='Delete',
                    role='professional'
                )
                professional.set_password('Doc123')
                db.session.add(professional)

                # Create Patient
                patient = User(
                    email='patient_del@test.com',
                    first_name='Patient',
                    last_name='Delete',
                    role='patient'
                )
                patient.set_password('Patient123')
                db.session.add(patient)
                db.session.commit()

                patient_id = patient.id
                prof_id = professional.id

                # Create Medical Record for Patient
                medical_record = MedicalRecord(
                    patient_id=patient_id,
                    professional_id=prof_id,
                    chief_complaint='Issue'
                )
                db.session.add(medical_record)
                db.session.commit()

                # Create temporary file
                with tempfile.NamedTemporaryFile(mode='wb', delete=False, suffix='.pdf') as tmp_file:
                    tmp_file.write(b"DATA")
                    tmp_path = tmp_file.name

                file_record = File(
                    medical_record_id=medical_record.id,
                    filename='todelete.pdf',
                    file_type='lab_result',
                    mime_type='application/pdf',
                    file_size=4,
                    storage_type='local',
                    file_path=tmp_path,
                    uploaded_by=prof_id
                )
                db.session.add(file_record)
                db.session.commit()
                file_id = file_record.id

            # 2. Log in as Patient
            response = client.post('/api/auth/login', json={
                'email': 'patient_del@test.com',
                'password': 'Patient123'
            })
            token = response.json['access_token']
            headers = {'Authorization': f'Bearer {token}'}

            # 3. Patient tries to delete their own file
            # This MUST FAIL with 403 Forbidden (only professionals/admins can delete)
            response = client.delete(f'/api/files/{file_id}', headers=headers)

            assert response.status_code == 403, f"Expected 403 Forbidden, but got {response.status_code}"
            assert 'Unauthorized access' in response.get_json()['msg']

            # Verify file still exists in DB
            with app.app_context():
                 assert File.query.get(file_id) is not None

        finally:
            if tmp_path and os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except:
                    pass
