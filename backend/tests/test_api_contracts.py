# -*- coding: utf-8 -*-
"""API contract tests for actor-facing endpoints used by all frontends."""

from datetime import datetime, timedelta
from decimal import Decimal

from app.extensions import db
from app.models.appointment import Appointment
from app.models.budget import Budget
from app.models.file import File
from app.models.medical_record import MedicalRecord
from app.models.odontogram import Odontogram, Tooth
from app.models.patient import Patient
from app.models.payment import Payment
from app.models.professional import Professional
from app.models.professional_patient_assignment import ProfessionalPatientAssignment
from app.models.specialty_encounter import SpecialtyEncounter


def _login_headers(client, email: str, password: str) -> dict:
    response = client.post('/api/auth/login', json={'email': email, 'password': password})
    assert response.status_code == 200
    token = response.get_json()['access_token']
    return {'Authorization': f'Bearer {token}'}


def _assert_has_keys(payload: dict, expected_keys: set[str]) -> None:
    assert isinstance(payload, dict)
    for key in expected_keys:
        assert key in payload


def _extract_items(payload):
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict) and isinstance(payload.get('items'), list):
        return payload['items']
    assert False, f'Unsupported payload type for collection contract: {type(payload)}'


def _assert_list_item_contract(payload, expected_keys: set[str]) -> None:
    items = _extract_items(payload)
    if items:
        _assert_has_keys(items[0], expected_keys)


def test_auth_login_contract_returns_session_payload(client, sample_professional):
    response = client.post(
        '/api/auth/login',
        json={'email': 'testdoc@test.com', 'password': 'Doctor123'},
    )
    assert response.status_code == 200

    payload = response.get_json()
    _assert_has_keys(payload, {'access_token', 'user'})
    _assert_has_keys(payload['user'], {'id', 'email', 'role', 'first_name', 'last_name'})
    assert payload['user']['role'] == 'professional'


