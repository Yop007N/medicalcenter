# -*- coding: utf-8 -*-
"""Tests for specialty module catalog and scoped overview endpoints."""


def _login_headers(client, email, password):
    response = client.post('/api/auth/login', json={'email': email, 'password': password})
    assert response.status_code == 200
    token = response.get_json()['access_token']
    return {'Authorization': f'Bearer {token}'}


def test_specialties_catalog_requires_auth(client):
    response = client.get('/api/specialties/catalog')
    assert response.status_code in (401, 422)


def test_specialties_catalog_available_for_professional(client, auth_headers):
    response = client.get('/api/specialties/catalog', headers=auth_headers)
    assert response.status_code == 200

    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) >= 20
    keys = {item['key'] for item in data}
    assert 'odontology' in keys
    assert 'nutrition' in keys


def test_my_module_and_overview_scoped_for_professional(
    client,
    sample_professional,
    sample_appointment,
):
    headers = _login_headers(client, 'testdoc@test.com', 'Doctor123')

    module_response = client.get('/api/specialties/my-module', headers=headers)
    assert module_response.status_code == 200
    module_payload = module_response.get_json()
    assert module_payload['actor'] == 'professional'
    # "General Practice" is not mapped explicitly and falls back to generic module.
    assert module_payload['module']['key'] == 'general-medicine'

    overview_response = client.get('/api/specialties/my-module/overview', headers=headers)
    assert overview_response.status_code == 200
    overview = overview_response.get_json()

    assert overview['module']['key'] == 'general-medicine'
    assert overview['totals']['patients'] >= 1
    assert overview['totals']['appointments_total'] >= 1
    assert isinstance(overview['patients'], list)
    assert isinstance(overview['upcoming_appointments'], list)


def test_admin_overview_can_be_scoped_by_specialty_key(client, app, admin_user):
    from datetime import datetime, timedelta

    from app.extensions import db
    from app.models.appointment import Appointment
    from app.models.medical_record import MedicalRecord
    from app.models.patient import Patient
    from app.models.professional import Professional

    with app.app_context():
        cardio = Professional(
            email='cardio@test.com',
            first_name='Carla',
            last_name='Cardio',
            role='professional',
            specialty='Cardiología',
            license_number='CARD-001',
        )
        cardio.set_password('Doctor123')

        derm = Professional(
            email='derm@test.com',
            first_name='Diego',
            last_name='Derma',
            role='professional',
            specialty='Dermatología',
            license_number='DERM-001',
        )
        derm.set_password('Doctor123')

        cardio_patient = Patient(
            email='patient.cardio@test.com',
            first_name='Paciente',
            last_name='Cardio',
            role='patient',
        )
        cardio_patient.set_password('Patient123')

        derm_patient = Patient(
            email='patient.derm@test.com',
            first_name='Paciente',
            last_name='Derma',
            role='patient',
        )
        derm_patient.set_password('Patient123')

        db.session.add_all([cardio, derm, cardio_patient, derm_patient])
        db.session.flush()

        db.session.add_all([
            Appointment(
                patient_id=cardio_patient.id,
                professional_id=cardio.id,
                appointment_date=datetime.utcnow() + timedelta(days=2),
                status='confirmed',
                appointment_type='consultation',
            ),
            Appointment(
                patient_id=derm_patient.id,
                professional_id=derm.id,
                appointment_date=datetime.utcnow() + timedelta(days=3),
                status='confirmed',
                appointment_type='consultation',
            ),
            MedicalRecord(
                patient_id=cardio_patient.id,
                professional_id=cardio.id,
                diagnosis='Control cardiovascular',
            ),
            MedicalRecord(
                patient_id=derm_patient.id,
                professional_id=derm.id,
                diagnosis='Control dermatológico',
            ),
        ])
        db.session.commit()

    headers = _login_headers(client, admin_user.email, 'Admin123')
    response = client.get(
        '/api/specialties/my-module/overview?specialty_key=cardiology',
        headers=headers,
    )
    assert response.status_code == 200
    payload = response.get_json()

    assert payload['module']['key'] == 'cardiology'
    assert payload['totals']['appointments_total'] == 1
    assert payload['totals']['medical_records'] == 1
    assert payload['totals']['patients'] == 1
    assert len(payload['patients']) == 1
    assert payload['patients'][0]['email'] == 'patient.cardio@test.com'


