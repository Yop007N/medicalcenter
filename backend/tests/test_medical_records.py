# -*- coding: utf-8 -*-
"""
Tests for Medical Records endpoints
"""

import pytest
import json
from app.models.medical_record import MedicalRecord


class TestListMedicalRecords:
    """Test listing medical records"""

    def test_list_medical_records_success(self, client, auth_headers, sample_patient, sample_professional, app):
        """Test listing all medical records"""
        # Create some medical records
        with app.app_context():
            from app.extensions import db
            record1 = MedicalRecord(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                chief_complaint='Headache',
                diagnosis='Migraine'
            )
            record2 = MedicalRecord(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                chief_complaint='Fever',
                diagnosis='Flu'
            )
            db.session.add(record1)
            db.session.add(record2)
            db.session.commit()

        response = client.get('/api/medical-records', headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)
        assert isinstance(data, list)
        assert len(data) >= 2

    def test_list_medical_records_filter_by_patient(self, client, auth_headers, sample_patient, sample_professional, app):
        """Test filtering medical records by patient"""
        # Create medical record
        with app.app_context():
            from app.extensions import db
            record = MedicalRecord(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                chief_complaint='Test complaint',
                diagnosis='Test diagnosis'
            )
            db.session.add(record)
            db.session.commit()

        response = client.get(f'/api/medical-records?patient_id={sample_patient.id}', headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)
        assert isinstance(data, list)
        # All records should be for this patient
        for record in data:
            assert record['patient_id'] == sample_patient.id

    def test_list_medical_records_filter_by_professional(self, client, auth_headers, sample_patient, sample_professional, app):
        """Test filtering medical records by professional"""
        with app.app_context():
            from app.extensions import db
            record = MedicalRecord(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                chief_complaint='Test',
                diagnosis='Test'
            )
            db.session.add(record)
            db.session.commit()

        response = client.get(f'/api/medical-records?professional_id={sample_professional.id}', headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)
        assert isinstance(data, list)
        for record in data:
            assert record['professional_id'] == sample_professional.id

    def test_list_medical_records_unauthorized(self, client):
        """Test listing medical records without authentication"""
        response = client.get('/api/medical-records')
        assert response.status_code == 401

    def test_list_medical_records_filter_by_specialty_key_for_admin(
        self,
        client,
        admin_auth_headers,
        app,
    ):
        """Admin specialty_key filter should scope records by module professionals."""
        from app.extensions import db
        from app.models.patient import Patient
        from app.models.professional import Professional

        with app.app_context():
            cardio = Professional(
                email='records-cardio@test.com',
                first_name='Carla',
                last_name='Cardio',
                role='professional',
                license_number='REC-CARDIO-01',
                specialty='Cardiologia',
            )
            cardio.set_password('Doctor123')

            derma = Professional(
                email='records-derma@test.com',
                first_name='Dario',
                last_name='Derma',
                role='professional',
                license_number='REC-DERMA-01',
                specialty='Dermatologia',
            )
            derma.set_password('Doctor123')

            cardio_patient = Patient(
                email='records-cardio-patient@test.com',
                first_name='Paciente',
                last_name='Cardio',
                role='patient',
            )
            cardio_patient.set_password('Patient123')

            derma_patient = Patient(
                email='records-derma-patient@test.com',
                first_name='Paciente',
                last_name='Derma',
                role='patient',
            )
            derma_patient.set_password('Patient123')

            db.session.add_all([cardio, derma, cardio_patient, derma_patient])
            db.session.flush()

            cardio_record = MedicalRecord(
                patient_id=cardio_patient.id,
                professional_id=cardio.id,
                chief_complaint='Dolor toracico',
                diagnosis='Control cardiologico',
            )
            derma_record = MedicalRecord(
                patient_id=derma_patient.id,
                professional_id=derma.id,
                chief_complaint='Erupcion cutanea',
                diagnosis='Control dermatologico',
            )
            db.session.add_all([cardio_record, derma_record])
            db.session.commit()
            cardio_record_id = cardio_record.id
            derma_record_id = derma_record.id

        response = client.get('/api/medical-records?specialty_key=cardiology', headers=admin_auth_headers)
        assert response.status_code == 200
        rows = response.json
        returned_ids = {row['id'] for row in rows}
        assert cardio_record_id in returned_ids
        assert derma_record_id not in returned_ids

    def test_list_medical_records_rejects_foreign_specialty_for_professional(
        self,
        client,
        auth_headers,
    ):
        """Professional cannot query records outside own specialty module."""
        response = client.get('/api/medical-records?specialty_key=cardiology', headers=auth_headers)
        assert response.status_code == 403

    def test_list_medical_records_include_patient_and_professional_summary(
        self,
        client,
        auth_headers,
        sample_patient,
        sample_professional,
        app
    ):
        """Test list payload includes nested patient/professional summaries."""
        with app.app_context():
            from app.extensions import db
            record = MedicalRecord(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                chief_complaint='Summary check'
            )
            db.session.add(record)
            db.session.commit()
            record_id = record.id

        response = client.get('/api/medical-records', headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)
        target = next(item for item in data if item['id'] == record_id)
        assert target['patient']['id'] == sample_patient.id
        assert target['professional']['id'] == sample_professional.id


