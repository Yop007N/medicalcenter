# -*- coding: utf-8 -*-
"""
Security tests for user endpoints (RBAC/IDOR)
"""

import pytest

class TestUserSecurity:
    """Tests for user endpoint security"""

    def test_patient_cannot_delete_admin(self, client, patient_auth_headers, admin_user):
        """Test that a patient cannot delete an admin user"""
        # Try to delete the admin user using patient credentials
        response = client.delete(f'/api/users/{admin_user.id}', headers=patient_auth_headers)

        # Should be Forbidden (403) or Unauthorized (401), but definitely not success (200/204)
        assert response.status_code in [401, 403]

    def test_patient_cannot_list_all_users(self, client, patient_auth_headers):
        """Test that a patient cannot list all users"""
        response = client.get('/api/users', headers=patient_auth_headers)

        # Should be Forbidden (403)
        assert response.status_code == 403

    def test_patient_cannot_create_admin(self, client, patient_auth_headers):
        """Test that a patient cannot create a new admin user"""
        response = client.post('/api/users', headers=patient_auth_headers, json={
            'email': 'hacker@test.com',
            'password': 'Hacker123',
            'first_name': 'Hacker',
            'last_name': 'Man',
            'role': 'admin'
        })

        # Should be Forbidden (403)
        assert response.status_code == 403

    def test_patient_cannot_update_other_user(self, client, patient_auth_headers, admin_user):
        """Test that a patient cannot update another user's profile"""
        response = client.put(f'/api/users/{admin_user.id}', headers=patient_auth_headers, json={
            'first_name': 'Hacked'
        })

        # Should be Forbidden (403)
        assert response.status_code == 403
