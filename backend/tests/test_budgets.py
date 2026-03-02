# -*- coding: utf-8 -*-
"""
Tests for Budget module
"""

import pytest
from decimal import Decimal
from datetime import date, timedelta
from app.models.budget import Budget
from app.models.patient import Patient
from app.models.professional import Professional
from app.models.professional_patient_assignment import ProfessionalPatientAssignment
from app.extensions import db


def sample_patient_headers(client):
    """Authenticate as fixture sample patient."""
    response = client.post(
        '/api/auth/login',
        json={'email': 'testpatient@test.com', 'password': 'Patient123'},
    )
    assert response.status_code == 200
    return {'Authorization': f"Bearer {response.get_json()['access_token']}"}


def professional_headers(client, email, password='Doctor123'):
    response = client.post(
        '/api/auth/login',
        json={'email': email, 'password': password},
    )
    assert response.status_code == 200
    return {'Authorization': f"Bearer {response.get_json()['access_token']}"}


class TestListBudgets:
    """Test list budgets endpoint"""

    def test_list_budgets_success(self, client, auth_headers, sample_patient, sample_professional, app):
        """Test listing all budgets"""
        with app.app_context():
            budget = Budget(
                patient_id=sample_patient.id,
                created_by=sample_professional.id,
                title='Treatment Budget',
                total_amount=Decimal('1500.00'),
                status='draft'
            )
            db.session.add(budget)
            db.session.commit()

        response = client.get('/api/budgets', headers=auth_headers)

        assert response.status_code == 200
        data = response.json
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_list_budgets_with_patient_filter(self, client, auth_headers, sample_patient, sample_professional, app):
        """Test listing budgets filtered by patient"""
        with app.app_context():
            budget = Budget(
                patient_id=sample_patient.id,
                created_by=sample_professional.id,
                title='Patient Budget',
                total_amount=Decimal('2000.00')
            )
            db.session.add(budget)
            db.session.commit()

        response = client.get(f'/api/budgets?patient_id={sample_patient.id}', headers=auth_headers)

        assert response.status_code == 200
        data = response.json
        assert isinstance(data, list)

    def test_list_budgets_with_status_filter(self, client, auth_headers, sample_patient, sample_professional, app):
        """Test listing budgets filtered by status"""
        with app.app_context():
            budget = Budget(
                patient_id=sample_patient.id,
                created_by=sample_professional.id,
                title='Sent Budget',
                total_amount=Decimal('1000.00'),
                status='sent'
            )
            db.session.add(budget)
            db.session.commit()

        response = client.get('/api/budgets?status=sent', headers=auth_headers)

        assert response.status_code == 200
        data = response.json
        assert isinstance(data, list)

    def test_list_budgets_unauthorized(self, client):
        """Test listing budgets without authentication"""
        response = client.get('/api/budgets')
        assert response.status_code == 401

    def test_professional_can_list_budgets_scoped_by_own_specialty(self, client, app):
        with app.app_context():
            cardio_professional = Professional(
                email='budget-scope-cardio-prof@test.com',
                first_name='Carla',
                last_name='Cardio',
                role='professional',
                license_number='BGT-SCOPE-CARD-001',
                specialty='Cardiología',
            )
            cardio_professional.set_password('Doctor123')

            derm_professional = Professional(
                email='budget-scope-derm-prof@test.com',
                first_name='Diego',
                last_name='Derma',
                role='professional',
                license_number='BGT-SCOPE-DERM-001',
                specialty='Dermatología',
            )
            derm_professional.set_password('Doctor123')

            cardio_patient = Patient(
                email='budget-scope-cardio-patient@test.com',
                first_name='Paciente',
                last_name='Cardio',
                role='patient',
            )
            cardio_patient.set_password('Patient123')

            derm_patient = Patient(
                email='budget-scope-derm-patient@test.com',
                first_name='Paciente',
                last_name='Derm',
                role='patient',
            )
            derm_patient.set_password('Patient123')

            db.session.add_all([cardio_professional, derm_professional, cardio_patient, derm_patient])
            db.session.flush()

            db.session.add_all([
                ProfessionalPatientAssignment(
                    professional_id=cardio_professional.id,
                    patient_id=cardio_patient.id,
                    specialty_key='cardiology',
                ),
                ProfessionalPatientAssignment(
                    professional_id=derm_professional.id,
                    patient_id=derm_patient.id,
                    specialty_key='dermatology',
                ),
            ])

            cardio_budget = Budget(
                patient_id=cardio_patient.id,
                created_by=cardio_professional.id,
                title='Cardio scoped budget',
                total_amount=Decimal('1100.00'),
            )
            derm_budget = Budget(
                patient_id=derm_patient.id,
                created_by=derm_professional.id,
                title='Derm scoped budget',
                total_amount=Decimal('700.00'),
            )
            db.session.add_all([cardio_budget, derm_budget])
            db.session.commit()
            cardio_budget_id = cardio_budget.id
            derm_budget_id = derm_budget.id
            cardio_patient_id = cardio_patient.id

        headers = professional_headers(client, 'budget-scope-cardio-prof@test.com')
        response = client.get(
            f'/api/budgets?specialty_key=cardiology&patient_id={cardio_patient_id}',
            headers=headers,
        )

        assert response.status_code == 200
        payload = response.get_json()
        returned_ids = {item['id'] for item in payload}
        assert cardio_budget_id in returned_ids
        assert derm_budget_id not in returned_ids

    def test_professional_budget_scope_rejects_mismatched_specialty_key(self, client, app):
        with app.app_context():
            cardio_professional = Professional(
                email='budget-scope-mismatch@test.com',
                first_name='Cora',
                last_name='Mismatch',
                role='professional',
                license_number='BGT-SCOPE-MISMATCH',
                specialty='Cardiología',
            )
            cardio_professional.set_password('Doctor123')
            db.session.add(cardio_professional)
            db.session.commit()

        headers = professional_headers(client, 'budget-scope-mismatch@test.com')
        response = client.get('/api/budgets?specialty_key=dermatology', headers=headers)
        assert response.status_code == 403