class TestGetMedicalRecord:
    """Test getting a single medical record"""

    def test_get_medical_record_success(self, client, auth_headers, sample_patient, sample_professional, app):
        """Test getting medical record by ID"""
        with app.app_context():
            from app.extensions import db
            record = MedicalRecord(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                chief_complaint='Chest pain',
                symptoms='Sharp pain, shortness of breath',
                diagnosis='Angina',
                treatment='Prescribed medication',
                blood_pressure='120/80',
                heart_rate=75
            )
            db.session.add(record)
            db.session.commit()
            record_id = record.id

        response = client.get(f'/api/medical-records/{record_id}', headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['id'] == record_id
        assert data['chief_complaint'] == 'Chest pain'
        assert data['symptoms'] == 'Sharp pain, shortness of breath'
        assert data['diagnosis'] == 'Angina'
        assert data['treatment'] == 'Prescribed medication'
        assert data['blood_pressure'] == '120/80'
        assert data['heart_rate'] == 75

    def test_get_medical_record_not_found(self, client, auth_headers):
        """Test getting non-existent medical record"""
        response = client.get('/api/medical-records/99999', headers=auth_headers)
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'msg' in data

    def test_get_medical_record_includes_patient_and_professional_summary(
        self,
        client,
        auth_headers,
        sample_patient,
        sample_professional,
        app
    ):
        """Test detail payload includes nested patient/professional summaries for frontend."""
        with app.app_context():
            from app.extensions import db
            record = MedicalRecord(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                chief_complaint='Routine visit'
            )
            db.session.add(record)
            db.session.commit()
            record_id = record.id

        response = client.get(f'/api/medical-records/{record_id}', headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['patient']['id'] == sample_patient.id
        assert data['patient']['first_name'] == 'Test'
        assert data['patient']['last_name'] == 'Patient'
        assert data['professional']['id'] == sample_professional.id
        assert data['professional']['first_name'] == 'Test'
        assert data['professional']['last_name'] == 'Doctor'
        assert data['professional']['specialty'] == 'General Practice'

    def test_get_medical_record_unauthorized(self, client, sample_patient, sample_professional, app):
        """Test getting medical record without authentication"""
        with app.app_context():
            from app.extensions import db
            record = MedicalRecord(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                chief_complaint='Test'
            )
            db.session.add(record)
            db.session.commit()
            record_id = record.id

        response = client.get(f'/api/medical-records/{record_id}')
        assert response.status_code == 401


class TestCreateMedicalRecord:
    """Test creating medical records"""

    def test_create_medical_record_success(self, client, auth_headers, sample_patient):
        """Test creating a new medical record"""
        data = {
            'patient_id': sample_patient.id,
            'chief_complaint': 'Back pain',
            'symptoms': 'Lower back pain, difficulty moving',
            'diagnosis': 'Lumbar strain',
            'treatment': 'Rest, ice, pain medication',
            'prescriptions': 'Ibuprofen 400mg',
            'notes': 'Patient should follow up in 2 weeks',
            'blood_pressure': '118/76',
            'heart_rate': 72,
            'temperature': 36.7,
            'weight': 75.5,
            'height': 175
        }

        response = client.post('/api/medical-records', json=data, headers=auth_headers)

        assert response.status_code == 201
        response_data = json.loads(response.data)
        assert response_data['patient_id'] == sample_patient.id
        assert response_data['chief_complaint'] == 'Back pain'
        assert response_data['symptoms'] == 'Lower back pain, difficulty moving'
        assert response_data['diagnosis'] == 'Lumbar strain'
        assert response_data['treatment'] == 'Rest, ice, pain medication'
        assert response_data['prescriptions'] == 'Ibuprofen 400mg'
        assert response_data['blood_pressure'] == '118/76'
        assert response_data['heart_rate'] == 72
        assert response_data['temperature'] == 36.7
        assert response_data['weight'] == 75.5
        assert response_data['height'] == 175

    def test_create_medical_record_minimal_fields(self, client, auth_headers, sample_patient):
        """Test creating medical record with only required fields"""
        data = {
            'patient_id': sample_patient.id
        }

        response = client.post('/api/medical-records', json=data, headers=auth_headers)

        assert response.status_code == 201
        response_data = json.loads(response.data)
        assert response_data['patient_id'] == sample_patient.id

    def test_create_medical_record_with_appointment(self, client, auth_headers, sample_patient, sample_appointment):
        """Test creating medical record linked to appointment"""
        data = {
            'patient_id': sample_patient.id,
            'appointment_id': sample_appointment.id,
            'chief_complaint': 'Follow-up consultation',
            'diagnosis': 'Improving'
        }

        response = client.post('/api/medical-records', json=data, headers=auth_headers)

        assert response.status_code == 201
        response_data = json.loads(response.data)
        assert response_data['appointment_id'] == sample_appointment.id

    def test_create_medical_record_missing_patient_id(self, client, auth_headers):
        """Test creating medical record without patient_id"""
        data = {
            'chief_complaint': 'Test'
        }

        response = client.post('/api/medical-records', json=data, headers=auth_headers)

        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'msg' in data

    def test_create_medical_record_unauthorized(self, client, patient_auth_headers, sample_patient):
        """Test that only professionals can create medical records"""
        data = {
            'patient_id': sample_patient.id,
            'chief_complaint': 'Test'
        }

        # Patient user trying to create record
        response = client.post('/api/medical-records', json=data, headers=patient_auth_headers)
        assert response.status_code == 403


class TestUpdateMedicalRecord:
    """Test updating medical records"""

    def test_update_medical_record_success(self, client, auth_headers, sample_patient, sample_professional, app):
        """Test updating a medical record"""
        # Create record
        with app.app_context():
            from app.extensions import db
            record = MedicalRecord(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                chief_complaint='Initial complaint',
                diagnosis='Initial diagnosis'
            )
            db.session.add(record)
            db.session.commit()
            record_id = record.id

        # Update record
        update_data = {
            'chief_complaint': 'Updated complaint',
            'diagnosis': 'Updated diagnosis',
            'treatment': 'New treatment plan',
            'notes': 'Additional notes',
            'blood_pressure': '125/85',
            'heart_rate': 80
        }

        response = client.put(f'/api/medical-records/{record_id}', json=update_data, headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['chief_complaint'] == 'Updated complaint'
        assert data['diagnosis'] == 'Updated diagnosis'
        assert data['treatment'] == 'New treatment plan'
        assert data['notes'] == 'Additional notes'
        assert data['blood_pressure'] == '125/85'
        assert data['heart_rate'] == 80

    def test_update_medical_record_partial(self, client, auth_headers, sample_patient, sample_professional, app):
        """Test partial update of medical record"""
        with app.app_context():
            from app.extensions import db
            record = MedicalRecord(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                chief_complaint='Original',
                diagnosis='Original diagnosis'
            )
            db.session.add(record)
            db.session.commit()
            record_id = record.id

        # Only update one field
        update_data = {
            'notes': 'Just adding notes'
        }

        response = client.put(f'/api/medical-records/{record_id}', json=update_data, headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['notes'] == 'Just adding notes'
        # Original fields should remain
        assert data['chief_complaint'] == 'Original'
        assert data['diagnosis'] == 'Original diagnosis'

    def test_update_medical_record_not_found(self, client, auth_headers):
        """Test updating non-existent medical record"""
        update_data = {
            'diagnosis': 'New diagnosis'
        }

        response = client.put('/api/medical-records/99999', json=update_data, headers=auth_headers)

        assert response.status_code == 404

    def test_update_medical_record_unauthorized(self, client, patient_auth_headers, sample_patient, sample_professional, app):
        """Test that only professionals can update medical records"""
        with app.app_context():
            from app.extensions import db
            record = MedicalRecord(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                chief_complaint='Test'
            )
            db.session.add(record)
            db.session.commit()
            record_id = record.id

        update_data = {
            'diagnosis': 'Trying to update'
        }

        response = client.put(f'/api/medical-records/{record_id}', json=update_data, headers=patient_auth_headers)
        assert response.status_code == 403


class TestDeleteMedicalRecord:
    """Test deleting medical records"""

    def test_delete_medical_record_success(self, client, auth_headers, sample_patient, sample_professional, app):
        """Test deleting a medical record"""
        with app.app_context():
            from app.extensions import db
            record = MedicalRecord(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                chief_complaint='To be deleted'
            )
            db.session.add(record)
            db.session.commit()
            record_id = record.id

        response = client.delete(f'/api/medical-records/{record_id}', headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'msg' in data

        # Verify record was deleted
        verify_response = client.get(f'/api/medical-records/{record_id}', headers=auth_headers)
        assert verify_response.status_code == 404

    def test_delete_medical_record_not_found(self, client, auth_headers):
        """Test deleting non-existent medical record"""
        response = client.delete('/api/medical-records/99999', headers=auth_headers)
        assert response.status_code == 404

    def test_delete_medical_record_unauthorized(self, client, patient_auth_headers, sample_patient, sample_professional, app):
        """Test that only professionals can delete medical records"""
        with app.app_context():
            from app.extensions import db
            record = MedicalRecord(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                chief_complaint='Test'
            )
            db.session.add(record)
            db.session.commit()
            record_id = record.id

        response = client.delete(f'/api/medical-records/{record_id}', headers=patient_auth_headers)
        assert response.status_code == 403


class TestMedicalRecordIntegration:
    """Integration tests for medical records"""

    def test_complete_medical_record_workflow(self, client, auth_headers, sample_patient, sample_appointment):
        """Test complete workflow: create, read, update, list"""
        # 1. Create medical record
        create_data = {
            'patient_id': sample_patient.id,
            'appointment_id': sample_appointment.id,
            'chief_complaint': 'Routine checkup',
            'symptoms': 'None reported',
            'diagnosis': 'Healthy',
            'treatment': 'Continue current lifestyle',
            'blood_pressure': '120/80',
            'heart_rate': 70,
            'temperature': 36.6,
            'weight': 70.0,
            'height': 170
        }

        create_response = client.post('/api/medical-records', json=create_data, headers=auth_headers)
        assert create_response.status_code == 201
        created_record = json.loads(create_response.data)
        record_id = created_record['id']

        # 2. Read medical record
        get_response = client.get(f'/api/medical-records/{record_id}', headers=auth_headers)
        assert get_response.status_code == 200
        record_data = json.loads(get_response.data)
        assert record_data['chief_complaint'] == 'Routine checkup'

        # 3. Update medical record
        update_data = {
            'notes': 'Patient advised to return in 6 months',
            'prescriptions': 'Multivitamin supplement'
        }
        update_response = client.put(f'/api/medical-records/{record_id}', json=update_data, headers=auth_headers)
        assert update_response.status_code == 200
        updated_record = json.loads(update_response.data)
        assert updated_record['notes'] == 'Patient advised to return in 6 months'

        # 4. List medical records for patient
        list_response = client.get(f'/api/medical-records?patient_id={sample_patient.id}', headers=auth_headers)
        assert list_response.status_code == 200
        records_list = json.loads(list_response.data)
        assert any(r['id'] == record_id for r in records_list)

    def test_multiple_records_for_patient(self, client, auth_headers, sample_patient):
        """Test creating and managing multiple records for same patient"""
        # Create multiple records
        for i in range(3):
            data = {
                'patient_id': sample_patient.id,
                'chief_complaint': f'Visit {i+1}',
                'diagnosis': f'Diagnosis {i+1}'
            }
            response = client.post('/api/medical-records', json=data, headers=auth_headers)
            assert response.status_code == 201

        # List all records for patient
        list_response = client.get(f'/api/medical-records?patient_id={sample_patient.id}', headers=auth_headers)
        assert list_response.status_code == 200
        records = json.loads(list_response.data)
        assert len(records) >= 3

    def test_medical_record_with_vital_signs(self, client, auth_headers, sample_patient):
        """Test creating record with all vital signs"""
        data = {
            'patient_id': sample_patient.id,
            'chief_complaint': 'Annual physical',
            'blood_pressure': '115/75',
            'heart_rate': 68,
            'temperature': 36.5,
            'weight': 72.3,
            'height': 175
        }

        response = client.post('/api/medical-records', json=data, headers=auth_headers)
        assert response.status_code == 201
        record = json.loads(response.data)

        # Verify all vital signs are saved
        assert record['blood_pressure'] == '115/75'
        assert record['heart_rate'] == 68
        assert record['temperature'] == 36.5
        assert record['weight'] == 72.3
        assert record['height'] == 175
