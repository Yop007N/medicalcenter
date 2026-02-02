
import pytest
from app.models.user import User
from app.services.auth_service import AuthService

def test_patient_can_create_admin(client, app):
    """
    Test proving that a patient can create an admin user (Privilege Escalation).
    """
    with app.app_context():
        # 1. Create a patient
        patient = AuthService.register_user(
            email='attacker@patient.com',
            password='Password123!',
            first_name='Attacker',
            last_name='Patient',
            role='patient'
        )
        patient_id = patient.id

    # 2. Login as patient
    login_resp = client.post('/api/auth/login', json={
        'email': 'attacker@patient.com',
        'password': 'Password123!'
    })
    assert login_resp.status_code == 200
    token = login_resp.json['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    # 3. Try to create an admin user
    new_admin_data = {
        'email': 'hacked_admin@medical.com',
        'password': 'Password123!',
        'first_name': 'Hacked',
        'last_name': 'Admin',
        'role': 'admin'
    }

    # This should FAIL with 403 Forbidden
    create_resp = client.post('/api/users', json=new_admin_data, headers=headers)

    print(f"Response status: {create_resp.status_code}")

    # We expect this to be 403 now
    assert create_resp.status_code == 403

    with app.app_context():
        admin = User.query.filter_by(email='hacked_admin@medical.com').first()
        assert admin is None

def test_patient_cannot_list_users(client, app):
    """Test proving patient CANNOT list all users"""
    with app.app_context():
         # 1. Create a patient
        patient = AuthService.register_user(
            email='viewer@patient.com',
            password='Password123!',
            first_name='Viewer',
            last_name='Patient',
            role='patient'
        )

    login_resp = client.post('/api/auth/login', json={
        'email': 'viewer@patient.com',
        'password': 'Password123!'
    })
    token = login_resp.json['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    resp = client.get('/api/users', headers=headers)
    assert resp.status_code == 403
