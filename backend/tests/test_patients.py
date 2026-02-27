# -*- coding: utf-8 -*-
"""
Patient CRUD Tests
"""

import pytest
from datetime import date
from app.models.patient import Patient
from app.models.professional_patient_assignment import ProfessionalPatientAssignment
from app.extensions import db


class TestListPatients:
    """Test list patients endpoint"""

    def test_list_patients_success(self, client, admin_auth_headers, app):
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

        response = client.get('/api/patients', headers=admin_auth_headers)

        assert response.status_code == 200
        data = response.json
        assert isinstance(data, list)

    def test_list_patients_with_search(self, client, admin_auth_headers, app):
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

        response = client.get('/api/patients?q=SearchMe', headers=admin_auth_headers)

        assert response.status_code == 200
        data = response.json
        assert isinstance(data, list)

    def test_list_patients_payload_includes_frontend_defaults(self, client, admin_auth_headers, app):
        """Test list payload exposes frontend expected fields."""
        with app.app_context():
            patient = Patient(
                email='defaults@test.com',
                first_name='Default',
                last_name='Patient',
                role='patient'
            )
            patient.set_password('Patient123')
            db.session.add(patient)
            db.session.commit()

        response = client.get('/api/patients', headers=admin_auth_headers)

        assert response.status_code == 200
        data = response.json
        assert isinstance(data, list)
        item = next((row for row in data if row['email'] == 'defaults@test.com'), None)
        assert item is not None
        assert 'is_active' in item
        assert 'notes' in item
        assert 'insurance_provider' in item
        assert 'insurance_number' in item

    def test_list_patients_unauthorized(self, client):
        """Test listing patients without authentication"""
        response = client.get('/api/patients')
        assert response.status_code == 401

    def test_professional_list_patients_only_in_assigned_scope(
        self,
        client,
        auth_headers,
        app,
        sample_professional,
    ):
        """Test professional list returns only explicitly assigned patients."""
        with app.app_context():
            linked_patient = Patient(
                email='linked@test.com',
                first_name='Linked',
                last_name='Patient',
                role='patient',
            )
            linked_patient.set_password('Patient123')

            unlinked_patient = Patient(
                email='unlinked@test.com',
                first_name='Unlinked',
                last_name='Patient',
                role='patient',
            )
            unlinked_patient.set_password('Patient123')

            db.session.add(linked_patient)
            db.session.add(unlinked_patient)
            db.session.commit()

            db.session.add(
                ProfessionalPatientAssignment(
                    professional_id=sample_professional.id,
                    patient_id=linked_patient.id,
                )
            )
            db.session.commit()
            linked_id = linked_patient.id
            unlinked_id = unlinked_patient.id

        response = client.get('/api/patients', headers=auth_headers)

        assert response.status_code == 200
        listed_ids = {item['id'] for item in response.json}
        assert linked_id in listed_ids
        assert unlinked_id not in listed_ids

    def test_professional_list_patients_filtered_by_specialty_key(
        self,
        client,
        auth_headers,
        app,
        sample_professional,
    ):
        """Test professional scope can be narrowed by specialty_key."""
        with app.app_context():
            cardiology_patient = Patient(
                email='cardio-linked@test.com',
                first_name='Cardio',
                last_name='Linked',
                role='patient',
            )
            cardiology_patient.set_password('Patient123')

            odontology_patient = Patient(
                email='odonto-linked@test.com',
                first_name='Odonto',
                last_name='Linked',
                role='patient',
            )
            odontology_patient.set_password('Patient123')

            db.session.add(cardiology_patient)
            db.session.add(odontology_patient)
            db.session.commit()

            db.session.add(
                ProfessionalPatientAssignment(
                    professional_id=sample_professional.id,
                    patient_id=cardiology_patient.id,
                    specialty_key='cardiology',
                )
            )
            db.session.add(
                ProfessionalPatientAssignment(
                    professional_id=sample_professional.id,
                    patient_id=odontology_patient.id,
                    specialty_key='odontology',
                )
            )
            db.session.commit()
            cardiology_id = cardiology_patient.id
            odontology_id = odontology_patient.id

        response = client.get('/api/patients?specialty_key=cardiology', headers=auth_headers)

        assert response.status_code == 200
        listed_ids = {item['id'] for item in response.json}
        assert cardiology_id in listed_ids
        assert odontology_id not in listed_ids


