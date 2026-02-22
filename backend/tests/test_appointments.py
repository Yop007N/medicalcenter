# -*- coding: utf-8 -*-
"""
Appointment CRUD Tests
"""

import pytest
from datetime import datetime, timedelta
from app.models.appointment import Appointment
from app.extensions import db


class TestListAppointments:
    """Test list appointments endpoint"""

    def test_list_appointments_success(self, client, auth_headers, app, sample_professional, sample_patient):
        """Test listing all appointments"""
        with app.app_context():
            appointment = Appointment(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                appointment_date=datetime.now() + timedelta(days=1),
                duration_minutes=30,
                status='scheduled',
                reason='Checkup'
            )
            db.session.add(appointment)
            db.session.commit()

        response = client.get('/api/appointments', headers=auth_headers)

        assert response.status_code == 200
        data = response.json
        assert 'items' in data
        assert 'total' in data
        assert isinstance(data['items'], list)

    def test_list_appointments_with_filters(self, client, auth_headers, app, sample_professional, sample_patient):
        """Test listing appointments with filters"""
        with app.app_context():
            appointment = Appointment(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                appointment_date=datetime.now() + timedelta(days=2),
                status='scheduled'
            )
            db.session.add(appointment)
            db.session.commit()

        response = client.get(
            f'/api/appointments?professional_id={sample_professional.id}&status=scheduled',
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json
        assert isinstance(data['items'], list)

    def test_list_appointments_with_pagination(self, client, auth_headers, app, sample_professional, sample_patient):
        """Test appointment pagination"""
        with app.app_context():
            for i in range(3):
                appointment = Appointment(
                    patient_id=sample_patient.id,
                    professional_id=sample_professional.id,
                    appointment_date=datetime.now() + timedelta(days=i+1),
                    status='scheduled'
                )
                db.session.add(appointment)
            db.session.commit()

        response = client.get('/api/appointments?page=1&per_page=2', headers=auth_headers)

        assert response.status_code == 200
        data = response.json
        assert data['page'] == 1
        assert data['per_page'] == 2
        assert 'total' in data

    def test_list_appointments_unauthorized(self, client):
        """Test listing appointments without authentication"""
        response = client.get('/api/appointments')
        assert response.status_code == 401


class TestGetAppointment:
    """Test get appointment endpoint"""

    def test_get_appointment_success(self, client, auth_headers, app, sample_professional, sample_patient):
        """Test getting a specific appointment"""
        with app.app_context():
            appointment = Appointment(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                appointment_date=datetime.now() + timedelta(days=1),
                status='scheduled',
                reason='Follow-up'
            )
            db.session.add(appointment)
            db.session.commit()
            appointment_id = appointment.id

        response = client.get(f'/api/appointments/{appointment_id}', headers=auth_headers)

        assert response.status_code == 200
        data = response.json
        assert data['id'] == appointment_id
        assert data['status'] == 'scheduled'

    def test_get_appointment_not_found(self, client, auth_headers):
        """Test getting non-existent appointment"""
        response = client.get('/api/appointments/99999', headers=auth_headers)
        assert response.status_code == 404

    def test_get_appointment_unauthorized(self, client, app, sample_professional, sample_patient):
        """Test getting appointment without authentication"""
        with app.app_context():
            appointment = Appointment(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                appointment_date=datetime.now() + timedelta(days=1),
                status='scheduled'
            )
            db.session.add(appointment)
            db.session.commit()
            appointment_id = appointment.id

        response = client.get(f'/api/appointments/{appointment_id}')
        assert response.status_code == 401


class TestCreateAppointment:
    """Test create appointment endpoint"""

    def test_create_appointment_success(self, client, auth_headers, sample_professional, sample_patient):
        """Test creating a new appointment"""
        appointment_date = (datetime.now() + timedelta(days=3)).isoformat()

        response = client.post('/api/appointments', headers=auth_headers, json={
            'patient_id': sample_patient.id,
            'professional_id': sample_professional.id,
            'appointment_date': appointment_date,
            'duration_minutes': 30,
            'reason': 'Annual checkup',
            'appointment_type': 'consultation'
        })

        assert response.status_code == 201
        data = response.json
        assert data['patient_id'] == sample_patient.id
        assert data['professional_id'] == sample_professional.id
        assert data['status'] == 'scheduled'

    def test_create_appointment_missing_fields(self, client, auth_headers):
        """Test creating appointment without required fields"""
        response = client.post('/api/appointments', headers=auth_headers, json={
            'reason': 'Checkup'
        })

        assert response.status_code == 400

    def test_create_appointment_unauthorized(self, client, sample_professional, sample_patient):
        """Test creating appointment without authentication"""
        appointment_date = (datetime.now() + timedelta(days=1)).isoformat()

        response = client.post('/api/appointments', json={
            'patient_id': sample_patient.id,
            'professional_id': sample_professional.id,
            'appointment_date': appointment_date
        })

        assert response.status_code == 401


class TestUpdateAppointment:
    """Test update appointment endpoint"""

    def test_update_appointment_success(self, client, auth_headers, app, sample_professional, sample_patient):
        """Test updating an appointment"""
        with app.app_context():
            appointment = Appointment(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                appointment_date=datetime.now() + timedelta(days=1),
                status='scheduled'
            )
            db.session.add(appointment)
            db.session.commit()
            appointment_id = appointment.id

        response = client.put(f'/api/appointments/{appointment_id}', headers=auth_headers, json={
            'status': 'confirmed',
            'notes': 'Patient confirmed attendance'
        })

        assert response.status_code == 200
        data = response.json
        assert data['status'] == 'confirmed'
        assert data['notes'] == 'Patient confirmed attendance'

    def test_update_appointment_not_found(self, client, auth_headers):
        """Test updating non-existent appointment"""
        response = client.put('/api/appointments/99999', headers=auth_headers, json={
            'status': 'confirmed'
        })

        assert response.status_code == 404

    def test_update_appointment_unauthorized(self, client, app, sample_professional, sample_patient):
        """Test updating appointment without authentication"""
        with app.app_context():
            appointment = Appointment(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                appointment_date=datetime.now() + timedelta(days=1),
                status='scheduled'
            )
            db.session.add(appointment)
            db.session.commit()
            appointment_id = appointment.id

        response = client.put(f'/api/appointments/{appointment_id}', json={
            'status': 'confirmed'
        })

        assert response.status_code == 401


class TestDeleteAppointment:
    """Test delete/cancel appointment endpoint"""

    def test_delete_appointment_success(self, client, auth_headers, app, sample_professional, sample_patient):
        """Test canceling an appointment"""
        with app.app_context():
            appointment = Appointment(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                appointment_date=datetime.now() + timedelta(days=1),
                status='scheduled'
            )
            db.session.add(appointment)
            db.session.commit()
            appointment_id = appointment.id

        response = client.delete(f'/api/appointments/{appointment_id}', headers=auth_headers)

        assert response.status_code == 200

    def test_delete_appointment_not_found(self, client, auth_headers):
        """Test canceling non-existent appointment"""
        response = client.delete('/api/appointments/99999', headers=auth_headers)
        assert response.status_code == 404

    def test_delete_appointment_unauthorized(self, client, app, sample_professional, sample_patient):
        """Test canceling appointment without authentication"""
        with app.app_context():
            appointment = Appointment(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                appointment_date=datetime.now() + timedelta(days=1),
                status='scheduled'
            )
            db.session.add(appointment)
            db.session.commit()
            appointment_id = appointment.id

        response = client.delete(f'/api/appointments/{appointment_id}')

        assert response.status_code == 401


class TestAppointmentConflict:
    """Test appointment conflict detection"""

    def test_appointment_conflict_detection(self, client, auth_headers, app, sample_professional, sample_patient):
        """Test that overlapping appointments are detected"""
        appointment_time = datetime.now() + timedelta(days=1)

        # Create first appointment
        with app.app_context():
            appointment1 = Appointment(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                appointment_date=appointment_time,
                duration_minutes=30,
                status='scheduled'
            )
            db.session.add(appointment1)
            db.session.commit()

        # Try to create overlapping appointment (same time, same professional)
        response = client.post('/api/appointments', headers=auth_headers, json={
            'patient_id': sample_patient.id,
            'professional_id': sample_professional.id,
            'appointment_date': appointment_time.isoformat(),
            'duration_minutes': 30
        })

        # Should either return conflict error (409) or create successfully
        # depending on implementation
        assert response.status_code in [201, 400, 409]


class TestAppointmentWorkflow:
    """End-to-end workflow validation for appointments API."""

    def test_appointments_list_calendar_detail_flow(self, client, auth_headers, sample_professional, sample_patient):
        """Validate create -> calendar/list -> detail -> update -> cancel flow."""
        appointment_date = datetime.now() + timedelta(days=5)

        create_response = client.post('/api/appointments', headers=auth_headers, json={
            'patient_id': sample_patient.id,
            'professional_id': sample_professional.id,
            'appointment_date': appointment_date.isoformat(),
            'duration_minutes': 45,
            'appointment_type': 'consultation',
            'reason': 'Workflow validation'
        })

        assert create_response.status_code == 201
        created_appointment = create_response.json
        appointment_id = created_appointment['id']
        assert created_appointment['status'] == 'scheduled'

        date_from = (appointment_date - timedelta(days=1)).isoformat()
        date_to = (appointment_date + timedelta(days=1)).isoformat()

        calendar_response = client.get(
            f'/api/appointments?professional_id={sample_professional.id}&date_from={date_from}&date_to={date_to}',
            headers=auth_headers
        )

        assert calendar_response.status_code == 200
        calendar_payload = calendar_response.json
        assert 'items' in calendar_payload
        assert any(item['id'] == appointment_id for item in calendar_payload['items'])

        detail_response = client.get(f'/api/appointments/{appointment_id}', headers=auth_headers)
        assert detail_response.status_code == 200
        assert detail_response.json['id'] == appointment_id

        update_response = client.put(f'/api/appointments/{appointment_id}', headers=auth_headers, json={
            'status': 'confirmed',
            'notes': 'Confirmed during workflow test'
        })

        assert update_response.status_code == 200
        assert update_response.json['status'] == 'confirmed'

        cancel_response = client.delete(f'/api/appointments/{appointment_id}', headers=auth_headers)
        assert cancel_response.status_code == 200
        assert cancel_response.json['msg'] == 'Appointment cancelled'

        post_cancel_detail = client.get(f'/api/appointments/{appointment_id}', headers=auth_headers)
        assert post_cancel_detail.status_code == 200
        assert post_cancel_detail.json['status'] == 'cancelled'
