# -*- coding: utf-8 -*-
"""Regression tests for clinical-history documents, consents and timeline."""

import io

from app.extensions import db
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
            email='timeline-other-patient@test.com',
            first_name='Timeline',
            last_name='Other',
            role='patient',
        )
        patient.set_password('Patient123')
        db.session.add(patient)
        db.session.commit()
        return patient.id


def test_patient_document_metadata_crud(client, auth_headers, sample_patient):
    create_response = client.post(
        '/api/clinical-history/documents',
        json={
            'patient_id': sample_patient.id,
            'document_type': 'lab_result',
            'title': 'Laboratorio',
            'description': 'Hemograma completo',
        },
        headers=auth_headers,
    )
    assert create_response.status_code == 201
    document_id = create_response.get_json()['id']

    list_response = client.get(
        f'/api/clinical-history/documents?patient_id={sample_patient.id}',
        headers=auth_headers,
    )
    assert list_response.status_code == 200
    assert len(list_response.get_json()) == 1

    delete_response = client.delete(
        f'/api/clinical-history/documents/{document_id}',
        headers=auth_headers,
    )
    assert delete_response.status_code == 200

    active_list_response = client.get(
        f'/api/clinical-history/documents?patient_id={sample_patient.id}',
        headers=auth_headers,
    )
    assert active_list_response.status_code == 200
    assert active_list_response.get_json() == []

    full_list_response = client.get(
        f'/api/clinical-history/documents?patient_id={sample_patient.id}&include_inactive=true',
        headers=auth_headers,
    )
    assert full_list_response.status_code == 200
    assert len(full_list_response.get_json()) == 1
    assert full_list_response.get_json()[0]['is_active'] is False


def test_upload_and_download_patient_document(client, auth_headers, sample_patient):
    upload_response = client.post(
        '/api/clinical-history/documents/upload',
        data={
            'file': (io.BytesIO(b'contenido-clinico'), 'adjunto.pdf'),
            'patient_id': str(sample_patient.id),
            'document_type': 'xray_panoramic',
            'title': 'Adjunto RX',
            'description': 'Prueba',
        },
        headers=auth_headers,
        content_type='multipart/form-data',
    )

    assert upload_response.status_code == 201
    payload = upload_response.get_json()
    document_id = payload['id']
    assert payload['file_name'] == 'adjunto.pdf'

    download_response = client.get(
        f'/api/clinical-history/documents/{document_id}/download',
        headers=auth_headers,
    )
    assert download_response.status_code == 200
    assert download_response.data == b'contenido-clinico'


def test_clinical_documents_crud(client, auth_headers, sample_patient):
    create_response = client.post(
        '/api/clinical-history/clinical-docs',
        json={
            'patient_id': sample_patient.id,
            'document_type': 'clinical_summary',
            'title': 'Resumen clinico',
            'content': 'Contenido del resumen',
        },
        headers=auth_headers,
    )
    assert create_response.status_code == 201
    document_id = create_response.get_json()['id']

    list_response = client.get(
        f'/api/clinical-history/clinical-docs?patient_id={sample_patient.id}',
        headers=auth_headers,
    )
    assert list_response.status_code == 200
    assert len(list_response.get_json()) == 1

    delete_response = client.delete(
        f'/api/clinical-history/clinical-docs/{document_id}',
        headers=auth_headers,
    )
    assert delete_response.status_code == 200

    active_list_response = client.get(
        f'/api/clinical-history/clinical-docs?patient_id={sample_patient.id}',
        headers=auth_headers,
    )
    assert active_list_response.status_code == 200
    assert active_list_response.get_json() == []

    full_list_response = client.get(
        f'/api/clinical-history/clinical-docs?patient_id={sample_patient.id}&include_inactive=true',
        headers=auth_headers,
    )
    assert full_list_response.status_code == 200
    assert len(full_list_response.get_json()) == 1
    assert full_list_response.get_json()[0]['is_active'] is False


