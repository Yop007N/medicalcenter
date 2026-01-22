# -*- coding: utf-8 -*-
"""
Reproduction script for IDOR vulnerability in Patient endpoints
"""

import pytest
from app.models.patient import Patient
from app.extensions import db

class TestIDORVulnerability:
    """Test case to demonstrate IDOR vulnerability"""

    def test_patient_access_controls(self, client, app):
        """
        Verify that a patient cannot access another patient's data or list all patients.

        Steps:
        1. Create victim patient
        2. Create attacker patient
        3. Login as attacker
        4. Try to access victim's profile -> Should be 403
        5. Try to list all patients -> Should be 403
        6. Try to access sub-resources -> Should be 403
        """

        # 1. Create victim patient
        with app.app_context():
            victim = Patient(
                email='victim@test.com',
                first_name='Victim',
                last_name='User',
                role='patient',
                phone='111111111',
                medical_history='SENSITIVE MEDICAL HISTORY: HIV Positive'
            )
            victim.set_password('Victim123')
            db.session.add(victim)
            db.session.commit()
            victim_id = victim.id

        # 2. Create attacker patient
        with app.app_context():
            attacker = Patient(
                email='attacker@test.com',
                first_name='Attacker',
                last_name='User',
                role='patient',
                phone='222222222'
            )
            attacker.set_password('Attacker123')
            db.session.add(attacker)
            db.session.commit()

        # 3. Login as attacker
        response = client.post('/api/auth/login', json={
            'email': 'attacker@test.com',
            'password': 'Attacker123'
        })
        token = response.json['access_token']
        attacker_headers = {'Authorization': f'Bearer {token}'}

        # 4. Try to access victim's profile
        print("Testing get_patient...")
        response = client.get(f'/api/patients/{victim_id}', headers=attacker_headers)
        assert response.status_code == 403
        assert response.json['msg'] == 'Unauthorized'

        # 5. Try to list all patients
        print("Testing list_patients...")
        response = client.get('/api/patients', headers=attacker_headers)
        assert response.status_code == 403
        assert response.json['msg'] == 'Unauthorized'

        # 6. Try to access sub-resources
        sub_resources = [
            'medical-history',
            'appointments',
            'medical-records',
            'budgets'
        ]

        for resource in sub_resources:
            print(f"Testing {resource}...")
            response = client.get(f'/api/patients/{victim_id}/{resource}', headers=attacker_headers)
            assert response.status_code == 403
            assert response.json['msg'] == 'Unauthorized'