def test_professional_workspace_contracts(client, app):
    with app.app_context():
        professional = Professional(
            email='contract.professional@test.com',
            first_name='Contract',
            last_name='Professional',
            role='professional',
            specialty='Cardiología',
            license_number='CONTRACT-PRO-001',
        )
        professional.set_password('Doctor123')

        patient = Patient(
            email='contract.patient@test.com',
            first_name='Contract',
            last_name='Patient',
            role='patient',
        )
        patient.set_password('Patient123')

        db.session.add_all([professional, patient])
        db.session.flush()

        db.session.add(
            ProfessionalPatientAssignment(
                professional_id=professional.id,
                patient_id=patient.id,
                specialty_key='cardiology',
            )
        )

        appointment = Appointment(
            patient_id=patient.id,
            professional_id=professional.id,
            appointment_date=datetime.utcnow() + timedelta(days=2),
            duration_minutes=30,
            status='confirmed',
            appointment_type='follow_up',
            reason='Contract check',
        )
        medical_record = MedicalRecord(
            patient_id=patient.id,
            professional_id=professional.id,
            diagnosis='Contract diagnosis',
            treatment='Contract treatment',
            chief_complaint='Contract complaint',
            notes='Contract notes',
        )

        db.session.add_all([appointment, medical_record])
        db.session.flush()

        budget = Budget(
            patient_id=patient.id,
            created_by=professional.id,
            title='Contract Budget',
            total_amount=Decimal('100000.00'),
            currency='PYG',
            status='accepted',
        )
        db.session.add(budget)
        db.session.flush()

        payment = Payment(
            budget_id=budget.id,
            amount=Decimal('40000.00'),
            payment_method='cash',
            payment_status='completed',
        )
        encounter = SpecialtyEncounter(
            patient_id=patient.id,
            professional_id=professional.id,
            specialty_key='cardiology',
            visit_date=datetime.utcnow(),
            status='open',
            chief_complaint='Contract encounter',
            diagnosis='Stable',
        )
        file_entry = File(
            medical_record_id=medical_record.id,
            filename='contract-report.pdf',
            file_type='report',
            mime_type='application/pdf',
            file_size=1024,
            storage_type='local',
            file_path='storage/files/contract-report.pdf',
            uploaded_by=professional.id,
        )

        db.session.add_all([payment, encounter, file_entry])
        db.session.commit()
        patient_id = patient.id

    headers = _login_headers(client, 'contract.professional@test.com', 'Doctor123')

    patients_response = client.get('/api/patients?specialty_key=cardiology', headers=headers)
    assert patients_response.status_code == 200
    _assert_list_item_contract(patients_response.get_json(), {'id', 'email', 'first_name', 'last_name'})

    appointments_response = client.get('/api/appointments?specialty_key=cardiology', headers=headers)
    assert appointments_response.status_code == 200
    _assert_list_item_contract(
        appointments_response.get_json(),
        {'id', 'patient_id', 'professional_id', 'appointment_date', 'status'},
    )

    records_response = client.get('/api/medical-records?specialty_key=cardiology', headers=headers)
    assert records_response.status_code == 200
    _assert_list_item_contract(records_response.get_json(), {'id', 'patient_id', 'professional_id'})

    budgets_response = client.get('/api/budgets?specialty_key=cardiology', headers=headers)
    assert budgets_response.status_code == 200
    _assert_list_item_contract(budgets_response.get_json(), {'id', 'patient_id', 'status', 'total_amount'})

    payments_response = client.get('/api/payments?specialty_key=cardiology', headers=headers)
    assert payments_response.status_code == 200
    _assert_list_item_contract(payments_response.get_json(), {'id', 'amount', 'payment_method', 'payment_status'})

    files_response = client.get(
        f'/api/files?specialty_key=cardiology&patient_id={patient_id}',
        headers=headers,
    )
    assert files_response.status_code == 200
    _assert_list_item_contract(files_response.get_json(), {'id', 'filename', 'file_type', 'medical_record_id'})

    module_response = client.get('/api/specialties/my-module', headers=headers)
    assert module_response.status_code == 200
    module_payload = module_response.get_json()
    _assert_has_keys(module_payload, {'actor', 'user_id', 'specialty', 'module'})
    _assert_has_keys(module_payload['module'], {'key', 'label', 'route'})

    overview_response = client.get('/api/specialties/my-module/overview?specialty_key=cardiology', headers=headers)
    assert overview_response.status_code == 200
    overview_payload = overview_response.get_json()
    _assert_has_keys(
        overview_payload,
        {'module', 'totals', 'patients', 'upcoming_appointments', 'recent_medical_records', 'generated_at'},
    )
    _assert_has_keys(
        overview_payload['totals'],
        {'patients', 'appointments_total', 'medical_records', 'payments_completed', 'currency'},
    )

    history_response = client.get(
        f'/api/specialties/history?specialty_key=cardiology&patient_id={patient_id}',
        headers=headers,
    )
    assert history_response.status_code == 200
    history_payload = history_response.get_json()
    _assert_has_keys(
        history_payload,
        {'module', 'filters', 'totals', 'appointments', 'medical_records', 'specialty_encounters', 'documents'},
    )
    _assert_has_keys(history_payload['filters'], {'specialty_key', 'patient_id'})
    _assert_has_keys(history_payload['totals'], {'appointments', 'medical_records', 'encounters', 'documents'})