class TestGetPatient:
    """Test get patient endpoint"""

    def test_get_patient_success(self, client, admin_auth_headers, app):
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

        response = client.get(f'/api/patients/{patient_id}', headers=admin_auth_headers)

        assert response.status_code == 200
        data = response.json
        assert data['email'] == 'getpat@test.com'
        assert data['blood_type'] == 'O+'

    def test_get_patient_not_found(self, client, admin_auth_headers):
        """Test getting non-existent patient"""
        response = client.get('/api/patients/99999', headers=admin_auth_headers)
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

    def test_create_patient_assigns_to_current_professional(self, client, auth_headers, app, sample_professional):
        """Test professional-created patient is assigned to professional scope."""
        response = client.post('/api/patients', headers=auth_headers, json={
            'email': 'scoped-patient@test.com',
            'password': 'Patient123',
            'first_name': 'Scoped',
            'last_name': 'Patient'
        })
        assert response.status_code == 201
        patient_id = response.json['id']

        with app.app_context():
            assignment = ProfessionalPatientAssignment.query.filter_by(
                professional_id=sample_professional.id,
                patient_id=patient_id,
            ).first()
            assert assignment is not None
            assert assignment.specialty_key is not None

        scoped_list_response = client.get('/api/patients?q=scoped-patient@test.com', headers=auth_headers)
        assert scoped_list_response.status_code == 200
        assert any(item['id'] == patient_id for item in scoped_list_response.json)

    def test_create_patient_then_login_with_new_credentials(self, client, auth_headers):
        """Create flow should produce valid credentials for patient login."""
        response = client.post('/api/patients', headers=auth_headers, json={
            'email': 'new-login-patient@test.com',
            'password': 'Patient123',
            'first_name': 'New',
            'last_name': 'Login',
        })
        assert response.status_code == 201
        patient_id = response.json['id']

        login_response = client.post('/api/auth/login', json={
            'email': 'new-login-patient@test.com',
            'password': 'Patient123',
        })
        assert login_response.status_code == 200
        token = login_response.json.get('access_token')
        assert token

        patient_headers = {'Authorization': f'Bearer {token}'}
        own_profile_response = client.get(f'/api/patients/{patient_id}', headers=patient_headers)
        assert own_profile_response.status_code == 200
        assert own_profile_response.json['email'] == 'new-login-patient@test.com'

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

    def test_update_patient_success(self, client, admin_auth_headers, app):
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

        response = client.put(f'/api/patients/{patient_id}', headers=admin_auth_headers, json={
            'phone': '222-2222',
            'blood_type': 'B-',
            'allergies': 'Peanuts'
        })

        assert response.status_code == 200
        data = response.json
        assert data['phone'] == '222-2222'
        assert data['blood_type'] == 'B-'
        assert data['allergies'] == 'Peanuts'

    def test_update_patient_not_found(self, client, admin_auth_headers):
        """Test updating non-existent patient"""
        response = client.put('/api/patients/99999', headers=admin_auth_headers, json={
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

    def test_update_patient_invalid_date_format(self, client, admin_auth_headers, app):
        """Test update rejects invalid date format."""
        with app.app_context():
            patient = Patient(
                email='invalid-date@test.com',
                first_name='Date',
                last_name='Invalid',
                role='patient'
            )
            patient.set_password('Patient123')
            db.session.add(patient)
            db.session.commit()
            patient_id = patient.id

        response = client.put(f'/api/patients/{patient_id}', headers=admin_auth_headers, json={
            'date_of_birth': '20/01/1990'
        })

        assert response.status_code == 400

    def test_update_patient_is_active_flag(self, client, admin_auth_headers, app):
        """Test update supports is_active for frontend compatibility."""
        with app.app_context():
            patient = Patient(
                email='active-flag@test.com',
                first_name='Active',
                last_name='Flag',
                role='patient',
                is_active=True
            )
            patient.set_password('Patient123')
            db.session.add(patient)
            db.session.commit()
            patient_id = patient.id

        response = client.put(f'/api/patients/{patient_id}', headers=admin_auth_headers, json={
            'is_active': False
        })

        assert response.status_code == 200
        assert response.json['is_active'] is False


class TestDeletePatient:
    """Test delete patient endpoint"""

    def test_delete_patient_success(self, client, admin_auth_headers, app):
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

        response = client.delete(f'/api/patients/{patient_id}', headers=admin_auth_headers)

        assert response.status_code == 200

    def test_delete_patient_not_found(self, client, admin_auth_headers):
        """Test deleting non-existent patient"""
        response = client.delete('/api/patients/99999', headers=admin_auth_headers)
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


class TestPatientCrudWorkflow:
    """End-to-end CRUD validation for patients API."""

    def test_patient_crud_end_to_end(self, client, auth_headers):
        """Validate create -> list/get -> update -> delete -> not found flow."""
        create_response = client.post('/api/patients', headers=auth_headers, json={
            'email': 'flow-patient@test.com',
            'password': 'Patient123',
            'first_name': 'Flow',
            'last_name': 'Patient',
            'date_of_birth': '1992-06-15',
            'phone': '555-0101',
            'blood_type': 'A+'
        })

        assert create_response.status_code == 201
        created_patient = create_response.json
        patient_id = created_patient['id']
        assert created_patient['email'] == 'flow-patient@test.com'
        assert created_patient['phone'] == '555-0101'

        get_response = client.get(f'/api/patients/{patient_id}', headers=auth_headers)
        assert get_response.status_code == 200
        assert get_response.json['id'] == patient_id

        list_response = client.get('/api/patients', headers=auth_headers)
        assert list_response.status_code == 200
        assert any(row['id'] == patient_id for row in list_response.json)

        update_response = client.put(f'/api/patients/{patient_id}', headers=auth_headers, json={
            'phone': '555-9999',
            'blood_type': 'B-',
            'is_active': False
        })

        assert update_response.status_code == 200
        updated_patient = update_response.json
        assert updated_patient['phone'] == '555-9999'
        assert updated_patient['blood_type'] == 'B-'
        assert updated_patient['is_active'] is False

        delete_response = client.delete(f'/api/patients/{patient_id}', headers=auth_headers)
        assert delete_response.status_code == 200
        assert delete_response.json['msg'] == 'Patient deleted'

        not_found_response = client.get(f'/api/patients/{patient_id}', headers=auth_headers)
        assert not_found_response.status_code == 404

        post_delete_list_response = client.get('/api/patients?q=flow-patient@test.com', headers=auth_headers)
        assert post_delete_list_response.status_code == 200
        assert not any(row['id'] == patient_id for row in post_delete_list_response.json)


class TestPatientSecurity:
    """Test security aspects of patient endpoints"""

    def test_patient_cannot_access_other_patient(self, client, patient_auth_headers, app):
        """Test that a patient cannot access another patient's data (IDOR)"""
        with app.app_context():
            # Create a victim patient
            victim = Patient(
                email='victim@test.com',
                first_name='Victim',
                last_name='User',
                role='patient',
                medical_history='Secret'
            )
            victim.set_password('Victim123')
            db.session.add(victim)
            db.session.commit()
            victim_id = victim.id

        # Try to access victim's profile using another patient's token (patient_auth_headers)
        response = client.get(f'/api/patients/{victim_id}', headers=patient_auth_headers)

        # Should be forbidden
        assert response.status_code == 403

    def test_patient_can_access_own_profile(self, client, app):
        """Test that a patient can access their own profile"""
        with app.app_context():
            patient = Patient(
                email='ownprofile@test.com',
                first_name='Own',
                last_name='Profile',
                role='patient'
            )
            patient.set_password('Patient123')
            db.session.add(patient)
            db.session.commit()
            patient_id = patient.id
            patient_email = patient.email

        # Login
        response = client.post('/api/auth/login', json={
            'email': patient_email,
            'password': 'Patient123'
        })
        token = response.json['access_token']
        headers = {'Authorization': f'Bearer {token}'}

        response = client.get(f'/api/patients/{patient_id}', headers=headers)
        assert response.status_code == 200
        assert response.json['id'] == patient_id

    def test_professional_cannot_access_unlinked_patient(self, client, auth_headers, app):
        """Test that a professional cannot access patients outside explicit scope."""
        with app.app_context():
            patient = Patient(
                email='anypat@test.com',
                first_name='Any',
                last_name='Patient',
                role='patient'
            )
            patient.set_password('Patient123')
            db.session.add(patient)
            db.session.commit()
            patient_id = patient.id

        response = client.get(f'/api/patients/{patient_id}', headers=auth_headers)
        assert response.status_code == 403

    def test_professional_can_access_assigned_patient(self, client, auth_headers, app, sample_professional):
        """Test that a professional can access explicitly assigned patient."""
        with app.app_context():
            patient = Patient(
                email='assignedpat@test.com',
                first_name='Assigned',
                last_name='Patient',
                role='patient'
            )
            patient.set_password('Patient123')
            db.session.add(patient)
            db.session.commit()
            patient_id = patient.id

            assignment = ProfessionalPatientAssignment(
                professional_id=sample_professional.id,
                patient_id=patient_id,
            )
            db.session.add(assignment)
            db.session.commit()

        response = client.get(f'/api/patients/{patient_id}', headers=auth_headers)
        assert response.status_code == 200
