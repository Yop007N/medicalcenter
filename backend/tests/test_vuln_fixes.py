
import pytest
from app.models.patient import Patient
from app.models.professional import Professional
from app.extensions import db

def test_update_patient_weak_password_prevented(client, auth_headers, app):
    """
    Test that updating patient password with weak password fails.
    """
    with app.app_context():
        # Create a patient with a strong password
        patient = Patient(
            email='vuln_test@test.com',
            first_name='Vuln',
            last_name='Test',
            role='patient',
            phone='123456789'
        )
        patient.set_password('StrongPass123')
        db.session.add(patient)
        db.session.commit()
        patient_id = patient.id

    # Attempt to update the password to a weak one
    weak_password = '123'
    response = client.put(f'/api/patients/{patient_id}', headers=auth_headers, json={
        'password': weak_password
    })

    # If the vulnerability exists, this will return 200 OK
    if response.status_code == 200:
        print("\n[VULNERABILITY CONFIRMED] Password updated to weak password without validation.")

        # Verify the password was actually changed
        with app.app_context():
            updated_patient = Patient.query.get(patient_id)
            assert updated_patient.check_password(weak_password)
            print("[VULNERABILITY CONFIRMED] Database reflects the weak password.")

    elif response.status_code == 400:
        print("\n[SECURE] Password update failed as expected with 400 Bad Request.")
    else:
        print(f"\n[UNEXPECTED] Response status code: {response.status_code}")

    # We expect this to be 400 now (secure)
    assert response.status_code == 400

def test_update_professional_weak_password_prevented(client, app):
    """
    Test that updating professional password with weak password fails.
    """
    with app.app_context():
        # Create a professional with a strong password
        professional = Professional(
            email='vuln_prof@test.com',
            first_name='Vuln',
            last_name='Prof',
            role='professional',
            license_number='LIC-12345'
        )
        professional.set_password('StrongPass123')
        db.session.add(professional)
        db.session.commit()
        professional_id = professional.id
        professional_email = professional.email

    # Login as the professional
    response = client.post('/api/auth/login', json={
        'email': professional_email,
        'password': 'StrongPass123'
    })
    token = response.json['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    # Attempt to update the password to a weak one
    weak_password = '123'
    response = client.put(f'/api/professionals/{professional_id}', headers=headers, json={
        'password': weak_password
    })

    # If the vulnerability exists, this will return 200 OK
    if response.status_code == 200:
        print("\n[VULNERABILITY CONFIRMED] Professional password updated to weak password without validation.")

        # Verify the password was actually changed
        with app.app_context():
            updated_prof = Professional.query.get(professional_id)
            assert updated_prof.check_password(weak_password)
            print("[VULNERABILITY CONFIRMED] Database reflects the weak password.")

    elif response.status_code == 400:
        print("\n[SECURE] Password update failed as expected with 400 Bad Request.")
    else:
        print(f"\n[UNEXPECTED] Response status code: {response.status_code}")

    # We expect this to be 400 now (secure)
    assert response.status_code == 400