class TestGetBudget:
    """Test get budget endpoint"""

    def test_get_budget_success(self, client, auth_headers, sample_patient, sample_professional, app):
        """Test getting a budget by ID"""
        with app.app_context():
            budget = Budget(
                patient_id=sample_patient.id,
                created_by=sample_professional.id,
                title='Get Budget Test',
                total_amount=Decimal('500.00'),
                description='Test budget'
            )
            db.session.add(budget)
            db.session.commit()
            budget_id = budget.id

        response = client.get(f'/api/budgets/{budget_id}', headers=auth_headers)

        assert response.status_code == 200
        data = response.json
        assert data['title'] == 'Get Budget Test'
        assert float(data['total_amount']) == 500.00

    def test_get_budget_not_found(self, client, auth_headers):
        """Test getting non-existent budget"""
        response = client.get('/api/budgets/99999', headers=auth_headers)
        assert response.status_code == 404

    def test_get_budget_unauthorized(self, client, sample_patient, sample_professional, app):
        """Test getting budget without authentication"""
        with app.app_context():
            budget = Budget(
                patient_id=sample_patient.id,
                created_by=sample_professional.id,
                title='Unauth Budget',
                total_amount=Decimal('300.00')
            )
            db.session.add(budget)
            db.session.commit()
            budget_id = budget.id

        response = client.get(f'/api/budgets/{budget_id}')
        assert response.status_code == 401

    def test_get_budget_forbidden_for_unlinked_professional(
        self,
        client,
        auth_headers,
        sample_patient,
        app,
    ):
        """Professional should not read budgets from unrelated patients."""
        with app.app_context():
            other_professional = Professional(
                email='budget-other-prof@test.com',
                first_name='Other',
                last_name='Doctor',
                role='professional',
                license_number='BGT-OTH-001',
                specialty='Cardiología',
            )
            other_professional.set_password('Doctor123')
            db.session.add(other_professional)
            db.session.flush()

            patient_2 = Patient(
                email='budget-unlinked-patient@test.com',
                first_name='Budget',
                last_name='Unlinked',
                role='patient',
            )
            patient_2.set_password('Patient123')
            db.session.add(patient_2)
            db.session.flush()

            budget = Budget(
                patient_id=patient_2.id,
                created_by=other_professional.id,
                title='Scoped Budget',
                total_amount=Decimal('300.00'),
            )
            db.session.add(budget)
            db.session.commit()
            budget_id = budget.id

        response = client.get(f'/api/budgets/{budget_id}', headers=auth_headers)
        assert response.status_code == 403

    def test_admin_can_filter_budgets_by_specialty_key(
        self,
        client,
        admin_auth_headers,
        app,
    ):
        """Admin specialty_key filter should return only module budgets."""
        with app.app_context():
            cardio_professional = Professional(
                email='budget-cardio-prof@test.com',
                first_name='Cardio',
                last_name='Doctor',
                role='professional',
                license_number='BGT-CARD-001',
                specialty='Cardiología',
            )
            cardio_professional.set_password('Doctor123')
            db.session.add(cardio_professional)

            derm_professional = Professional(
                email='budget-derm-prof@test.com',
                first_name='Derm',
                last_name='Doctor',
                role='professional',
                license_number='BGT-DERM-001',
                specialty='Dermatología',
            )
            derm_professional.set_password('Doctor123')
            db.session.add(derm_professional)
            db.session.flush()

            cardio_patient = Patient(
                email='budget-cardio-patient@test.com',
                first_name='Cardio',
                last_name='Patient',
                role='patient',
            )
            cardio_patient.set_password('Patient123')
            derm_patient = Patient(
                email='budget-derm-patient@test.com',
                first_name='Derm',
                last_name='Patient',
                role='patient',
            )
            derm_patient.set_password('Patient123')
            db.session.add_all([cardio_patient, derm_patient])
            db.session.flush()

            cardio_budget = Budget(
                patient_id=cardio_patient.id,
                created_by=cardio_professional.id,
                title='Cardio Budget',
                total_amount=Decimal('1200.00'),
            )
            derm_budget = Budget(
                patient_id=derm_patient.id,
                created_by=derm_professional.id,
                title='Derm Budget',
                total_amount=Decimal('900.00'),
            )
            db.session.add_all([cardio_budget, derm_budget])
            db.session.commit()
            cardio_budget_id = cardio_budget.id
            derm_budget_id = derm_budget.id

        response = client.get(
            '/api/budgets?specialty_key=cardiology',
            headers=admin_auth_headers,
        )
        assert response.status_code == 200
        payload = response.json
        returned_ids = {item['id'] for item in payload}
        assert cardio_budget_id in returned_ids
        assert derm_budget_id not in returned_ids


