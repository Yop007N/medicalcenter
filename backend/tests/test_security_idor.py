# -*- coding: utf-8 -*-
"""
Reproduction script for IDOR vulnerability
"""

import pytest
from app.models.patient import Patient
from app.models.professional import Professional
from app.models.medical_record import MedicalRecord
from app.extensions import db
from datetime import date

class TestIDOR:
    """Test IDOR vulnerabilities"""

    def test_patient_access_other_patient_history(self, client, app):
        """Test that a patient cannot access another patient's medical history"""

        # 1. Setup users
        with app.app_context():
            # Professional (needed for medical record)
            prof = Professional(
                email='doc@test.com',
                first_name='Doctor',
                last_name='Who',
                role='professional',
                license_number='DOC123',
                specialty='General'
            )
            prof.set_password('Doc123')
            db.session.add(prof)
            db.session.commit()
            prof_id = prof.id

            # Victim
            victim = Patient(
                email='victim@test.com',
                first_name='Victim',
                last_name='Patient',
                role='patient',
                date_of_birth=date(1990, 1, 1)
            )
            victim.set_password('Victim123')
            db.session.add(victim)
            db.session.commit()
            victim_id = victim.id

            # Create medical record for victim
            record = MedicalRecord(
                patient_id=victim_id,
                professional_id=prof_id,
                diagnosis='Sensitive Diagnosis',
                treatment='Sensitive Treatment',
                record_date=date(2023, 1, 1)
            )
            db.session.add(record)

            # Attacker
            attacker = Patient(
                email='attacker@test.com',
                first_name='Attacker',
                last_name='Patient',
                role='patient',
                date_of_birth=date(1990, 1, 1)
            )
            attacker.set_password('Attacker123')
            db.session.add(attacker)
            db.session.commit()
            attacker_id = attacker.id

        # 2. Login as Attacker
        response = client.post('/api/auth/login', json={
            'email': 'attacker@test.com',
            'password': 'Attacker123'
        })
        token = response.json['access_token']
        headers = {'Authorization': f'Bearer {token}'}

        # 3. Try to access Victim's history
        response = client.get(f'/api/patients/{victim_id}/medical-history', headers=headers)

        # 4. Assertions
        # CURRENTLY: This returns 200 (Vulnerability exists)
        # DESIRED: This should return 403

        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("VULNERABILITY CONFIRMED: Attacker accessed Victim's history")
            assert False, "IDOR Vulnerability exists! Patient can access another patient's history."

        assert response.status_code == 403

    def test_patient_access_own_history(self, client, app):
        """Test that a patient CAN access their own medical history"""

        # 1. Setup users
        with app.app_context():
            # Professional (needed for medical record)
            prof = Professional(
                email='doc2@test.com',
                first_name='Doctor',
                last_name='Who',
                role='professional',
                license_number='DOC456',
                specialty='General'
            )
            prof.set_password('Doc123')
            db.session.add(prof)
            db.session.commit()
            prof_id = prof.id

            # Patient
            patient = Patient(
                email='patient_own@test.com',
                first_name='Own',
                last_name='Patient',
                role='patient',
                date_of_birth=date(1990, 1, 1)
            )
            patient.set_password('Patient123')
            db.session.add(patient)
            db.session.commit()
            patient_id = patient.id

            # Create medical record for patient
            record = MedicalRecord(
                patient_id=patient_id,
                professional_id=prof_id,
                diagnosis='My Diagnosis',
                treatment='My Treatment',
                record_date=date(2023, 1, 1)
            )
            db.session.add(record)
            db.session.commit()

        # 2. Login as Patient
        response = client.post('/api/auth/login', json={
            'email': 'patient_own@test.com',
            'password': 'Patient123'
        })
        token = response.json['access_token']
        headers = {'Authorization': f'Bearer {token}'}

        # 3. Try to access OWN history
        response = client.get(f'/api/patients/{patient_id}/medical-history', headers=headers)

        # 4. Assertions
        assert response.status_code == 200
        data = response.json
        assert len(data) > 0
        assert data[0]['diagnosis'] == 'My Diagnosis'