def test_patient_portal_contracts(client, app):
    with app.app_context():
        patient = Patient(
            email='contract.patient-portal@test.com',
            first_name='Portal',
            last_name='Patient',
            role='patient',
        )
        patient.set_password('Patient123')

        professional = Professional(
            email='contract.patient-portal.prof@test.com',
            first_name='Portal',
            last_name='Professional',
            role='professional',
            specialty='Odontología',
            license_number='CONTRACT-PORTAL-001',
        )
        professional.set_password('Doctor123')
        db.session.add_all([patient, professional])
        db.session.flush()
        patient_id = patient.id

        db.session.add(
            ProfessionalPatientAssignment(
                professional_id=professional.id,
                patient_id=patient_id,
                specialty_key='odontology',
            )
        )

        appointment = Appointment(
            patient_id=patient_id,
            professional_id=professional.id,
            appointment_date=datetime.utcnow() + timedelta(days=1),
            duration_minutes=30,
            status='scheduled',
            appointment_type='consultation',
            reason='Patient portal contract',
        )
        medical_record = MedicalRecord(
            patient_id=patient_id,
            professional_id=professional.id,
            diagnosis='Portal diagnosis',
            treatment='Portal treatment',
            chief_complaint='Portal complaint',
            notes='Portal notes',
        )
        db.session.add_all([appointment, medical_record])
        db.session.flush()

        budget = Budget(
            patient_id=patient_id,
            created_by=professional.id,
            title='Portal Budget',
            total_amount=Decimal('75000.00'),
            currency='PYG',
            status='sent',
        )
        db.session.add(budget)
        db.session.flush()

        payment = Payment(
            budget_id=budget.id,
            amount=Decimal('10000.00'),
            payment_method='transfer',
            payment_status='pending',
        )
        odontogram = Odontogram(
            patient_id=patient_id,
            professional_id=professional.id,
            notes='Portal odontogram',
            is_active=True,
        )
        db.session.add_all([payment, odontogram])
        db.session.flush()

        tooth = Tooth(
            odontogram_id=odontogram.id,
            tooth_number=11,
            status='healthy',
            planned_treatment='control',
        )
        db.session.add(tooth)
        db.session.commit()

    patient_auth_headers = _login_headers(
        client,
        'contract.patient-portal@test.com',
        'Patient123',
    )

    profile_response = client.get(f'/api/patients/{patient_id}', headers=patient_auth_headers)
    assert profile_response.status_code == 200
    _assert_has_keys(
        profile_response.get_json(),
        {'id', 'email', 'first_name', 'last_name', 'role', 'date_of_birth', 'phone'},
    )

    appointments_response = client.get(
        f'/api/patients/{patient_id}/appointments',
        headers=patient_auth_headers,
    )
    assert appointments_response.status_code == 200
    _assert_list_item_contract(
        appointments_response.get_json(),
        {'id', 'appointment_date', 'status', 'professional'},
    )

    budgets_response = client.get(f'/api/patients/{patient_id}/budgets', headers=patient_auth_headers)
    assert budgets_response.status_code == 200
    _assert_list_item_contract(
        budgets_response.get_json(),
        {'id', 'title', 'status', 'total_amount', 'currency'},
    )

    medical_history_response = client.get(
        f'/api/patients/{patient_id}/medical-history',
        headers=patient_auth_headers,
    )
    assert medical_history_response.status_code == 200
    _assert_list_item_contract(
        medical_history_response.get_json(),
        {'id', 'patient_id', 'professional_id', 'diagnosis', 'treatment'},
    )

    odontogram_response = client.get(
        f'/api/patients/{patient_id}/odontogram',
        headers=patient_auth_headers,
    )
    assert odontogram_response.status_code == 200
    odontogram_payload = odontogram_response.get_json()
    _assert_has_keys(odontogram_payload, {'id', 'patient_id', 'professional_id', 'is_active', 'teeth'})
    assert isinstance(odontogram_payload['teeth'], list)

    summary_response = client.get(
        f'/api/clinical-history/summary/{patient_id}',
        headers=patient_auth_headers,
    )
    assert summary_response.status_code == 200
    summary_payload = summary_response.get_json()
    _assert_has_keys(summary_payload, {'patient_id', 'counts', 'recent_events', 'has_anamnesis'})
    _assert_has_keys(summary_payload['counts'], {'evolutions', 'prescriptions', 'documents'})

    slots_response = client.get('/api/professionals/available-slots', headers=patient_auth_headers)
    assert slots_response.status_code == 200
    slots_payload = slots_response.get_json()
    assert isinstance(slots_payload, list)
    if slots_payload:
        _assert_has_keys(
            slots_payload[0],
            {'id', 'first_name', 'last_name', 'specialty', 'available_slots', 'next_available_slot'},
        )
