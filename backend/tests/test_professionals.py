# -*- coding: utf-8 -*-
"""
Professional CRUD Tests
"""

import pytest
from datetime import datetime, timedelta

from app.models.appointment import Appointment
from app.models.professional import Professional
from app.extensions import db


class TestListProfessionals:
    """Test list professionals endpoint"""

    def test_list_professionals_success(self, client, auth_headers, app):
        """Test listing all professionals"""
        # Create a professional for testing
        with app.app_context():
            prof = Professional(
                email='doctor1@test.com',
                first_name='Doctor',
                last_name='One',
                role='professional',
                license_number='LIC123',
                specialty='Cardiology'
            )
            prof.set_password('Doctor123')
            db.session.add(prof)
            db.session.commit()

        response = client.get('/api/professionals', headers=auth_headers)

        assert response.status_code == 200
        data = response.json
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_list_professionals_with_specialty_filter(self, client, auth_headers, app):
        """Test listing professionals filtered by specialty"""
        with app.app_context():
            prof = Professional(
                email='cardio@test.com',
                first_name='Cardio',
                last_name='Doctor',
                role='professional',
                license_number='LIC456',
                specialty='Cardiology'
            )
            prof.set_password('Doctor123')
            db.session.add(prof)
            db.session.commit()

        response = client.get('/api/professionals?specialty=Cardiology', headers=auth_headers)

        assert response.status_code == 200
        data = response.json
        assert isinstance(data, list)

    def test_list_professionals_unauthorized(self, client):
        """Test listing professionals without authentication"""
        response = client.get('/api/professionals')
        assert response.status_code == 401


class TestGetProfessional:
    """Test get professional endpoint"""

    def test_get_professional_success(self, client, auth_headers, app):
        """Test getting a professional by ID"""
        with app.app_context():
            prof = Professional(
                email='getprof@test.com',
                first_name='Get',
                last_name='Prof',
                role='professional',
                license_number='LIC789',
                specialty='Surgery'
            )
            prof.set_password('Doctor123')
            db.session.add(prof)
            db.session.commit()
            prof_id = prof.id

        response = client.get(f'/api/professionals/{prof_id}', headers=auth_headers)

        assert response.status_code == 200
        data = response.json
        assert data['email'] == 'getprof@test.com'
        assert data['specialty'] == 'Surgery'

    def test_get_professional_not_found(self, client, auth_headers):
        """Test getting non-existent professional"""
        response = client.get('/api/professionals/99999', headers=auth_headers)
        assert response.status_code == 404

    def test_get_professional_unauthorized(self, client, app):
        """Test getting professional without authentication"""
        with app.app_context():
            prof = Professional(
                email='unauth@test.com',
                first_name='Unauth',
                last_name='Prof',
                role='professional',
                license_number='LIC999',
                specialty='General'
            )
            prof.set_password('Doctor123')
            db.session.add(prof)
            db.session.commit()
            prof_id = prof.id

        response = client.get(f'/api/professionals/{prof_id}')
        assert response.status_code == 401

    def test_get_professional_includes_frontend_aliases(self, client, auth_headers, app):
        """Test detail payload exposes frontend alias fields."""
        with app.app_context():
            prof = Professional(
                email='alias@test.com',
                first_name='Alias',
                last_name='Doctor',
                role='professional',
                license_number='ALIAS123',
                specialty='General',
                address='Main Street 123'
            )
            prof.set_password('Doctor123')
            db.session.add(prof)
            db.session.commit()
            prof_id = prof.id

        response = client.get(f'/api/professionals/{prof_id}', headers=auth_headers)

        assert response.status_code == 200
        data = response.json
        assert data['office_address'] == 'Main Street 123'
        assert 'working_hours' in data
        assert 'consultation_fee' in data
        assert 'bio' in data


