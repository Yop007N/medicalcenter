# -*- coding: utf-8 -*-
"""
Tests for Budget module
"""

import pytest
from decimal import Decimal
from datetime import date, timedelta
from app.models.budget import Budget
from app.extensions import db


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


class TestCreateBudget:
    """Test create budget endpoint"""

    def test_create_budget_success(self, client, auth_headers, sample_patient):
        """Test creating a new budget"""
        data = {
            'patient_id': sample_patient.id,
            'title': 'New Treatment Budget',
            'description': 'Budget for dental treatment',
            'total_amount': 2500.00,
            'currency': 'ARS',
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

    def test_accept_budget(self, client, patient_auth_headers, sample_patient, sample_professional, app):
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

        response = client.post(f'/api/budgets/{budget_id}/accept', headers=patient_auth_headers)

        assert response.status_code == 200
        data = response.json
        assert data['status'] == 'accepted'

    def test_accept_budget_not_found(self, client, patient_auth_headers):
        """Test accepting non-existent budget"""
        response = client.post('/api/budgets/99999/accept', headers=patient_auth_headers)
        assert response.status_code == 404

    def test_complete_workflow(self, client, auth_headers, patient_auth_headers, sample_patient, sample_professional, app):
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
        response = client.post(f'/api/budgets/{budget_id}/accept', headers=patient_auth_headers)
        assert response.status_code == 200
        assert response.json['status'] == 'accepted'

        # 4. Verify final state
        response = client.get(f'/api/budgets/{budget_id}', headers=auth_headers)
        assert response.status_code == 200
        assert response.json['status'] == 'accepted'
