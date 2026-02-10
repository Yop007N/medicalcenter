# -*- coding: utf-8 -*-
"""
Patient CRUD Tests
"""

import pytest
from datetime import date
from app.models.patient import Patient
from app.extensions import db


class TestListPatients:
    """Test list patients endpoint"""

    def test_list_patients_success(self, client, auth_headers, app):
        """Test listing all patients"""
        with app.app_context():
            patient = Patient(
                email='pat1@test.com',
                first_name='Patient',
                last_name='One',
                role='patient',
                date_of_birth=date(1990, 1, 1),
                phone='123456789'
            )
            patient.set_password('Patient123')
            db.session.add(patient)
            db.session.commit()

        response = client.get('/api/patients', headers=auth_headers)

        assert response.status_code == 200
        data = response.json
        assert isinstance(data, list)

    def test_list_patients_with_search(self, client, auth_headers, app):
        """Test listing patients with search query"""
        with app.app_context():
            patient = Patient(
                email='searchme@test.com',
                first_name='SearchMe',
                last_name='Patient',
                role='patient',
                phone='987654321'
            )
            patient.set_password('Patient123')
            db.session.add(patient)
            db.session.commit()

        response = client.get('/api/patients?q=SearchMe', headers=auth_headers)

        assert response.status_code == 200
        data = response.json
        assert isinstance(data, list)

    def test_list_patients_unauthorized(self, client):
        """Test listing patients without authentication"""
        response = client.get('/api/patients')
        assert response.status_code == 401


class TestGetPatient:
    """Test get patient endpoint"""

    def test_get_patient_success(self, client, auth_headers, app):
        """Test getting a patient by ID"""
        with app.app_context():
            patient = Patient(
                email='getpat@test.com',
                first_name='Get',
                last_name='Patient',
                role='patient',
                date_of_birth=date(1985, 5, 15),
                blood_type='O+'
            )
            patient.set_password('Patient123')
            db.session.add(patient)
            db.session.commit()
            patient_id = patient.id

        response = client.get(f'/api/patients/{patient_id}', headers=auth_headers)

        assert response.status_code == 200
        data = response.json
        assert data['email'] == 'getpat@test.com'
        assert data['blood_type'] == 'O+'

    def test_get_patient_not_found(self, client, auth_headers):
        """Test getting non-existent patient"""
        response = client.get('/api/patients/99999', headers=auth_headers)
        assert response.status_code == 404

    def test_get_patient_unauthorized(self, client, app):
        """Test getting patient without authentication"""
        with app.app_context():
            patient = Patient(
                email='unauth@test.com',
                first_name='Unauth',
                last_name='Patient',
                role='patient'
            )
            patient.set_password('Patient123')
            db.session.add(patient)
            db.session.commit()
            patient_id = patient.id

        response = client.get(f'/api/patients/{patient_id}')
        assert response.status_code == 401

    def test_get_patient_forbidden(self, client, app):
        """Test patient accessing another patient's data (IDOR)"""
        with app.app_context():
            # Create victim
            victim = Patient(
                email='victim@test.com',
                first_name='Victim',
                last_name='Patient',
                role='patient'
            )
            victim.set_password('Victim123')
            db.session.add(victim)
            db.session.commit()

            # Create attacker
            attacker = Patient(
                email='attacker@test.com',
                first_name='Attacker',
                last_name='Patient',
                role='patient'
            )
            attacker.set_password('Attacker123')
            db.session.add(attacker)
            db.session.commit()

            victim_id = victim.id
            attacker_email = attacker.email

        # Login as attacker
        response = client.post('/api/auth/login', json={
            'email': attacker_email,
            'password': 'Attacker123'
        })
        token = response.json['access_token']
        headers = {'Authorization': f'Bearer {token}'}

        # Try to access victim's profile
        response = client.get(f'/api/patients/{victim_id}', headers=headers)

        assert response.status_code == 403


