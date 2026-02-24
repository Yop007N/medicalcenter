# -*- coding: utf-8 -*-
"""Appointment access policy tests."""

from datetime import datetime, timedelta

from app.extensions import db
from app.models.appointment import Appointment
from app.models.patient import Patient
from app.models.professional import Professional


def _create_professional(email, password, license_number):
    professional = Professional(
        email=email,
        first_name="Other",
        last_name="Professional",
        role="professional",
        license_number=license_number,
        specialty="General Medicine",
        is_active=True,
    )
    professional.set_password(password)
    db.session.add(professional)
    db.session.commit()
    return professional


def _create_patient(email, password):
    patient = Patient(
        email=email,
        first_name="Other",
        last_name="Patient",
        role="patient",
        is_active=True,
    )
    patient.set_password(password)
    db.session.add(patient)
    db.session.commit()
    return patient


def _create_appointment(patient_id, professional_id, days=1):
    appointment = Appointment(
        patient_id=patient_id,
        professional_id=professional_id,
        appointment_date=datetime.now() + timedelta(days=days),
        duration_minutes=30,
        status="scheduled",
        reason="Access test",
    )
    db.session.add(appointment)
    db.session.commit()
    return appointment


def _login_headers(client, email, password):
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )
    token = response.json["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_professional_cannot_view_other_professional_appointment(client, app, auth_headers, sample_professional, sample_patient):
    with app.app_context():
        other_professional = _create_professional(
            email="otherdoc@test.com",
            password="Doctor123",
            license_number="OTHER-123",
        )
        appointment = _create_appointment(
            patient_id=sample_patient.id,
            professional_id=other_professional.id,
        )
        appointment_id = appointment.id

    response = client.get(f"/api/appointments/{appointment_id}", headers=auth_headers)

    assert response.status_code == 403


def test_professional_list_is_scoped_to_own_appointments(client, app, auth_headers, sample_professional, sample_patient):
    with app.app_context():
        other_professional = _create_professional(
            email="otherdoc2@test.com",
            password="Doctor123",
            license_number="OTHER-456",
        )
        _create_appointment(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            days=1,
        )
        _create_appointment(
            patient_id=sample_patient.id,
            professional_id=other_professional.id,
            days=2,
        )

    response = client.get("/api/appointments", headers=auth_headers)

    assert response.status_code == 200
    data = response.json
    assert len(data["items"]) == 1
    assert data["items"][0]["professional_id"] == sample_professional.id


def test_professional_cannot_create_for_other_professional(client, app, auth_headers, sample_professional, sample_patient):
    with app.app_context():
        other_professional = _create_professional(
            email="otherdoc3@test.com",
            password="Doctor123",
            license_number="OTHER-789",
        )
        other_professional_id = other_professional.id

    response = client.post(
        "/api/appointments",
        headers=auth_headers,
        json={
            "patient_id": sample_patient.id,
            "professional_id": other_professional_id,
            "appointment_date": (datetime.now() + timedelta(days=3)).isoformat(),
        },
    )

    assert response.status_code == 403


def test_patient_list_is_scoped_to_own_appointments(client, app, sample_professional, sample_patient):
    with app.app_context():
        other_patient = _create_patient(
            email="otherpatient@test.com",
            password="Patient123",
        )
        _create_appointment(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            days=1,
        )
        _create_appointment(
            patient_id=other_patient.id,
            professional_id=sample_professional.id,
            days=2,
        )

    patient_headers = _login_headers(client, "testpatient@test.com", "Patient123")
    response = client.get("/api/appointments", headers=patient_headers)

    assert response.status_code == 200
    data = response.json
    assert len(data["items"]) == 1
    assert data["items"][0]["patient_id"] == sample_patient.id


def test_admin_can_confirm_any_appointment(client, app, admin_auth_headers, sample_patient):
    with app.app_context():
        other_professional = _create_professional(
            email="otherdoc4@test.com",
            password="Doctor123",
            license_number="OTHER-999",
        )
        appointment = _create_appointment(
            patient_id=sample_patient.id,
            professional_id=other_professional.id,
        )
        appointment_id = appointment.id

    response = client.post(f"/api/appointments/{appointment_id}/confirm", headers=admin_auth_headers)

    assert response.status_code == 200
    assert response.json["status"] == "confirmed"
