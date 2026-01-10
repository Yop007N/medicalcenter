# -*- coding: utf-8 -*-
"""
Tests for Odontology module (Odontograms and Dental Treatments)
"""

import pytest
from datetime import date, timedelta
from app.models.odontogram import Odontogram, Tooth, DentalTreatment
from app.models.patient import Patient
from app.models.professional import Professional


class TestOdontograms:
    """Test cases for Odontogram endpoints"""

    def test_create_odontogram(self, client, auth_headers, sample_patient, sample_professional):
        """Test creating a new odontogram"""
        data = {
            'patient_id': sample_patient.id,
            'notes': 'Evaluación inicial del odontograma'
        }

        response = client.post(
            '/api/odontograms',
            json=data,
            headers=auth_headers
        )

        assert response.status_code == 201
        json_data = response.get_json()
        assert json_data['patient_id'] == sample_patient.id
        assert json_data['professional_id'] == sample_professional.id
        assert json_data['is_active'] is True

    def test_get_patient_odontogram(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test retrieving active odontogram for a patient"""
        # Create an odontogram
        odontogram = Odontogram(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            is_active=True,
            notes='Odontograma activo'
        )
        db_session.add(odontogram)
        db_session.commit()

        response = client.get(
            f'/api/odontograms/patient/{sample_patient.id}',
            headers=auth_headers
        )

        assert response.status_code == 200
        json_data = response.get_json()
        assert json_data['patient_id'] == sample_patient.id
        assert json_data['is_active'] is True

    def test_get_odontogram_by_id(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test retrieving a specific odontogram by ID"""
        odontogram = Odontogram(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            notes='Test odontogram'
        )
        db_session.add(odontogram)
        db_session.commit()

        response = client.get(
            f'/api/odontograms/{odontogram.id}',
            headers=auth_headers
        )

        assert response.status_code == 200
        json_data = response.get_json()
        assert json_data['id'] == odontogram.id

    def test_update_odontogram(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test updating an odontogram"""
        odontogram = Odontogram(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            notes='Original notes'
        )
        db_session.add(odontogram)
        db_session.commit()

        update_data = {
            'notes': 'Updated notes',
            'is_active': False
        }

        response = client.put(
            f'/api/odontograms/{odontogram.id}',
            json=update_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        json_data = response.get_json()
        assert json_data['notes'] == 'Updated notes'
        assert json_data['is_active'] is False

    def test_add_tooth_to_odontogram(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test adding/updating a tooth in an odontogram"""
        odontogram = Odontogram(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id
        )
        db_session.add(odontogram)
        db_session.commit()

        tooth_data = {
            'tooth_number': 11,
            'status': 'caries',
            'mesial': 'healthy',
            'distal': 'caries',
            'oclusal': 'filling',
            'vestibular': 'healthy',
            'lingual': 'healthy',
            'notes': 'Caries en superficie distal'
        }

        response = client.post(
            f'/api/odontograms/{odontogram.id}/tooth',
            json=tooth_data,
            headers=auth_headers
        )

        assert response.status_code == 201
        json_data = response.get_json()
        assert json_data['tooth_number'] == 11
        assert json_data['status'] == 'caries'
        assert json_data['distal'] == 'caries'

    def test_get_odontogram_teeth(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test retrieving all teeth for an odontogram"""
        odontogram = Odontogram(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id
        )
        db_session.add(odontogram)
        db_session.commit()

        # Add multiple teeth
        tooth1 = Tooth(odontogram_id=odontogram.id, tooth_number=11, status='healthy')
        tooth2 = Tooth(odontogram_id=odontogram.id, tooth_number=12, status='caries')
        db_session.add_all([tooth1, tooth2])
        db_session.commit()

        response = client.get(
            f'/api/odontograms/{odontogram.id}/teeth',
            headers=auth_headers
        )

        assert response.status_code == 200
        json_data = response.get_json()
        assert 'teeth' in json_data
        assert len(json_data['teeth']) == 2

    def test_create_odontogram_missing_fields(self, client, auth_headers):
        """Test creating odontogram with missing required fields"""
        data = {
            'notes': 'Missing patient and professional IDs'
        }

        response = client.post(
            '/api/odontograms',
            json=data,
            headers=auth_headers
        )

        assert response.status_code == 400

    def test_invalid_tooth_number(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test adding tooth with invalid FDI number"""
        odontogram = Odontogram(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id
        )
        db_session.add(odontogram)
        db_session.commit()

        tooth_data = {
            'tooth_number': 99,  # Invalid FDI number
            'status': 'healthy'
        }

        response = client.post(
            f'/api/odontograms/{odontogram.id}/tooth',
            json=tooth_data,
            headers=auth_headers
        )

        assert response.status_code == 400


class TestDentalTreatments:
    """Test cases for Dental Treatment endpoints"""

    def test_create_dental_treatment(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test creating a new dental treatment"""
        odontogram = Odontogram(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id
        )
        db_session.add(odontogram)
        db_session.commit()

        treatment_data = {
            'patient_id': sample_patient.id,
            'treatment_type': 'filling',
            'treatment_date': str(date.today()),
            'affected_teeth': [16],
            'description': 'Obturación en molar superior derecho',
            'estimated_cost': 150.00
        }

        response = client.post(
            '/api/dental-treatments',
            json=treatment_data,
            headers=auth_headers
        )

        assert response.status_code == 201
        json_data = response.get_json()
        assert json_data['treatment_type'] == 'filling'
        assert 16 in json_data['affected_teeth']
        assert json_data['status'] == 'planned'

    def test_get_treatment_by_id(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test retrieving a specific treatment by ID"""
        treatment = DentalTreatment(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            affected_teeth=[21],
            treatment_type='extraction',
            description='Extracción dental',
            treatment_date=date.today()
        )
        db_session.add(treatment)
        db_session.commit()

        response = client.get(
            f'/api/dental-treatments/{treatment.id}',
            headers=auth_headers
        )

        assert response.status_code == 200
        json_data = response.get_json()
        assert json_data['id'] == treatment.id
        assert json_data['treatment_type'] == 'extraction'

    def test_update_treatment(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test updating a treatment"""
        treatment = DentalTreatment(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            affected_teeth=[11],
            treatment_type='cleaning',
            description='Limpieza dental',
            treatment_date=date.today()
        )
        db_session.add(treatment)
        db_session.commit()

        update_data = {
            'status': 'in_progress',
            'final_cost': 80.00
        }

        response = client.put(
            f'/api/dental-treatments/{treatment.id}',
            json=update_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        json_data = response.get_json()
        assert json_data['status'] == 'in_progress'
        assert float(json_data['final_cost']) == 80.00

    def test_complete_treatment(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test marking a treatment as completed"""
        treatment = DentalTreatment(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            affected_teeth=[26],
            treatment_type='root_canal',
            description='Endodoncia',
            treatment_date=date.today(),
            status='in_progress'
        )
        db_session.add(treatment)
        db_session.commit()

        completion_data = {
            'completion_notes': 'Tratamiento completado exitosamente',
            'final_cost': 350.00
        }

        response = client.post(
            f'/api/dental-treatments/{treatment.id}/complete',
            json=completion_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        json_data = response.get_json()
        treatment_data = json_data['treatment']
        assert treatment_data['status'] == 'completed'
        assert json_data['msg'] == 'Treatment completed successfully'

    def test_cancel_treatment(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test canceling a treatment"""
        treatment = DentalTreatment(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            affected_teeth=[31],
            treatment_type='filling',
            description='Obturación',
            treatment_date=date.today() + timedelta(days=5)
        )
        db_session.add(treatment)
        db_session.commit()

        cancel_data = {
            'cancellation_reason': 'Paciente solicitó postponer'
        }

        response = client.post(
            f'/api/dental-treatments/{treatment.id}/cancel',
            json=cancel_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        json_data = response.get_json()
        assert json_data['status'] == 'cancelled'

    def test_get_patient_treatment_history(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test retrieving complete treatment history for a patient"""
        # Create multiple treatments
        treatment1 = DentalTreatment(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            affected_teeth=[11],
            treatment_type='cleaning',
            description='Limpieza',
            treatment_date=date.today() - timedelta(days=30),
            status='completed'
        )
        treatment2 = DentalTreatment(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            affected_teeth=[16],
            treatment_type='filling',
            description='Obturación',
            treatment_date=date.today(),
            status='in_progress'
        )
        db_session.add_all([treatment1, treatment2])
        db_session.commit()

        response = client.get(
            f'/api/dental-treatments/patient/{sample_patient.id}/history',
            headers=auth_headers
        )

        assert response.status_code == 200
        json_data = response.get_json()
        assert 'treatments' in json_data
        assert json_data['total'] >= 2

    def test_get_treatments_by_tooth(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test retrieving all treatments for a specific tooth"""
        # Multiple treatments on same tooth
        treatment1 = DentalTreatment(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            affected_teeth=[16],
            treatment_type='cleaning',
            description='Limpieza inicial',
            treatment_date=date.today() - timedelta(days=60),
            status='completed'
        )
        treatment2 = DentalTreatment(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            affected_teeth=[16],
            treatment_type='filling',
            description='Obturación',
            treatment_date=date.today(),
            status='planned'
        )
        treatment3 = DentalTreatment(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            affected_teeth=[21],
            treatment_type='filling',
            description='Obturación en otro diente',
            treatment_date=date.today(),
            status='planned'
        )
        db_session.add_all([treatment1, treatment2, treatment3])
        db_session.commit()

        # Get all treatments for patient - should return all 3
        response = client.get(
            f'/api/dental-treatments/patient/{sample_patient.id}/history',
            headers=auth_headers
        )

        assert response.status_code == 200
        json_data = response.get_json()
        assert 'treatments' in json_data
        # Filter in test to verify tooth 16 has 2 treatments
        tooth_16_treatments = [t for t in json_data['treatments'] if 16 in t['affected_teeth']]
        assert len(tooth_16_treatments) == 2

    def test_delete_treatment(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test deleting a dental treatment"""
        treatment = DentalTreatment(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            affected_teeth=[21],
            treatment_type='whitening',
            description='Blanqueamiento',
            treatment_date=date.today()
        )
        db_session.add(treatment)
        db_session.commit()

        treatment_id = treatment.id

        response = client.delete(
            f'/api/dental-treatments/{treatment_id}',
            headers=auth_headers
        )

        assert response.status_code == 200

        # Verify deletion
        response = client.get(
            f'/api/dental-treatments/{treatment_id}',
            headers=auth_headers
        )
        assert response.status_code == 404

    def test_create_treatment_missing_fields(self, client, auth_headers):
        """Test creating treatment with missing required fields"""
        data = {
            'treatment_type': 'filling'
            # Missing patient_id, professional_id, tooth_number, etc.
        }

        response = client.post(
            '/api/dental-treatments',
            json=data,
            headers=auth_headers
        )

        assert response.status_code == 400

    def test_get_treatments_by_status(self, client, auth_headers, sample_patient, sample_professional, db_session):
        """Test filtering treatments by status"""
        treatment1 = DentalTreatment(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            affected_teeth=[11],
            treatment_type='cleaning',
            description='Limpieza',
            treatment_date=date.today(),
            status='planned'
        )
        treatment2 = DentalTreatment(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            affected_teeth=[12],
            treatment_type='filling',
            description='Obturación',
            treatment_date=date.today(),
            status='completed'
        )
        db_session.add_all([treatment1, treatment2])
        db_session.commit()

        response = client.get(
            f'/api/dental-treatments/patient/{sample_patient.id}/history?status=planned',
            headers=auth_headers
        )

        assert response.status_code == 200
        json_data = response.get_json()
        assert 'treatments' in json_data
        # All returned treatments should have status 'planned'
        for treatment in json_data['treatments']:
            assert treatment['status'] == 'planned'
