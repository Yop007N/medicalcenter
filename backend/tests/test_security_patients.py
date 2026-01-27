# -*- coding: utf-8 -*-
"""
Reproduction script for IDOR vulnerability in Patients API
"""

import pytest
from app.models.patient import Patient
from app.extensions import db

class TestPatientIDOR:
    """Test IDOR vulnerability in patient endpoints"""

    @pytest.fixture
    def victim_patient(self, app):
        """Create a victim patient"""
        with app.app_context():
            patient = Patient(
                email='victim@test.com',
                first_name='Victim',
                last_name='Patient',
                role='patient',
                phone='123456789'
            )
            patient.set_password('Victim123')
            db.session.add(patient)
            db.session.commit()

            # Re-query to get ID and ensure session state is clean
            p = Patient.query.filter_by(email='victim@test.com').first()
            patient_data = {
                'id': p.id,
                'email': p.email
            }
            return patient_data

    @pytest.fixture
    def attacker_headers(self, client, app):
        """Create an attacker patient and login to get headers"""
        with app.app_context():
            patient = Patient(
                email='attacker@test.com',
                first_name='Attacker',
                last_name='Patient',
                role='patient',
                phone='987654321'
            )
            patient.set_password('Attacker123')
            db.session.add(patient)
            db.session.commit()

        # Login
        response = client.post('/api/auth/login', json={
            'email': 'attacker@test.com',
            'password': 'Attacker123'
        })
        token = response.json['access_token']
        return {'Authorization': f'Bearer {token}'}

    def test_get_other_patient_details(self, client, attacker_headers, victim_patient):
        """
        VULNERABILITY CHECK: Attacker (patient) accessing Victim (patient) details.
        EXPECTED: 403 Forbidden (Fixed)
        """
        response = client.get(f'/api/patients/{victim_patient["id"]}', headers=attacker_headers)

        # This asserts that the vulnerability is FIXED
        assert response.status_code == 403
        assert response.json['msg'] == 'Unauthorized'

    def test_get_own_patient_details(self, client, attacker_headers, app):
        """
        HAPPY PATH: Patient accessing their OWN details.
        EXPECTED: 200 OK
        """
        # Get attacker's ID from the database
        with app.app_context():
            attacker = Patient.query.filter_by(email='attacker@test.com').first()
            attacker_id = attacker.id

        response = client.get(f'/api/patients/{attacker_id}', headers=attacker_headers)

        assert response.status_code == 200
        data = response.json
        assert data['email'] == 'attacker@test.com'

    def test_get_other_patient_medical_history(self, client, attacker_headers, victim_patient):
        """
        VULNERABILITY CHECK: Attacker accessing Victim's medical history
        EXPECTED: 403 Forbidden (Fixed)
        """
        response = client.get(f'/api/patients/{victim_patient["id"]}/medical-history', headers=attacker_headers)

        # This asserts that the vulnerability is FIXED
        assert response.status_code == 403
        assert response.json['msg'] == 'Unauthorized'

    def test_get_other_patient_appointments(self, client, attacker_headers, victim_patient):
        """
        VULNERABILITY CHECK: Attacker accessing Victim's appointments
        EXPECTED: 403 Forbidden (Fixed)
        """
        response = client.get(f'/api/patients/{victim_patient["id"]}/appointments', headers=attacker_headers)

        # This asserts that the vulnerability is FIXED
        assert response.status_code == 403
        assert response.json['msg'] == 'Unauthorized'
