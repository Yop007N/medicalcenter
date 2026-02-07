# -*- coding: utf-8 -*-
"""
Security tests for Patient endpoints (IDOR)
"""

import pytest
from app.models.patient import Patient
from app.models.user import User
from app.extensions import db

class TestPatientIDOR:
    """Test IDOR vulnerabilities in patient endpoints"""

    @pytest.fixture
    def victim_patient(self, app):
        """Create a victim patient"""
        with app.app_context():
            user = Patient(
                email='victim@test.com',
                first_name='Victim',
                last_name='User',
                role='patient',
                medical_history='Secret Medical History'
            )
            user.set_password('password123')
            db.session.add(user)
            db.session.commit()
            user_id = user.id
            db.session.expunge(user)

        class UserData:
            def __init__(self, id):
                self.id = id
        return UserData(user_id)

    @pytest.fixture
    def attacker_patient_headers(self, client, app):
        """Create an attacker patient and get auth headers"""
        with app.app_context():
            user = Patient(
                email='attacker@test.com',
                first_name='Attacker',
                last_name='User',
                role='patient'
            )
            user.set_password('password123')
            db.session.add(user)
            db.session.commit()

        response = client.post('/api/auth/login', json={
            'email': 'attacker@test.com',
            'password': 'password123'
        })
        token = response.json['access_token']
        return {'Authorization': f'Bearer {token}'}

    @pytest.fixture
    def victim_patient_headers(self, client, victim_patient):
        """Get auth headers for the victim patient"""
        response = client.post('/api/auth/login', json={
            'email': 'victim@test.com',
            'password': 'password123'
        })
        token = response.json['access_token']
        return {'Authorization': f'Bearer {token}'}

    @pytest.fixture
    def professional_headers(self, client, sample_professional):
        """Get auth headers for a professional"""
        response = client.post('/api/auth/login', json={
            'email': 'testdoc@test.com',
            'password': 'Doctor123'
        })
        token = response.json['access_token']
        return {'Authorization': f'Bearer {token}'}

    def test_patient_access_own_data(self, client, victim_patient, victim_patient_headers):
        """Test that a patient can access their own data"""
        response = client.get(f'/api/patients/{victim_patient.id}', headers=victim_patient_headers)
        assert response.status_code == 200
        assert response.json['email'] == 'victim@test.com'

    def test_patient_access_other_data_idor(self, client, victim_patient, attacker_patient_headers):
        """Test that a patient CANNOT access another patient's data (IDOR prevention)"""
        response = client.get(f'/api/patients/{victim_patient.id}', headers=attacker_patient_headers)
        # This currently returns 200 (vulnerability exists), expecting 403 after fix
        assert response.status_code == 403

    def test_professional_access_patient_data(self, client, victim_patient, professional_headers):
        """Test that a professional can access any patient's data"""
        response = client.get(f'/api/patients/{victim_patient.id}', headers=professional_headers)
        assert response.status_code == 200
        assert response.json['email'] == 'victim@test.com'

    def test_patient_access_medical_history_idor(self, client, victim_patient, attacker_patient_headers):
        """Test IDOR on medical history endpoint"""
        response = client.get(f'/api/patients/{victim_patient.id}/medical-history', headers=attacker_patient_headers)
        assert response.status_code == 403

    def test_patient_access_appointments_idor(self, client, victim_patient, attacker_patient_headers):
        """Test IDOR on appointments endpoint"""
        response = client.get(f'/api/patients/{victim_patient.id}/appointments', headers=attacker_patient_headers)
        assert response.status_code == 403
