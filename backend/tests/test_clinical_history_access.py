# -*- coding: utf-8 -*-
"""Access control tests for clinical history endpoints."""

from app.extensions import db
from app.models.patient import Patient
from app.models.clinical_history import InformedConsent


def _login_patient_headers(client):
    response = client.post(
        '/api/auth/login',
        json={'email': 'testpatient@test.com', 'password': 'Patient123'}
    )
    assert response.status_code == 200
    token = response.get_json()['access_token']
    return {'Authorization': f'Bearer {token}'}


def _create_secondary_patient(app):
    with app.app_context():
        patient = Patient(
            email='secondpatient@test.com',
            first_name='Second',
            last_name='Patient',
            role='patient'
        )
        patient.set_password('Patient123')
        db.session.add(patient)
        db.session.commit()
        return patient.id


def _create_consent(app, patient_id, professional_id):
    with app.app_context():
        consent = InformedConsent(
            patient_id=patient_id,
            professional_id=professional_id,
            consent_type='general_treatment',
            title='Consent test',
            content='Consent content',
            status='pending'
        )
        db.session.add(consent)
        db.session.commit()
        return consent.id


def test_patient_can_access_own_summary(client, sample_patient):
    headers = _login_patient_headers(client)

    response = client.get(
        f'/api/clinical-history/summary/{sample_patient.id}',
        headers=headers
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data['patient_id'] == sample_patient.id


def test_patient_cannot_access_other_patient_summary(client, app, sample_patient):
    headers = _login_patient_headers(client)
    other_patient_id = _create_secondary_patient(app)

    response = client.get(
        f'/api/clinical-history/summary/{other_patient_id}',
        headers=headers
    )

    assert response.status_code == 403
    assert response.get_json()['msg'] == 'Unauthorized'


def test_professional_can_access_any_patient_summary(client, app, auth_headers):
    other_patient_id = _create_secondary_patient(app)

    response = client.get(
        f'/api/clinical-history/summary/{other_patient_id}',
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data['patient_id'] == other_patient_id


def test_patient_cannot_sign_consent_for_other_patient(
    client,
    app,
    sample_patient,
    sample_professional
):
    headers = _login_patient_headers(client)
    other_patient_id = _create_secondary_patient(app)
    consent_id = _create_consent(app, other_patient_id, sample_professional.id)

    response = client.post(
        f'/api/clinical-history/consents/{consent_id}/sign',
        json={'patient_signature': 'fake-signature'},
        headers=headers
    )

    assert response.status_code == 403
    assert response.get_json()['msg'] == 'Unauthorized'


def test_patient_can_sign_own_consent(client, app, sample_patient, sample_professional):
    headers = _login_patient_headers(client)
    consent_id = _create_consent(app, sample_patient.id, sample_professional.id)

    response = client.post(
        f'/api/clinical-history/consents/{consent_id}/sign',
        json={'patient_signature': 'signed-by-patient'},
        headers=headers
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'signed'
    assert data['patient_signature'] == 'signed-by-patient'
