# -*- coding: utf-8 -*-
"""
Professional CRUD Tests
"""

import pytest
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