class TestCreateBudget:
    """Test create budget endpoint"""

    def test_create_budget_success(self, client, auth_headers, sample_patient):
        """Test creating a new budget"""
        data = {
            'patient_id': sample_patient.id,
            'title': 'New Treatment Budget',
            'description': 'Budget for dental treatment',
            'total_amount': 2500.00,
            'currency': 'PYG',
            'items': [
                {'description': 'Consultation', 'quantity': 1, 'unit_price': 500.00, 'total': 500.00},
                {'description': 'Treatment', 'quantity': 2, 'unit_price': 1000.00, 'total': 2000.00}
            ]
        }

        response = client.post('/api/budgets', json=data, headers=auth_headers)

        assert response.status_code == 201
        json_data = response.json
        assert json_data['title'] == 'New Treatment Budget'
        assert float(json_data['total_amount']) == 2500.00
        assert json_data['status'] == 'draft'
        assert len(json_data['items']) == 2

    def test_create_budget_missing_fields(self, client, auth_headers):
        """Test creating budget with missing required fields"""
        data = {
            'title': 'Incomplete Budget'
            # Missing patient_id and total_amount
        }

        response = client.post('/api/budgets', json=data, headers=auth_headers)
        assert response.status_code == 400

    def test_create_budget_unauthorized(self, client, patient_auth_headers, sample_patient):
        """Test creating budget as non-professional (should fail)"""
        data = {
            'patient_id': sample_patient.id,
            'title': 'Budget',
            'total_amount': 1000.00
        }

        response = client.post('/api/budgets', json=data, headers=patient_auth_headers)
        # Should fail - only professionals can create budgets
        assert response.status_code in [401, 403]


