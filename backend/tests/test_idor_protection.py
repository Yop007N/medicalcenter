
import pytest
from app.models.patient import Patient
from app.extensions import db

def test_idor_protection(client, app):
    """
    Test that a patient CANNOT access another patient's data (IDOR protection).
    """
    with app.app_context():
        # Create Victim Patient
        victim = Patient(
            email='victim@test.com',
            first_name='Victim',
            last_name='User',
            role='patient',
            phone='123456789',
            medical_history='SENSITIVE MEDICAL HISTORY'
        )
        victim.set_password('Victim123')
        db.session.add(victim)

        # Create Attacker Patient
        attacker = Patient(
            email='attacker@test.com',
            first_name='Attacker',
            last_name='User',
            role='patient'
        )
        attacker.set_password('Attacker123')
        db.session.add(attacker)

        db.session.commit()
        victim_id = victim.id
        attacker_id = attacker.id

    # Log in as Attacker
    response = client.post('/api/auth/login', json={
        'email': 'attacker@test.com',
        'password': 'Attacker123'
    })
    token = response.json['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    # Try to access Victim's data
    response = client.get(f'/api/patients/{victim_id}', headers=headers)

    # Should be Forbidden (403)
    assert response.status_code == 403
    assert response.json['msg'] == 'Unauthorized'

    # Also verify that the attacker CAN access their own data
    response_own = client.get(f'/api/patients/{attacker_id}', headers=headers)
    assert response_own.status_code == 200
    assert response_own.json['email'] == 'attacker@test.com'
