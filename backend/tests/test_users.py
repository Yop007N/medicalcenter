# -*- coding: utf-8 -*-
"""
Tests for user endpoints
"""

import pytest


class TestListUsers:
    """Tests for listing users"""

    def test_list_users_success(self, client, admin_auth_headers, admin_user):
        """Test successful user listing"""
        response = client.get('/api/users', headers=admin_auth_headers)

        assert response.status_code == 200
        data = response.json
        assert 'items' in data
        assert isinstance(data['items'], list)
        assert len(data['items']) >= 1

    def test_list_users_with_pagination(self, client, admin_auth_headers, admin_user):
        """Test user listing with pagination"""
        response = client.get('/api/users?page=1&per_page=10', headers=admin_auth_headers)

        assert response.status_code == 200
        data = response.json
        assert 'items' in data
        assert 'total' in data
        assert 'page' in data
        assert 'pages' in data
        assert data['page'] == 1

    def test_list_users_unauthorized(self, client):
        """Test user listing without authentication"""
        response = client.get('/api/users')

        assert response.status_code == 401

    def test_list_users_forbidden_for_non_admin(self, client, auth_headers):
        """Only admins should list all users."""
        response = client.get('/api/users', headers=auth_headers)
        assert response.status_code == 403


class TestGetUser:
    """Tests for getting a single user"""

    def test_get_user_success(self, client, admin_auth_headers, admin_user):
        """Test successful user retrieval"""
        response = client.get(f'/api/users/{admin_user.id}', headers=admin_auth_headers)

        assert response.status_code == 200
        data = response.json
        assert data['id'] == admin_user.id
        assert data['email'] == admin_user.email

    def test_get_user_not_found(self, client, admin_auth_headers):
        """Test get non-existent user"""
        response = client.get('/api/users/99999', headers=admin_auth_headers)

        assert response.status_code == 404

    def test_get_user_unauthorized(self, client, admin_user):
        """Test get user without authentication"""
        response = client.get(f'/api/users/{admin_user.id}')

        assert response.status_code == 401

    def test_get_user_forbidden_for_other_non_admin_user(
        self, client, patient_auth_headers, admin_user
    ):
        response = client.get(f'/api/users/{admin_user.id}', headers=patient_auth_headers)
        assert response.status_code == 403


class TestCreateUser:
    """Tests for creating users"""

    def test_create_user_success(self, client, admin_auth_headers):
        """Test successful user creation"""
        response = client.post('/api/users', headers=admin_auth_headers, json={
            'email': 'newuser@test.com',
            'password': 'NewUser123',
            'first_name': 'New',
            'last_name': 'User',
            'role': 'patient'
        })

        assert response.status_code == 201
        data = response.json
        assert data['email'] == 'newuser@test.com'
        assert data['role'] == 'patient'
        assert 'password' not in data

    def test_create_user_duplicate_email(self, client, admin_auth_headers, admin_user):
        """Test creating user with duplicate email"""
        response = client.post('/api/users', headers=admin_auth_headers, json={
            'email': 'admin@test.com',
            'password': 'Test123',
            'first_name': 'Test',
            'last_name': 'User',
            'role': 'patient'
        })

        assert response.status_code == 400

    def test_create_user_missing_fields(self, client, admin_auth_headers):
        """Test creating user with missing fields"""
        response = client.post('/api/users', headers=admin_auth_headers, json={
            'email': 'incomplete@test.com'
        })

        assert response.status_code == 400

    def test_create_user_weak_password(self, client, admin_auth_headers):
        """Test creating user with weak password"""
        response = client.post('/api/users', headers=admin_auth_headers, json={
            'email': 'weak@test.com',
            'password': '123',
            'first_name': 'Weak',
            'last_name': 'Password',
            'role': 'patient'
        })

        assert response.status_code == 400

    def test_create_user_unauthorized(self, client):
        """Test user creation without authentication"""
        response = client.post('/api/users', json={
            'email': 'test@test.com',
            'password': 'Test123',
            'first_name': 'Test',
            'last_name': 'User',
            'role': 'patient'
        })

        assert response.status_code == 401

    def test_create_user_forbidden_for_non_admin(self, client, auth_headers):
        response = client.post('/api/users', headers=auth_headers, json={
            'email': 'forbidden@test.com',
            'password': 'Forbidden123',
            'first_name': 'Forbidden',
            'last_name': 'User',
            'role': 'patient'
        })
        assert response.status_code == 403


class TestUpdateUser:
    """Tests for updating users"""

    def test_update_user_success(self, client, admin_auth_headers, admin_user):
        """Test successful user update"""
        response = client.put(f'/api/users/{admin_user.id}', headers=admin_auth_headers, json={
            'first_name': 'Updated',
            'last_name': 'Name'
        })

        assert response.status_code == 200
        data = response.json
        assert data['first_name'] == 'Updated'
        assert data['last_name'] == 'Name'

    def test_update_user_not_found(self, client, admin_auth_headers):
        """Test updating non-existent user"""
        response = client.put('/api/users/99999', headers=admin_auth_headers, json={
            'first_name': 'Test'
        })

        assert response.status_code == 404

    def test_update_user_email_to_existing(self, client, admin_auth_headers, admin_user, patient_user):
        """Test updating user email to existing email"""
        response = client.put(f'/api/users/{patient_user.id}', headers=admin_auth_headers, json={
            'email': 'admin@test.com'
        })

        assert response.status_code in [400, 409]

    def test_update_user_unauthorized(self, client, admin_user):
        """Test user update without authentication"""
        response = client.put(f'/api/users/{admin_user.id}', json={
            'first_name': 'Test'
        })

        assert response.status_code == 401

    def test_update_user_forbidden_for_other_non_admin_user(
        self, client, patient_auth_headers, admin_user
    ):
        response = client.put(f'/api/users/{admin_user.id}', headers=patient_auth_headers, json={
            'first_name': 'Nope'
        })
        assert response.status_code == 403

    def test_update_user_allowed_for_self_non_admin(
        self, client, patient_auth_headers, patient_user
    ):
        response = client.put(f'/api/users/{patient_user.id}', headers=patient_auth_headers, json={
            'first_name': 'SelfUpdated'
        })
        assert response.status_code == 200
        assert response.json['first_name'] == 'SelfUpdated'


class TestDeleteUser:
    """Tests for deleting users"""

    def test_delete_user_success(self, client, admin_auth_headers, patient_user):
        """Test successful user deletion"""
        response = client.delete(f'/api/users/{patient_user.id}', headers=admin_auth_headers)

        assert response.status_code in [200, 204]

    def test_delete_user_not_found(self, client, admin_auth_headers):
        """Test deleting non-existent user"""
        response = client.delete('/api/users/99999', headers=admin_auth_headers)

        assert response.status_code == 404

    def test_delete_user_unauthorized(self, client, admin_user):
        """Test user deletion without authentication"""
        response = client.delete(f'/api/users/{admin_user.id}')

        assert response.status_code == 401

    def test_delete_user_forbidden_for_non_admin(self, client, auth_headers, patient_user):
        response = client.delete(f'/api/users/{patient_user.id}', headers=auth_headers)
        assert response.status_code == 403
