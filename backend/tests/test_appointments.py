# -*- coding: utf-8 -*-
"""
Appointment CRUD Tests
"""

import pytest
from datetime import datetime, timedelta
from app.models.appointment import Appointment
from app.models.patient import Patient
from app.models.professional import Professional
from app.models.professional_patient_assignment import ProfessionalPatientAssignment
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

    def test_list_appointments_filter_by_specialty_key_for_admin(
        self,
        client,
        admin_auth_headers,
        app,
    ):
        """Admin specialty_key filter should scope appointments by module professionals."""
        from app.models.patient import Patient
        from app.models.professional import Professional

        with app.app_context():
            cardio = Professional(
                email='appointment-cardio@test.com',
                first_name='Carla',
                last_name='Cardio',
                role='professional',
                license_number='APT-CARDIO-01',
                specialty='Cardiologia',
            )
            cardio.set_password('Doctor123')

            derma = Professional(
                email='appointment-derma@test.com',
                first_name='Dario',
                last_name='Derma',
                role='professional',
                license_number='APT-DERMA-01',
                specialty='Dermatologia',
            )
            derma.set_password('Doctor123')

            cardio_patient = Patient(
                email='appointment-cardio-patient@test.com',
                first_name='Paciente',
                last_name='Cardio',
                role='patient',
            )
            cardio_patient.set_password('Patient123')

            derma_patient = Patient(
                email='appointment-derma-patient@test.com',
                first_name='Paciente',
                last_name='Derma',
                role='patient',
            )
            derma_patient.set_password('Patient123')

            db.session.add_all([cardio, derma, cardio_patient, derma_patient])
            db.session.flush()

            cardio_appointment = Appointment(
                patient_id=cardio_patient.id,
                professional_id=cardio.id,
                appointment_date=datetime.now() + timedelta(days=1),
                status='scheduled',
            )
            derma_appointment = Appointment(
                patient_id=derma_patient.id,
                professional_id=derma.id,
                appointment_date=datetime.now() + timedelta(days=2),
                status='scheduled',
            )
            db.session.add_all([cardio_appointment, derma_appointment])
            db.session.commit()
            cardio_appointment_id = cardio_appointment.id
            derma_appointment_id = derma_appointment.id

        response = client.get('/api/appointments?specialty_key=cardiology', headers=admin_auth_headers)
        assert response.status_code == 200
        rows = response.json['items']
        returned_ids = {row['id'] for row in rows}
        assert cardio_appointment_id in returned_ids
        assert derma_appointment_id not in returned_ids

    def test_list_appointments_rejects_foreign_specialty_for_professional(
        self,
        client,
        auth_headers,
    ):
        """Professional cannot query appointments outside own specialty module."""
        response = client.get('/api/appointments?specialty_key=cardiology', headers=auth_headers)
        assert response.status_code == 403


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

    def test_create_appointment_rejects_patient_owned_by_other_professional(self, client, app):
        """Professional cannot create appointment for a patient already linked to another owner."""
        with app.app_context():
            owner_professional = Professional(
                email='appointment-owner@test.com',
                first_name='Owner',
                last_name='Doctor',
                role='professional',
                license_number='APT-OWNER-001',
                specialty='Cardiologia',
            )
            owner_professional.set_password('Doctor123')

            requester_professional = Professional(
                email='appointment-requester@test.com',
                first_name='Requester',
                last_name='Doctor',
                role='professional',
                license_number='APT-REQUESTER-001',
                specialty='Cardiologia',
            )
            requester_professional.set_password('Doctor123')

            patient = Patient(
                email='appointment-owned-patient@test.com',
                first_name='Paciente',
                last_name='Asignado',
                role='patient',
            )
            patient.set_password('Patient123')

            db.session.add_all([owner_professional, requester_professional, patient])
            db.session.flush()
            db.session.add(
                ProfessionalPatientAssignment(
                    professional_id=owner_professional.id,
                    patient_id=patient.id,
                    specialty_key='cardiology',
                )
            )
            db.session.commit()
            requester_id = requester_professional.id
            patient_id = patient.id

        response = client.post(
            '/api/auth/login',
            json={'email': 'appointment-requester@test.com', 'password': 'Doctor123'},
        )
        headers = {'Authorization': f"Bearer {response.get_json()['access_token']}"}

        create_response = client.post(
            '/api/appointments',
            headers=headers,
            json={
                'patient_id': patient_id,
                'professional_id': requester_id,
                'appointment_date': (datetime.now() + timedelta(days=2)).isoformat(),
                'duration_minutes': 30,
            },
        )

        assert create_response.status_code == 403
        assert 'linked patients' in create_response.get_json()['msg']

    def test_create_appointment_auto_assigns_unlinked_patient_for_professional(self, client, app):
        """Professional can create first appointment and auto-link patient ownership."""
        with app.app_context():
            requester_professional = Professional(
                email='appointment-auto-assign-prof@test.com',
                first_name='Auto',
                last_name='Doctor',
                role='professional',
                license_number='APT-AUTO-ASSIGN-001',
                specialty='Cardiologia',
            )
            requester_professional.set_password('Doctor123')

            patient = Patient(
                email='appointment-auto-assign-patient@test.com',
                first_name='Paciente',
                last_name='Nuevo',
                role='patient',
            )
            patient.set_password('Patient123')

            db.session.add_all([requester_professional, patient])
            db.session.commit()
            requester_id = requester_professional.id
            patient_id = patient.id

        login_response = client.post(
            '/api/auth/login',
            json={'email': 'appointment-auto-assign-prof@test.com', 'password': 'Doctor123'},
        )
        headers = {'Authorization': f"Bearer {login_response.get_json()['access_token']}"}

        create_response = client.post(
            '/api/appointments',
            headers=headers,
            json={
                'patient_id': patient_id,
                'professional_id': requester_id,
                'appointment_date': (datetime.now() + timedelta(days=3)).isoformat(),
                'duration_minutes': 30,
            },
        )

        assert create_response.status_code == 201

        with app.app_context():
            assignment = ProfessionalPatientAssignment.query.filter_by(
                professional_id=requester_id,
                patient_id=patient_id,
            ).first()
            assert assignment is not None
            assert assignment.specialty_key == 'cardiology'


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

    def test_update_appointment_rejects_patient_outside_professional_scope(self, client, app):
        """Professional cannot move appointment to a patient owned by another professional."""
        with app.app_context():
            requester_professional = Professional(
                email='appointment-update-requester@test.com',
                first_name='Requester',
                last_name='Doctor',
                role='professional',
                license_number='APT-UPD-REQ-001',
                specialty='Cardiologia',
            )
            requester_professional.set_password('Doctor123')

            owner_professional = Professional(
                email='appointment-update-owner@test.com',
                first_name='Owner',
                last_name='Doctor',
                role='professional',
                license_number='APT-UPD-OWN-001',
                specialty='Cardiologia',
            )
            owner_professional.set_password('Doctor123')

            linked_patient = Patient(
                email='appointment-update-linked@test.com',
                first_name='Paciente',
                last_name='Linked',
                role='patient',
            )
            linked_patient.set_password('Patient123')

            foreign_patient = Patient(
                email='appointment-update-foreign@test.com',
                first_name='Paciente',
                last_name='Foreign',
                role='patient',
            )
            foreign_patient.set_password('Patient123')

            db.session.add_all(
                [requester_professional, owner_professional, linked_patient, foreign_patient]
            )
            db.session.flush()
            db.session.add_all(
                [
                    ProfessionalPatientAssignment(
                        professional_id=requester_professional.id,
                        patient_id=linked_patient.id,
                        specialty_key='cardiology',
                    ),
                    ProfessionalPatientAssignment(
                        professional_id=owner_professional.id,
                        patient_id=foreign_patient.id,
                        specialty_key='cardiology',
                    ),
                ]
            )
            appointment = Appointment(
                patient_id=linked_patient.id,
                professional_id=requester_professional.id,
                appointment_date=datetime.now() + timedelta(days=1),
                duration_minutes=30,
                status='scheduled',
            )
            db.session.add(appointment)
            db.session.commit()
            appointment_id = appointment.id
            foreign_patient_id = foreign_patient.id

        login_response = client.post(
            '/api/auth/login',
            json={'email': 'appointment-update-requester@test.com', 'password': 'Doctor123'},
        )
        headers = {'Authorization': f"Bearer {login_response.get_json()['access_token']}"}

        update_response = client.put(
            f'/api/appointments/{appointment_id}',
            headers=headers,
            json={'patient_id': foreign_patient_id},
        )

        assert update_response.status_code == 403
        assert 'linked patients' in update_response.get_json()['msg']


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

        assert response.status_code == 409

    def test_appointment_overlap_conflict_by_duration(
        self,
        client,
        auth_headers,
        app,
        sample_professional,
        sample_patient,
    ):
        """Test overlap conflict when new slot intersects existing duration."""
        appointment_time = datetime.now() + timedelta(days=2)

        with app.app_context():
            appointment = Appointment(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                appointment_date=appointment_time,
                duration_minutes=60,
                status='scheduled'
            )
            db.session.add(appointment)
            db.session.commit()

        overlap_response = client.post('/api/appointments', headers=auth_headers, json={
            'patient_id': sample_patient.id,
            'professional_id': sample_professional.id,
            'appointment_date': (appointment_time + timedelta(minutes=30)).isoformat(),
            'duration_minutes': 30
        })
        assert overlap_response.status_code == 409


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