def test_consent_sign_reject_and_filters(client, auth_headers, sample_patient):
    patient_headers = _login_patient_headers(client)

    create_signed_response = client.post(
        '/api/clinical-history/consents',
        json={
            'patient_id': sample_patient.id,
            'consent_type': 'general_treatment',
            'title': 'Consentimiento tratamiento',
            'content': 'Texto',
        },
        headers=auth_headers,
    )
    assert create_signed_response.status_code == 201
    consent_to_sign = create_signed_response.get_json()['id']

    sign_response = client.post(
        f'/api/clinical-history/consents/{consent_to_sign}/sign',
        json={'patient_signature': 'firma-paciente'},
        headers=patient_headers,
    )
    assert sign_response.status_code == 200
    assert sign_response.get_json()['status'] == 'signed'

    create_rejected_response = client.post(
        '/api/clinical-history/consents',
        json={
            'patient_id': sample_patient.id,
            'consent_type': 'sedation',
            'title': 'Consentimiento sedacion',
        },
        headers=auth_headers,
    )
    assert create_rejected_response.status_code == 201
    consent_to_reject = create_rejected_response.get_json()['id']

    reject_response = client.post(
        f'/api/clinical-history/consents/{consent_to_reject}/reject',
        json={'reason': 'No acepto por ahora'},
        headers=patient_headers,
    )
    assert reject_response.status_code == 200
    assert reject_response.get_json()['status'] == 'rejected'

    signed_list_response = client.get(
        f'/api/clinical-history/consents?patient_id={sample_patient.id}&status=signed',
        headers=auth_headers,
    )
    assert signed_list_response.status_code == 200
    assert len(signed_list_response.get_json()) == 1
    assert signed_list_response.get_json()[0]['status'] == 'signed'

    rejected_list_response = client.get(
        f'/api/clinical-history/consents?patient_id={sample_patient.id}&status=rejected',
        headers=auth_headers,
    )
    assert rejected_list_response.status_code == 200
    assert len(rejected_list_response.get_json()) == 1
    assert rejected_list_response.get_json()[0]['status'] == 'rejected'


def test_timeline_and_summary_counts(client, auth_headers, sample_patient):
    timeline_create_response = client.post(
        '/api/clinical-history/timeline',
        json={
            'patient_id': sample_patient.id,
            'event_type': 'alert',
            'title': 'Alerta manual',
            'description': 'Seguimiento urgente',
        },
        headers=auth_headers,
    )
    assert timeline_create_response.status_code == 201

    client.post(
        '/api/clinical-history/documents',
        json={
            'patient_id': sample_patient.id,
            'document_type': 'other',
            'title': 'Doc resumen',
        },
        headers=auth_headers,
    )
    client.post(
        '/api/clinical-history/clinical-docs',
        json={
            'patient_id': sample_patient.id,
            'document_type': 'clinical_summary',
            'title': 'Resumen',
        },
        headers=auth_headers,
    )
    client.post(
        '/api/clinical-history/consents',
        json={
            'patient_id': sample_patient.id,
            'consent_type': 'general_treatment',
            'title': 'Consent pendiente',
        },
        headers=auth_headers,
    )

    timeline_response = client.get(
        f'/api/clinical-history/timeline?patient_id={sample_patient.id}&event_type=alert',
        headers=auth_headers,
    )
    assert timeline_response.status_code == 200
    assert len(timeline_response.get_json()) == 1
    assert timeline_response.get_json()[0]['event_type'] == 'alert'

    summary_response = client.get(
        f'/api/clinical-history/summary/{sample_patient.id}',
        headers=auth_headers,
    )
    assert summary_response.status_code == 200
    summary = summary_response.get_json()
    assert summary['counts']['documents'] == 1
    assert summary['counts']['clinical_documents'] == 1
    assert summary['counts']['consents_pending'] == 1
    assert len(summary['recent_events']) >= 1


def test_patient_cannot_access_other_patient_timeline(client, app, sample_patient):
    patient_headers = _login_patient_headers(client)
    other_patient_id = _create_secondary_patient(app)

    response = client.get(
        f'/api/clinical-history/timeline?patient_id={other_patient_id}',
        headers=patient_headers,
    )
    assert response.status_code == 403
    assert response.get_json()['msg'] == 'Unauthorized'