class TestUpdateBudget:
    """Test update budget endpoint"""

    def test_update_budget_success(self, client, auth_headers, sample_patient, sample_professional, app):
        """Test updating a budget"""
        with app.app_context():
            budget = Budget(
                patient_id=sample_patient.id,
                created_by=sample_professional.id,
                title='Original Title',
                total_amount=Decimal('1000.00'),
                description='Original description'
            )
            db.session.add(budget)
            db.session.commit()
            budget_id = budget.id

        update_data = {
            'title': 'Updated Title',
            'description': 'Updated description',
            'total_amount': 1500.00
        }

        response = client.put(f'/api/budgets/{budget_id}', json=update_data, headers=auth_headers)

        assert response.status_code == 200
        data = response.json
        assert data['title'] == 'Updated Title'
        assert data['description'] == 'Updated description'
        assert float(data['total_amount']) == 1500.00

    def test_update_budget_not_found(self, client, auth_headers):
        """Test updating non-existent budget"""
        response = client.put('/api/budgets/99999', json={'title': 'New Title'}, headers=auth_headers)
        assert response.status_code == 404

    def test_update_budget_unauthorized(self, client, patient_auth_headers, sample_patient, sample_professional, app):
        """Test updating budget as non-professional"""
        with app.app_context():
            budget = Budget(
                patient_id=sample_patient.id,
                created_by=sample_professional.id,
                title='Budget',
                total_amount=Decimal('500.00')
            )
            db.session.add(budget)
            db.session.commit()
            budget_id = budget.id

        response = client.put(
            f'/api/budgets/{budget_id}',
            json={'title': 'Hacked'},
            headers=patient_auth_headers
        )
        assert response.status_code in [401, 403]

    def test_update_budget_supports_currency_patient_and_valid_until(self, client, auth_headers, sample_patient, sample_professional, app):
        """Test update supports frontend fields currency/patient_id/valid_until."""
        with app.app_context():
            another_patient = Patient(
                email='budget-update-patient@test.com',
                first_name='Budget',
                last_name='Patient',
                role='patient'
            )
            another_patient.set_password('Patient123')
            db.session.add(another_patient)
            db.session.flush()

            budget = Budget(
                patient_id=sample_patient.id,
                created_by=sample_professional.id,
                title='Budget Update Fields',
                total_amount=Decimal('1200.00'),
                currency='PYG'
            )
            db.session.add(budget)
            db.session.commit()
            budget_id = budget.id
            another_patient_id = another_patient.id

        response = client.put(
            f'/api/budgets/{budget_id}',
            json={
                'patient_id': another_patient_id,
                'currency': 'USD',
                'valid_until': '2026-12-31'
            },
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json
        assert data['patient_id'] == another_patient_id
        assert data['currency'] == 'USD'
        assert data['valid_until'] == '2026-12-31'

    def test_update_budget_invalid_valid_until(self, client, auth_headers, sample_patient, sample_professional, app):
        """Test update rejects invalid valid_until format."""
        with app.app_context():
            budget = Budget(
                patient_id=sample_patient.id,
                created_by=sample_professional.id,
                title='Budget Invalid Date',
                total_amount=Decimal('1500.00')
            )
            db.session.add(budget)
            db.session.commit()
            budget_id = budget.id

        response = client.put(
            f'/api/budgets/{budget_id}',
            json={'valid_until': '31/12/2026'},
            headers=auth_headers
        )

        assert response.status_code == 400


class TestDeleteBudget:
    """Test delete budget endpoint"""

    def test_delete_budget_success(self, client, auth_headers, sample_patient, sample_professional, app):
        """Test deleting a budget"""
        with app.app_context():
            budget = Budget(
                patient_id=sample_patient.id,
                created_by=sample_professional.id,
                title='Delete Me',
                total_amount=Decimal('800.00')
            )
            db.session.add(budget)
            db.session.commit()
            budget_id = budget.id

        response = client.delete(f'/api/budgets/{budget_id}', headers=auth_headers)

        assert response.status_code == 200
        assert 'Budget deleted' in response.json['msg']

    def test_delete_budget_not_found(self, client, auth_headers):
        """Test deleting non-existent budget"""
        response = client.delete('/api/budgets/99999', headers=auth_headers)
        assert response.status_code == 404

    def test_delete_budget_unauthorized(self, client, patient_auth_headers, sample_patient, sample_professional, app):
        """Test deleting budget as non-professional"""
        with app.app_context():
            budget = Budget(
                patient_id=sample_patient.id,
                created_by=sample_professional.id,
                title='Protected',
                total_amount=Decimal('600.00')
            )
            db.session.add(budget)
            db.session.commit()
            budget_id = budget.id

        response = client.delete(f'/api/budgets/{budget_id}', headers=patient_auth_headers)
        assert response.status_code in [401, 403]


class TestBudgetWorkflow:
    """Test budget workflow: send and accept"""

    def test_send_budget(self, client, auth_headers, sample_patient, sample_professional, app):
        """Test sending budget to patient"""
        with app.app_context():
            budget = Budget(
                patient_id=sample_patient.id,
                created_by=sample_professional.id,
                title='Budget to Send',
                total_amount=Decimal('1200.00'),
                status='draft'
            )
            db.session.add(budget)
            db.session.commit()
            budget_id = budget.id

        response = client.post(f'/api/budgets/{budget_id}/send', headers=auth_headers)

        assert response.status_code == 200
        data = response.json
        assert data['status'] == 'sent'

    def test_send_budget_not_found(self, client, auth_headers):
        """Test sending non-existent budget"""
        response = client.post('/api/budgets/99999/send', headers=auth_headers)
        assert response.status_code == 404

    def test_accept_budget(self, client, sample_patient, sample_professional, app):
        """Test accepting budget as patient"""
        with app.app_context():
            budget = Budget(
                patient_id=sample_patient.id,
                created_by=sample_professional.id,
                title='Budget to Accept',
                total_amount=Decimal('900.00'),
                status='sent'
            )
            db.session.add(budget)
            db.session.commit()
            budget_id = budget.id

        response = client.post(
            f'/api/budgets/{budget_id}/accept',
            headers=sample_patient_headers(client),
        )

        assert response.status_code == 200
        data = response.json
        assert data['status'] == 'accepted'

    def test_accept_budget_not_found(self, client, patient_auth_headers):
        """Test accepting non-existent budget"""
        response = client.post(
            '/api/budgets/99999/accept',
            headers=patient_auth_headers,
        )
        assert response.status_code == 404

    def test_complete_workflow(self, client, auth_headers, sample_patient, sample_professional, app):
        """Test complete budget workflow: create -> send -> accept"""
        # 1. Create budget
        data = {
            'patient_id': sample_patient.id,
            'title': 'Complete Workflow Budget',
            'total_amount': 3000.00,
            'description': 'Full treatment plan'
        }

        response = client.post('/api/budgets', json=data, headers=auth_headers)
        assert response.status_code == 201
        budget_id = response.json['id']
        assert response.json['status'] == 'draft'

        # 2. Send budget
        response = client.post(f'/api/budgets/{budget_id}/send', headers=auth_headers)
        assert response.status_code == 200
        assert response.json['status'] == 'sent'

        # 3. Accept budget (as patient)
        response = client.post(
            f'/api/budgets/{budget_id}/accept',
            headers=sample_patient_headers(client),
        )
        assert response.status_code == 200
        assert response.json['status'] == 'accepted'

        # 4. Verify final state
        response = client.get(f'/api/budgets/{budget_id}', headers=auth_headers)
        assert response.status_code == 200
        assert response.json['status'] == 'accepted'
