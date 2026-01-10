# Debug script to test endpoint
from app import create_app
from app.extensions import db
from app.models.professional import Professional
from app.models.patient import Patient

app = create_app('test')

with app.app_context():
    # Create tables
    db.create_all()

    # Create professional (inherits from User)
    prof = Professional(
        email='prof@test.com',
        first_name='Test',
        last_name='Prof',
        role='professional',
        license_number='LIC123',
        specialty='Odontologia'
    )
    prof.set_password('Test123!')
    db.session.add(prof)
    db.session.commit()

    # Create patient (inherits from User)
    patient = Patient(
        email='patient@test.com',
        first_name='Patient',
        last_name='Test',
        role='patient'
    )
    patient.set_password('Test123!')
    db.session.add(patient)
    db.session.commit()

    print(f"Patient ID: {patient.id}")
    print(f"Professional ID: {prof.id}")

    # Test the endpoint
    with app.test_client() as client:
        # Get token
        response = client.post('/api/auth/login', json={
            'email': 'prof@test.com',
            'password': 'Test123!'
        })
        print(f"Login status: {response.status_code}")
        token_data = response.get_json()
        print(f"Login response: {token_data}")

        if 'access_token' in token_data:
            token = token_data['access_token']
            headers = {'Authorization': f'Bearer {token}'}

            # Test odontogram creation
            data = {
                'patient_id': patient.id,
                'professional_id': prof.id,
                'notes': 'Test notes',
                'is_active': True
            }

            print(f"\nSending data: {data}")

            response = client.post('/api/odontograms', json=data, headers=headers)
            print(f"Status code: {response.status_code}")
            print(f"Response: {response.get_json()}")
