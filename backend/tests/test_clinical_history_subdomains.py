# -*- coding: utf-8 -*-
"""Regression tests for clinical history subdomain endpoints."""

from app.extensions import db
from app.models.patient import Patient


def _login_patient_headers(client):
    response = client.post(
        '/api/auth/login',
        json={'email': 'testpatient@test.com', 'password': 'Patient123'},
    )
    assert response.status_code == 200
    token = response.get_json()['access_token']
    return {'Authorization': f'Bearer {token}'}


def _create_secondary_patient(app):
    with app.app_context():
        patient = Patient(
            email='clinical-other-patient@test.com',
            first_name='Other',
            last_name='Patient',
            role='patient',
        )
        patient.set_password('Patient123')
        db.session.add(patient)
        db.session.commit()
        return patient.id


def test_create_and_update_anamnesis(client, admin_auth_headers, sample_patient):
    response_create = client.post(
        '/api/clinical-history/anamnesis',
        json={
            'patient_id': sample_patient.id,
            'consultation_reason': ['pain', 'cleaning'],
            'consultation_reason_other': 'Control anual',
            'current_illness': ['gingivitis'],
            'medical_alerts': ['hypertension'],
            'medical_alerts_other': 'Alergia a penicilina',
            'medications': ['antibiotics'],
            'medications_other': 'Vitamina D',
            'habits': ['smoking'],
            'habits_other': 'Mate nocturno',
            'notes': 'Primera carga',
        },
        headers=admin_auth_headers,
    )

    assert response_create.status_code == 200
    payload_create = response_create.get_json()
    assert payload_create['patient_id'] == sample_patient.id
    assert payload_create['consultation_reason'] == ['pain', 'cleaning']
    assert payload_create['consultation_reason_other'] == 'Control anual'
    assert payload_create['current_illness'] == ['gingivitis']
    assert payload_create['medical_alerts'] == ['hypertension']
    assert payload_create['medications'] == ['antibiotics']
    assert payload_create['habits'] == ['smoking']

    response_update = client.post(
        '/api/clinical-history/anamnesis',
        json={
            'patient_id': sample_patient.id,
            'consultation_reason': ['evaluation'],
            'consultation_reason_other': 'Chequeo semestral',
            'notes': 'Sin dolor actual',
        },
        headers=admin_auth_headers,
    )

    assert response_update.status_code == 200
    payload_update = response_update.get_json()
    assert payload_update['consultation_reason'] == ['evaluation']
    assert payload_update['consultation_reason_other'] == 'Chequeo semestral'
    assert payload_update['notes'] == 'Sin dolor actual'


def test_admin_can_upsert_anamnesis_without_professional_fk(client, admin_auth_headers, sample_patient):
    response = client.post(
        '/api/clinical-history/anamnesis',
        json={
            'patient_id': sample_patient.id,
            'consultation_reason': ['pain'],
            'medical_alerts': ['diabetes'],
        },
        headers=admin_auth_headers,
    )

    assert response.status_code == 200
    payload = response.get_json()
    assert payload['patient_id'] == sample_patient.id
    assert payload['consultation_reason'] == ['pain']
    assert payload['professional_id'] is None


def test_create_and_list_periodontal_records(client, admin_auth_headers, sample_patient):
    response_create = client.post(
        '/api/clinical-history/periodontal',
        json={
            'patient_id': sample_patient.id,
            'tooth_number': 11,
            'probing_depth_mb': 3,
            'bleeding': True,
        },
        headers=admin_auth_headers,
    )

    assert response_create.status_code == 201
    payload_create = response_create.get_json()
    assert payload_create['patient_id'] == sample_patient.id
    assert payload_create['tooth_number'] == 11
    assert payload_create['bleeding'] is True

    response_list = client.get(
        f'/api/clinical-history/periodontal?patient_id={sample_patient.id}',
        headers=admin_auth_headers,
    )

    assert response_list.status_code == 200
    payload_list = response_list.get_json()
    assert len(payload_list) == 1
    assert payload_list[0]['tooth_number'] == 11


def test_bulk_periodontal_records_skips_invalid_rows(client, admin_auth_headers, sample_patient):
    response = client.post(
        '/api/clinical-history/periodontal/bulk',
        json={
            'patient_id': sample_patient.id,
            'records': [
                {'tooth_number': 16, 'probing_depth_b': 2},
                {'tooth_number': 26, 'probing_depth_b': 4},
                {'notes': 'missing tooth_number should be ignored'},
            ],
        },
        headers=admin_auth_headers,
    )

    assert response.status_code == 201
    payload = response.get_json()
    assert len(payload) == 2
    numbers = sorted(item['tooth_number'] for item in payload)
    assert numbers == [16, 26]


def test_create_list_and_annul_prescription(client, admin_auth_headers, sample_patient):
    response_create = client.post(
        '/api/clinical-history/prescriptions',
        json={
            'patient_id': sample_patient.id,
            'content': 'Ibuprofeno 400mg cada 8 horas por 3 dias',
            'notes': 'Con alimentos',
        },
        headers=admin_auth_headers,
    )

    assert response_create.status_code == 201
    payload_create = response_create.get_json()
    prescription_id = payload_create['id']

    response_list = client.get(
        f'/api/clinical-history/prescriptions?patient_id={sample_patient.id}',
        headers=admin_auth_headers,
    )
    assert response_list.status_code == 200
    listed = response_list.get_json()
    assert len(listed) == 1
    assert listed[0]['id'] == prescription_id

    response_annul = client.post(
        f'/api/clinical-history/prescriptions/{prescription_id}/annul',
        headers=admin_auth_headers,
    )
    assert response_annul.status_code == 200
    assert response_annul.get_json()['status'] == 'annulled'

    response_list_without_annulled = client.get(
        f'/api/clinical-history/prescriptions?patient_id={sample_patient.id}',
        headers=admin_auth_headers,
    )
    assert response_list_without_annulled.status_code == 200
    assert response_list_without_annulled.get_json() == []

    response_list_with_annulled = client.get(
        f'/api/clinical-history/prescriptions?patient_id={sample_patient.id}&include_annulled=true',
        headers=admin_auth_headers,
    )
    assert response_list_with_annulled.status_code == 200
    assert response_list_with_annulled.get_json()[0]['status'] == 'annulled'


def test_patient_cannot_access_other_patient_periodontal(client, app, sample_patient):
    patient_headers = _login_patient_headers(client)
    other_patient_id = _create_secondary_patient(app)

    response = client.get(
        f'/api/clinical-history/periodontal?patient_id={other_patient_id}',
        headers=patient_headers,
    )

    assert response.status_code == 403
    assert response.get_json()['msg'] == 'Unauthorized'