class TestCreateProfessional:
    """Test create professional endpoint"""

    def test_create_professional_success(self, client, admin_auth_headers):
        """Test creating a new professional (admin only)"""
        response = client.post('/api/professionals', headers=admin_auth_headers, json={
            'email': 'newdoc@test.com',
            'password': 'Doctor123',
            'first_name': 'New',
            'last_name': 'Doctor',
            'license_number': 'LIC001',
            'specialty': 'Pediatrics',
            'phone': '123456789'
        })

        assert response.status_code == 201
        data = response.json
        assert data['email'] == 'newdoc@test.com'
        assert data['specialty'] == 'Pediatrics'

    def test_create_professional_duplicate_license(self, client, admin_auth_headers, app):
        """Test creating professional with duplicate license number"""
        with app.app_context():
            prof = Professional(
                email='existing@test.com',
                first_name='Existing',
                last_name='Doc',
                role='professional',
                license_number='DUPLIC123',
                specialty='General'
            )
            prof.set_password('Doctor123')
            db.session.add(prof)
            db.session.commit()

        response = client.post('/api/professionals', headers=admin_auth_headers, json={
            'email': 'another@test.com',
            'password': 'Doctor123',
            'first_name': 'Another',
            'last_name': 'Doctor',
            'license_number': 'DUPLIC123',
            'specialty': 'Surgery'
        })

        assert response.status_code in [400, 409]

    def test_create_professional_missing_license(self, client, admin_auth_headers):
        """Test creating professional without license number"""
        response = client.post('/api/professionals', headers=admin_auth_headers, json={
            'email': 'nolic@test.com',
            'password': 'Doctor123',
            'first_name': 'No',
            'last_name': 'License',
            'specialty': 'General'
        })

        assert response.status_code == 400

    def test_create_professional_unauthorized(self, client, patient_auth_headers):
        """Test creating professional as non-admin (should fail)"""
        response = client.post('/api/professionals', headers=patient_auth_headers, json={
            'email': 'unauth@test.com',
            'password': 'Doctor123',
            'first_name': 'Unauth',
            'last_name': 'Doc',
            'license_number': 'LIC777',
            'specialty': 'General'
        })

        # Should fail - only admins can create professionals
        assert response.status_code in [401, 403]

    def test_create_professional_supports_office_address_alias(self, client, admin_auth_headers):
        """Test create supports office_address payload alias from frontend."""
        response = client.post('/api/professionals', headers=admin_auth_headers, json={
            'email': 'office-alias@test.com',
            'password': 'Doctor123',
            'first_name': 'Office',
            'last_name': 'Alias',
            'license_number': 'LIC-OFFICE',
            'specialty': 'General',
            'office_address': 'Street 456'
        })

        assert response.status_code == 201
        data = response.json
        assert data['office_address'] == 'Street 456'


class TestUpdateProfessional:
    """Test update professional endpoint"""

    def test_update_professional_success(self, client, admin_auth_headers, app):
        """Test updating a professional"""
        with app.app_context():
            prof = Professional(
                email='update@test.com',
                first_name='Update',
                last_name='Me',
                role='professional',
                license_number='UPD123',
                specialty='General'
            )
            prof.set_password('Doctor123')
            db.session.add(prof)
            db.session.commit()
            prof_id = prof.id

        response = client.put(f'/api/professionals/{prof_id}', headers=admin_auth_headers, json={
            'specialty': 'Cardiology',
            'phone': '987654321'
        })

        assert response.status_code == 200
        data = response.json
        assert data['specialty'] == 'Cardiology'
        assert data['phone'] == '987654321'

    def test_update_professional_not_found(self, client, auth_headers):
        """Test updating non-existent professional"""
        response = client.put('/api/professionals/99999', headers=auth_headers, json={
            'specialty': 'Surgery'
        })

        assert response.status_code == 404

    def test_update_professional_unauthorized(self, client, app):
        """Test updating professional without authentication"""
        with app.app_context():
            prof = Professional(
                email='noupdate@test.com',
                first_name='No',
                last_name='Update',
                role='professional',
                license_number='NOUP123',
                specialty='General'
            )
            prof.set_password('Doctor123')
            db.session.add(prof)
            db.session.commit()
            prof_id = prof.id

        response = client.put(f'/api/professionals/{prof_id}', json={
            'specialty': 'Surgery'
        })

        assert response.status_code == 401

    def test_update_professional_office_address_and_is_active(self, client, admin_auth_headers, app):
        """Test update supports frontend aliases and status flag."""
        with app.app_context():
            prof = Professional(
                email='upd-alias@test.com',
                first_name='Update',
                last_name='Alias',
                role='professional',
                license_number='UPD-ALIAS',
                specialty='General',
                is_active=True
            )
            prof.set_password('Doctor123')
            db.session.add(prof)
            db.session.commit()
            prof_id = prof.id

        response = client.put(f'/api/professionals/{prof_id}', headers=admin_auth_headers, json={
            'office_address': 'Updated Office',
            'is_active': False
        })

        assert response.status_code == 200
        assert response.json['office_address'] == 'Updated Office'
        assert response.json['is_active'] is False


