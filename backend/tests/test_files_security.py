# -*- coding: utf-8 -*-
"""
Security tests for Files endpoints
"""

import os
import tempfile
from app.models.patient import Patient
from app.models.medical_record import MedicalRecord
from app.models.file import File
from app.models.professional import Professional
from app.extensions import db


class TestFileSecurity:
    """Test file security checks"""

    def test_idor_vulnerability(self, client, app):
        """
        Reproduce IDOR vulnerability: Patient2 can access Patient1's file.
        """
        with app.app_context():
            # Create Professional
            prof = Professional(
                email='doc@test.com',
                first_name='Doc',
                last_name='Tor',
                role='professional',
                license_number='123',
                specialty='Gen'
            )
            prof.set_password('Doc123')
            db.session.add(prof)
            db.session.commit()
            prof_id = prof.id

            # Create Patient 1
            p1 = Patient(
                email='p1@test.com',
                first_name='P1',
                last_name='Test',
                role='patient'
            )
            p1.set_password('Pass123')
            db.session.add(p1)
            db.session.commit()
            p1_id = p1.id

            # Create Patient 2
            p2 = Patient(
                email='p2@test.com',
                first_name='P2',
                last_name='Test',
                role='patient'
            )
            p2.set_password('Pass123')
            db.session.add(p2)
            db.session.commit()

            # Create Medical Record for Patient 1
            mr = MedicalRecord(
                patient_id=p1_id,
                professional_id=prof_id,
                chief_complaint='Test'
            )
            db.session.add(mr)
            db.session.commit()
            mr_id = mr.id

            # Create File for Patient 1
            # Create actual temporary file
            with tempfile.NamedTemporaryFile(mode='wb', delete=False, suffix='.txt') as tmp_file:
                tmp_file.write(b"SECRET DATA")
                tmp_path = tmp_file.name

            file_record = File(
                medical_record_id=mr_id,
                filename='secret.txt',
                file_type='lab_result',
                mime_type='text/plain',
                file_size=11,
                storage_type='local',
                file_path=tmp_path,
                uploaded_by=prof_id
            )
            db.session.add(file_record)
            db.session.commit()
            file_id = file_record.id

        # Authenticate as Patient 2
        resp = client.post('/api/auth/login', json={
            'email': 'p2@test.com',
            'password': 'Pass123'
        })
        token = resp.json['access_token']
        headers = {'Authorization': f'Bearer {token}'}

        # Try to download Patient 1's file
        response = client.get(
            f'/api/files/{file_id}/download',
            headers=headers
        )

        # Clean up
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

        # Assertion to confirm vulnerability is fixed
        assert response.status_code == 403
        assert b"Access denied" in response.data