class TestCreatePatient:
    """Test create patient endpoint"""

    def test_create_patient_success(self, client, auth_headers):
        """Test creating a new patient"""
        response = client.post('/api/patients', headers=auth_headers, json={
            'email': 'newpat@test.com',
            'password': 'Patient123',
            'first_name': 'New',
            'last_name': 'Patient',
            'date_of_birth': '1995-03-20',
            'phone': '555-1234',
            'blood_type': 'A+'
        })

        assert response.status_code == 201
        data = response.json
        assert data['email'] == 'newpat@test.com'
        assert data['blood_type'] == 'A+'

    def test_create_patient_duplicate_email(self, client, auth_headers, app):
        """Test creating patient with duplicate email"""
        with app.app_context():
            patient = Patient(
                email='duplicate@test.com',
                first_name='Existing',
                last_name='Patient',
                role='patient'
            )
            patient.set_password('Patient123')
            db.session.add(patient)
            db.session.commit()

        response = client.post('/api/patients', headers=auth_headers, json={
            'email': 'duplicate@test.com',
            'password': 'Patient123',
            'first_name': 'Another',
            'last_name': 'Patient'
        })

        assert response.status_code in [400, 409]

    def test_create_patient_missing_fields(self, client, auth_headers):
        """Test creating patient without required fields"""
        response = client.post('/api/patients', headers=auth_headers, json={
            'email': 'incomplete@test.com'
        })

        assert response.status_code == 400

    def test_create_patient_weak_password(self, client, auth_headers):
        """Test creating patient with weak password"""
        response = client.post('/api/patients', headers=auth_headers, json={
            'email': 'weak@test.com',
            'password': 'weak',
            'first_name': 'Weak',
            'last_name': 'Pass'
        })

        assert response.status_code == 400

    def test_create_patient_unauthorized(self, client):
        """Test creating patient without authentication"""
        response = client.post('/api/patients', json={
            'email': 'noauth@test.com',
            'password': 'Patient123',
            'first_name': 'No',
            'last_name': 'Auth'
        })

        assert response.status_code == 401


class TestUpdatePatient:
    """Test update patient endpoint"""

    def test_update_patient_success(self, client, auth_headers, app):
        """Test updating a patient"""
        with app.app_context():
            patient = Patient(
                email='update@test.com',
                first_name='Update',
                last_name='Me',
                role='patient',
                phone='111-1111'
            )
            patient.set_password('Patient123')
            db.session.add(patient)
            db.session.commit()
            patient_id = patient.id

        response = client.put(f'/api/patients/{patient_id}', headers=auth_headers, json={
            'phone': '222-2222',
            'blood_type': 'B-',
            'allergies': 'Peanuts'
        })

        assert response.status_code == 200
        data = response.json
        assert data['phone'] == '222-2222'
        assert data['blood_type'] == 'B-'
        assert data['allergies'] == 'Peanuts'

    def test_update_patient_not_found(self, client, auth_headers):
        """Test updating non-existent patient"""
        response = client.put('/api/patients/99999', headers=auth_headers, json={
            'phone': '333-3333'
        })

        assert response.status_code == 404

    def test_update_patient_unauthorized(self, client, app):
        """Test updating patient without authentication"""
        with app.app_context():
            patient = Patient(
                email='noupdate@test.com',
                first_name='No',
                last_name='Update',
                role='patient'
            )
            patient.set_password('Patient123')
            db.session.add(patient)
            db.session.commit()
            patient_id = patient.id

        response = client.put(f'/api/patients/{patient_id}', json={
            'phone': '444-4444'
        })

        assert response.status_code == 401


class TestDeletePatient:
    """Test delete patient endpoint"""

    def test_delete_patient_success(self, client, auth_headers, app):
        """Test deleting a patient"""
        with app.app_context():
            patient = Patient(
                email='delete@test.com',
                first_name='Delete',
                last_name='Me',
                role='patient'
            )
            patient.set_password('Patient123')
            db.session.add(patient)
            db.session.commit()
            patient_id = patient.id

        response = client.delete(f'/api/patients/{patient_id}', headers=auth_headers)

        assert response.status_code == 200

    def test_delete_patient_not_found(self, client, auth_headers):
        """Test deleting non-existent patient"""
        response = client.delete('/api/patients/99999', headers=auth_headers)
        assert response.status_code == 404

    def test_delete_patient_unauthorized(self, client, app):
        """Test deleting patient without authentication"""
        with app.app_context():
            patient = Patient(
                email='nodelete@test.com',
                first_name='No',
                last_name='Delete',
                role='patient'
            )
            patient.set_password('Patient123')
            db.session.add(patient)
            db.session.commit()
            patient_id = patient.id

        response = client.delete(f'/api/patients/{patient_id}')

        assert response.status_code == 401
