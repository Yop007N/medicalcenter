
import pytest

def test_patient_can_create_admin_vulnerability(client, patient_auth_headers):
    """
    Test checking if a patient can create an admin user (Privilege Escalation).
    This test is expected to PASS if the vulnerability exists (status 201),
    and FAIL once fixed (status 403).
    """
    response = client.post('/api/users', headers=patient_auth_headers, json={
        "email": "hacked_admin@test.com",
        "password": "Password123",
        "first_name": "Hacked",
        "last_name": "Admin",
        "role": "admin"
    })

    # If vulnerability exists, this returns 201.
    # If fixed, it should return 403.
    assert response.status_code == 403, f"Expected 403 Forbidden, but got {response.status_code}. Response: {response.text}"
