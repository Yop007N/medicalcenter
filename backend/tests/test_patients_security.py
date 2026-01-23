# -*- coding: utf-8 -*-
"""
Security Tests for Patient Endpoints (IDOR)
"""

import pytest
from app.models.patient import Patient
from app.extensions import db

class TestPatientSecurity:
    """Test security restrictions on patient endpoints"""

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
            def __init__(self, id):
                self.id = id

        return PatientData(patient_id)

    def test_patient_cannot_access_other_patient_data(self, client, patient_auth_headers, victim_patient):
        """
        Test that a patient (attacker) cannot access another patient's (victim) data.
        'patient_auth_headers' logs in as 'patient@test.com' (Attacker).
        'victim_patient' is 'victim@test.com' (Victim).
        """

        # 1. Try to access victim's profile
        response = client.get(f'/api/patients/{victim_patient.id}', headers=patient_auth_headers)
        assert response.status_code == 403, "Should not be able to view other patient's profile"

        # 2. Try to access victim's medical history
        response = client.get(f'/api/patients/{victim_patient.id}/medical-history', headers=patient_auth_headers)
        assert response.status_code == 403, "Should not be able to view other patient's medical history"

        # 3. Try to access victim's appointments
        response = client.get(f'/api/patients/{victim_patient.id}/appointments', headers=patient_auth_headers)
        assert response.status_code == 403, "Should not be able to view other patient's appointments"

        # 4. Try to access victim's medical records
        response = client.get(f'/api/patients/{victim_patient.id}/medical-records', headers=patient_auth_headers)
        assert response.status_code == 403, "Should not be able to view other patient's medical records"

        # 5. Try to access victim's budgets
        response = client.get(f'/api/patients/{victim_patient.id}/budgets', headers=patient_auth_headers)
        assert response.status_code == 403, "Should not be able to view other patient's budgets"

    def test_patient_cannot_list_all_patients(self, client, patient_auth_headers):
        """Test that a patient cannot list all patients"""
        response = client.get('/api/patients', headers=patient_auth_headers)
        assert response.status_code == 403, "Patient should not be able to list all patients"