def test_specialty_history_scoped_by_specialty_and_patient(client, app, admin_user):
    from datetime import datetime, timedelta

    from app.extensions import db
    from app.models.appointment import Appointment
    from app.models.file import File
    from app.models.medical_record import MedicalRecord
    from app.models.patient import Patient
    from app.models.professional import Professional
    from app.models.specialty_encounter import SpecialtyEncounter

    with app.app_context():
        cardio = Professional(
            email='history.cardio@test.com',
            first_name='Helena',
            last_name='Cardio',
            role='professional',
            specialty='Cardiología',
            license_number='CARD-HISTORY',
        )
        cardio.set_password('Doctor123')

        cardio_patient = Patient(
            email='history.patient.cardio@test.com',
            first_name='Paula',
            last_name='Cardio',
            role='patient',
        )
        cardio_patient.set_password('Patient123')

        other_patient = Patient(
            email='history.patient.other@test.com',
            first_name='Otto',
            last_name='Other',
            role='patient',
        )
        other_patient.set_password('Patient123')

        db.session.add_all([cardio, cardio_patient, other_patient])
        db.session.flush()
        cardio_patient_id = cardio_patient.id
        other_patient_id = other_patient.id

        medical_record = MedicalRecord(
            patient_id=cardio_patient_id,
            professional_id=cardio.id,
            diagnosis='Seguimiento cardiológico',
            treatment='Plan cardio',
        )
        db.session.add(medical_record)
        db.session.flush()

        db.session.add_all([
            Appointment(
                patient_id=cardio_patient_id,
                professional_id=cardio.id,
                appointment_date=datetime.utcnow() + timedelta(days=1),
                status='confirmed',
                appointment_type='follow_up',
            ),
            SpecialtyEncounter(
                patient_id=cardio_patient_id,
                professional_id=cardio.id,
                specialty_key='cardiology',
                visit_date=datetime.utcnow(),
                status='in_progress',
                chief_complaint='Dolor torácico',
                diagnosis='HTA',
            ),
            File(
                medical_record_id=medical_record.id,
                filename='ecg.pdf',
                file_type='study',
                mime_type='application/pdf',
                file_size=1024,
                file_path='storage/files/ecg.pdf',
            ),
        ])
        db.session.commit()

    headers = _login_headers(client, admin_user.email, 'Admin123')
    response = client.get(
        f'/api/specialties/history?specialty_key=cardiology&patient_id={cardio_patient_id}',
        headers=headers,
    )
    assert response.status_code == 200
    payload = response.get_json()

    assert payload['module']['key'] == 'cardiology'
    assert payload['filters']['patient_id'] == cardio_patient_id
    assert payload['totals']['patients'] == 1
    assert payload['totals']['appointments'] == 1
    assert payload['totals']['medical_records'] == 1
    assert payload['totals']['encounters'] == 1
    assert payload['totals']['documents'] == 1
    assert payload['patients'][0]['email'] == 'history.patient.cardio@test.com'
    assert payload['appointments'][0]['patient_id'] == cardio_patient_id
    assert payload['specialty_encounters'][0]['specialty_key'] == 'cardiology'
    assert payload['documents'][0]['filename'] == 'ecg.pdf'

    denied_response = client.get(
        f'/api/specialties/history?specialty_key=cardiology&patient_id={other_patient_id}',
        headers=headers,
    )
    assert denied_response.status_code == 403