class TestDeleteProfessional:
    """Test delete professional endpoint"""

    def test_delete_professional_success(self, client, admin_auth_headers, app):
        """Test deleting a professional (admin only)"""
        with app.app_context():
            prof = Professional(
                email='delete@test.com',
                first_name='Delete',
                last_name='Me',
                role='professional',
                license_number='DEL123',
                specialty='General'
            )
            prof.set_password('Doctor123')
            db.session.add(prof)
            db.session.commit()
            prof_id = prof.id

        response = client.delete(f'/api/professionals/{prof_id}', headers=admin_auth_headers)

        assert response.status_code == 200

    def test_delete_professional_not_found(self, client, admin_auth_headers):
        """Test deleting non-existent professional"""
        response = client.delete('/api/professionals/99999', headers=admin_auth_headers)
        assert response.status_code == 404

    def test_delete_professional_unauthorized(self, client, patient_auth_headers, app):
        """Test deleting professional as non-admin (should fail)"""
        with app.app_context():
            prof = Professional(
                email='nodelete@test.com',
                first_name='No',
                last_name='Delete',
                role='professional',
                license_number='NODEL123',
                specialty='General'
            )
            prof.set_password('Doctor123')
            db.session.add(prof)
            db.session.commit()
            prof_id = prof.id

        response = client.delete(f'/api/professionals/{prof_id}', headers=patient_auth_headers)
        # Should fail - only admins can delete professionals
        assert response.status_code in [401, 403]


class TestProfessionalAvailability:
    """Test professional availability endpoint."""

    def test_available_slots_skip_overlapping_ranges(
        self,
        client,
        auth_headers,
        app,
        sample_professional,
        sample_patient,
    ):
        """Availability should not expose slots overlapping existing appointments."""
        base_slot = (datetime.utcnow() + timedelta(days=1)).replace(
            hour=8,
            minute=0,
            second=0,
            microsecond=0,
        )

        with app.app_context():
            db.session.add(
                Appointment(
                    patient_id=sample_patient.id,
                    professional_id=sample_professional.id,
                    appointment_date=base_slot,
                    duration_minutes=60,
                    status='scheduled',
                )
            )
            db.session.commit()

        response = client.get(
            f'/api/professionals/available-slots?date_from={base_slot.isoformat()}&days=2&slots_per_professional=4',
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json
        target = next((item for item in data if item['id'] == sample_professional.id), None)
        assert target is not None
        assert base_slot.isoformat() not in target['available_slots']
        assert (base_slot + timedelta(minutes=30)).isoformat() not in target['available_slots']


class TestProfessionalCrudWorkflow:
    """End-to-end CRUD validation for professionals API."""

    def test_professional_crud_end_to_end(self, client, admin_auth_headers):
        """Validate create -> get/list -> update -> delete -> not found flow."""
        create_response = client.post('/api/professionals', headers=admin_auth_headers, json={
            'email': 'flow-professional@test.com',
            'password': 'Doctor123',
            'first_name': 'Flow',
            'last_name': 'Professional',
            'license_number': 'FLOW-LIC-001',
            'specialty': 'Odontologia',
            'office_address': 'Flow Office 123'
        })

        assert create_response.status_code == 201
        created_professional = create_response.json
        professional_id = created_professional['id']
        assert created_professional['email'] == 'flow-professional@test.com'
        assert created_professional['office_address'] == 'Flow Office 123'

        get_response = client.get(f'/api/professionals/{professional_id}', headers=admin_auth_headers)
        assert get_response.status_code == 200
        assert get_response.json['id'] == professional_id

        list_response = client.get('/api/professionals?specialty=Odontologia', headers=admin_auth_headers)
        assert list_response.status_code == 200
        assert any(row['id'] == professional_id for row in list_response.json)

        update_response = client.put(f'/api/professionals/{professional_id}', headers=admin_auth_headers, json={
            'specialty': 'Ortodoncia',
            'office_address': 'Updated Flow Office',
            'is_active': False
        })

        assert update_response.status_code == 200
        updated_professional = update_response.json
        assert updated_professional['specialty'] == 'Ortodoncia'
        assert updated_professional['office_address'] == 'Updated Flow Office'
        assert updated_professional['is_active'] is False

        delete_response = client.delete(f'/api/professionals/{professional_id}', headers=admin_auth_headers)
        assert delete_response.status_code == 200
        assert delete_response.json['msg'] == 'Professional deleted'

        not_found_response = client.get(f'/api/professionals/{professional_id}', headers=admin_auth_headers)
        assert not_found_response.status_code == 404
