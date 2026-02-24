# -*- coding: utf-8 -*-
"""Regression tests for clinical history evolution endpoints."""

from app.extensions import db
from app.models.clinical_history import ClinicalHistoryEvent, Evolution
from app.models.patient import Patient


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
            email='otherpatient@test.com',
            first_name='Other',
            last_name='Patient',
            role='patient',
        )
        patient.set_password('Patient123')
        db.session.add(patient)
        db.session.commit()
        return patient.id


def _create_evolution(app, patient_id, professional_id, status='pending'):
    with app.app_context():
        evolution = Evolution(
            patient_id=patient_id,
            professional_id=professional_id,
            action_performed='Initial action',
            notes='Initial notes',
            status=status,
        )
        db.session.add(evolution)
        db.session.commit()
        return evolution.id


def test_professional_create_evolution_creates_timeline_event(
    client,
    app,
    auth_headers,
    sample_patient,
):
    response = client.post(
        '/api/clinical-history/evolutions',
        json={
            'patient_id': sample_patient.id,
            'action_performed': 'Control de evolución',
            'notes': 'Todo en orden',
        },
        headers=auth_headers,
    )

    assert response.status_code == 201
    payload = response.get_json()
    evolution_id = payload['id']

    with app.app_context():
        event = ClinicalHistoryEvent.query.filter_by(
            reference_type='evolution',
            reference_id=evolution_id,
        ).first()
        assert event is not None
        assert event.patient_id == sample_patient.id
        assert event.title == 'Nueva evolución registrada'


def test_patient_cannot_list_other_patient_evolutions(
    client,
    app,
    sample_patient,
    sample_professional,
):
    headers = _login_patient_headers(client)
    other_patient_id = _create_secondary_patient(app)
    _create_evolution(app, other_patient_id, sample_professional.id)

    response = client.get(
        f'/api/clinical-history/evolutions?patient_id={other_patient_id}',
        headers=headers,
    )

    assert response.status_code == 403
    assert response.get_json()['msg'] == 'Unauthorized'


def test_sign_evolution_requires_valid_signer_type(
    client,
    app,
    auth_headers,
    sample_patient,
    sample_professional,
):
    evolution_id = _create_evolution(app, sample_patient.id, sample_professional.id)

    response = client.post(
        f'/api/clinical-history/evolutions/{evolution_id}/sign',
        json={'signer_type': 'auditor', 'signature': 'invalid'},
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert response.get_json()['msg'] == 'signer_type must be professional or patient'


def test_update_annulled_evolution_returns_400(
    client,
    app,
    auth_headers,
    sample_patient,
    sample_professional,
):
    evolution_id = _create_evolution(
        app,
        sample_patient.id,
        sample_professional.id,
        status='annulled',
    )

    response = client.put(
        f'/api/clinical-history/evolutions/{evolution_id}',
        json={'notes': 'No se deberia actualizar'},
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert response.get_json()['msg'] == 'Cannot modify annulled evolution'

