# -*- coding: utf-8 -*-
"""
Integration tests for complete workflows
"""

from datetime import datetime, timedelta
import io


def sample_patient_headers(client):
    """Authenticate as fixture sample patient."""
    response = client.post(
        '/api/auth/login',
        json={'email': 'testpatient@test.com', 'password': 'Patient123'},
    )
    assert response.status_code == 200
    return {'Authorization': f"Bearer {response.get_json()['access_token']}"}


def test_complete_appointment_workflow(
    client,
    auth_headers,
    sample_patient,
    sample_professional,
):
    """
    Test complete appointment workflow:
    1. Create patient
    2. Create professional
    3. Create appointment
    4. Confirm appointment
    5. Create medical record
    6. Upload files
    """
    appointment_date = (datetime.utcnow() + timedelta(days=2)).isoformat()
    appointment_response = client.post(
        '/api/appointments',
        headers=auth_headers,
        json={
            'patient_id': sample_patient.id,
            'professional_id': sample_professional.id,
            'appointment_date': appointment_date,
            'duration_minutes': 45,
            'appointment_type': 'consultation',
            'reason': 'Integration workflow test'
        }
    )
    assert appointment_response.status_code == 201
    appointment = appointment_response.get_json()
    appointment_id = appointment['id']
    assert appointment['status'] == 'scheduled'

    confirm_response = client.post(
        f'/api/appointments/{appointment_id}/confirm',
        headers=auth_headers
    )
    assert confirm_response.status_code == 200
    assert confirm_response.get_json()['status'] == 'confirmed'

    medical_record_response = client.post(
        '/api/medical-records',
        headers=auth_headers,
        json={
            'patient_id': sample_patient.id,
            'appointment_id': appointment_id,
            'chief_complaint': 'Dolor de muela',
            'symptoms': 'Dolor intermitente',
            'diagnosis': 'Caries',
            'treatment': 'Limpieza y restauracion'
        }
    )
    assert medical_record_response.status_code == 201
    medical_record = medical_record_response.get_json()
    medical_record_id = medical_record['id']
    assert medical_record['patient_id'] == sample_patient.id

    upload_response = client.post(
        '/api/files/upload',
        headers=auth_headers,
        content_type='multipart/form-data',
        data={
            'file': (io.BytesIO(b'workflow-file'), 'workflow.pdf'),
            'medical_record_id': str(medical_record_id),
            'file_type': 'lab_result',
            'description': 'Archivo adjunto de workflow'
        }
    )
    assert upload_response.status_code == 201
    uploaded_file = upload_response.get_json()
    assert uploaded_file['medical_record_id'] == medical_record_id
    assert uploaded_file['file_type'] == 'lab_result'

    get_appointment_response = client.get(
        f'/api/appointments/{appointment_id}',
        headers=auth_headers
    )
    assert get_appointment_response.status_code == 200
    assert get_appointment_response.get_json()['status'] == 'confirmed'

    get_record_response = client.get(
        f'/api/medical-records/{medical_record_id}',
        headers=auth_headers
    )
    assert get_record_response.status_code == 200
    assert get_record_response.get_json()['appointment_id'] == appointment_id


def test_budget_payment_workflow(
    client,
    auth_headers,
    admin_auth_headers,
    sample_patient,
):
    """
    Test budget and payment workflow:
    1. Create budget
    2. Send to patient
    3. Patient accepts
    4. Process payment
    """
    budget_response = client.post(
        '/api/budgets',
        headers=auth_headers,
        json={
            'patient_id': sample_patient.id,
            'title': 'Workflow budget',
            'description': 'Budget workflow integration test',
            'total_amount': 3200.00
        }
    )
    assert budget_response.status_code == 201
    budget = budget_response.get_json()
    budget_id = budget['id']
    assert budget['status'] == 'draft'

    send_response = client.post(
        f'/api/budgets/{budget_id}/send',
        headers=auth_headers
    )
    assert send_response.status_code == 200
    assert send_response.get_json()['status'] == 'sent'

    accept_response = client.post(
        f'/api/budgets/{budget_id}/accept',
        headers=sample_patient_headers(client),
    )
    assert accept_response.status_code == 200
    assert accept_response.get_json()['status'] == 'accepted'

    payment_response = client.post(
        '/api/payments',
        headers=auth_headers,
        json={
            'budget_id': budget_id,
            'amount': 3200.00,
            'payment_method': 'transfer',
            'notes': 'Workflow payment'
        }
    )
    assert payment_response.status_code == 201
    payment = payment_response.get_json()
    payment_id = payment['id']
    assert payment['payment_status'] == 'pending'

    process_response = client.post(
        f'/api/payments/{payment_id}/process',
        headers=auth_headers,
        json={'transaction_reference': 'WFLOW-TXN-001'}
    )
    assert process_response.status_code == 200
    processed_payment = process_response.get_json()
    assert processed_payment['payment_status'] == 'completed'
    assert processed_payment['transaction_reference'] == 'WFLOW-TXN-001'

    detail_budget_response = client.get(
        f'/api/budgets/{budget_id}',
        headers=auth_headers
    )
    assert detail_budget_response.status_code == 200
    assert detail_budget_response.get_json()['status'] == 'accepted'

    detail_payment_response = client.get(
        f'/api/payments/{payment_id}',
        headers=auth_headers
    )
    assert detail_payment_response.status_code == 200
    assert detail_payment_response.get_json()['payment_status'] == 'completed'

    start_date = (datetime.utcnow() - timedelta(days=1)).strftime('%Y-%m-%d')
    end_date = (datetime.utcnow() + timedelta(days=1)).strftime('%Y-%m-%d')

    revenue_response = client.get(
        '/api/reports/financial/revenue',
        headers=admin_auth_headers,
        query_string={'start_date': start_date, 'end_date': end_date}
    )
    assert revenue_response.status_code == 200
    revenue_report = revenue_response.get_json()
    assert any(item['id'] == payment_id for item in revenue_report['payments'])
