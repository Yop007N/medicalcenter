# -*- coding: utf-8 -*-
"""
Tests for Payment module
"""

import pytest
from decimal import Decimal
from datetime import datetime
from app.models.payment import Payment
from app.models.budget import Budget
from app.extensions import db


class TestListPayments:
    """Test list payments endpoint"""

    def test_list_payments_success(self, client, auth_headers, sample_patient, sample_professional, app):
        """Test listing all payments"""
        with app.app_context():
            payment = Payment(
                amount=Decimal('500.00'),
                payment_method='cash',
                payment_status='pending'
            )
            db.session.add(payment)
            db.session.commit()

        response = client.get('/api/payments', headers=auth_headers)

        assert response.status_code == 200
        data = response.json
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_list_payments_with_budget_filter(self, client, auth_headers, sample_patient, sample_professional, app):
        """Test listing payments filtered by budget"""
        with app.app_context():
            budget = Budget(
                patient_id=sample_patient.id,
                created_by=sample_professional.id,
                title='Test Budget',
                total_amount=Decimal('1000.00')
            )
            db.session.add(budget)
            db.session.commit()

            payment = Payment(
                budget_id=budget.id,
                amount=Decimal('500.00'),
                payment_method='card'
            )
            db.session.add(payment)
            db.session.commit()
            budget_id = budget.id

        response = client.get(f'/api/payments?budget_id={budget_id}', headers=auth_headers)

        assert response.status_code == 200
        data = response.json
        assert isinstance(data, list)

    def test_list_payments_with_status_filter(self, client, auth_headers, app):
        """Test listing payments filtered by status"""
        with app.app_context():
            payment = Payment(
                amount=Decimal('300.00'),
                payment_method='transfer',
                payment_status='completed'
            )
            db.session.add(payment)
            db.session.commit()

        response = client.get('/api/payments?status=completed', headers=auth_headers)

        assert response.status_code == 200
        data = response.json
        assert isinstance(data, list)

    def test_list_payments_unauthorized(self, client):
        """Test listing payments without authentication"""
        response = client.get('/api/payments')
        assert response.status_code == 401


class TestGetPayment:
    """Test get payment endpoint"""

    def test_get_payment_success(self, client, auth_headers, app):
        """Test getting a payment by ID"""
        with app.app_context():
            payment = Payment(
                amount=Decimal('750.00'),
                payment_method='cash',
                payment_status='pending',
                notes='Test payment'
            )
            db.session.add(payment)
            db.session.commit()
            payment_id = payment.id

        response = client.get(f'/api/payments/{payment_id}', headers=auth_headers)

        assert response.status_code == 200
        data = response.json
        assert float(data['amount']) == 750.00
        assert data['payment_method'] == 'cash'

    def test_get_payment_not_found(self, client, auth_headers):
        """Test getting non-existent payment"""
        response = client.get('/api/payments/99999', headers=auth_headers)
        assert response.status_code == 404

    def test_get_payment_unauthorized(self, client, app):
        """Test getting payment without authentication"""
        with app.app_context():
            payment = Payment(
                amount=Decimal('200.00'),
                payment_method='card'
            )
            db.session.add(payment)
            db.session.commit()
            payment_id = payment.id

        response = client.get(f'/api/payments/{payment_id}')
        assert response.status_code == 401


class TestCreatePayment:
    """Test create payment endpoint"""

    def test_create_payment_success(self, client, auth_headers):
        """Test creating a new payment"""
        data = {
            'amount': 1000.00,
            'payment_method': 'card',
            'currency': 'ARS',
            'notes': 'Payment for treatment'
        }

        response = client.post('/api/payments', json=data, headers=auth_headers)

        assert response.status_code == 201
        json_data = response.json
        assert float(json_data['amount']) == 1000.00
        assert json_data['payment_method'] == 'card'
        assert json_data['payment_status'] == 'pending'

    def test_create_payment_with_budget(self, client, auth_headers, sample_patient, sample_professional, app):
        """Test creating payment linked to budget"""
        with app.app_context():
            budget = Budget(
                patient_id=sample_patient.id,
                created_by=sample_professional.id,
                title='Budget for Payment',
                total_amount=Decimal('2000.00')
            )
            db.session.add(budget)
            db.session.commit()
            budget_id = budget.id

        data = {
            'budget_id': budget_id,
            'amount': 2000.00,
            'payment_method': 'transfer'
        }

        response = client.post('/api/payments', json=data, headers=auth_headers)

        assert response.status_code == 201
        json_data = response.json
        assert json_data['budget_id'] == budget_id

    def test_create_payment_supports_payment_date_and_transaction_reference(self, client, auth_headers):
        """Test creating payment with frontend aliases payment_date/transaction_reference."""
        data = {
            'amount': 350.00,
            'payment_method': 'transfer',
            'payment_date': '2026-02-14T15:30:00Z',
            'transaction_reference': 'REF-12345'
        }

        response = client.post('/api/payments', json=data, headers=auth_headers)

        assert response.status_code == 201
        json_data = response.json
        assert json_data['transaction_id'] == 'REF-12345'
        assert json_data['transaction_reference'] == 'REF-12345'
        assert json_data['payment_date'].startswith('2026-02-14T15:30:00')

    def test_create_payment_invalid_payment_date(self, client, auth_headers):
        """Test creating payment rejects invalid payment_date format."""
        data = {
            'amount': 200.00,
            'payment_method': 'cash',
            'payment_date': '14/02/2026 15:30'
        }

        response = client.post('/api/payments', json=data, headers=auth_headers)
        assert response.status_code == 400

    def test_create_payment_missing_fields(self, client, auth_headers):
        """Test creating payment with missing required fields"""
        data = {
            'amount': 500.00
            # Missing payment_method
        }

        response = client.post('/api/payments', json=data, headers=auth_headers)
        assert response.status_code == 400

    def test_create_payment_unauthorized(self, client, patient_auth_headers):
        """Test creating payment as non-professional (should fail)"""
        data = {
            'amount': 100.00,
            'payment_method': 'cash'
        }

        response = client.post('/api/payments', json=data, headers=patient_auth_headers)
        # Should fail - only professionals can create payments
        assert response.status_code in [401, 403]


class TestUpdatePayment:
    """Test update payment endpoint"""

    def test_update_payment_success(self, client, auth_headers, app):
        """Test updating a payment"""
        with app.app_context():
            payment = Payment(
                amount=Decimal('800.00'),
                payment_method='cash',
                payment_status='pending'
            )
            db.session.add(payment)
            db.session.commit()
            payment_id = payment.id

        update_data = {
            'amount': 900.00,
            'payment_method': 'card',
            'payment_status': 'completed',
            'notes': 'Updated payment'
        }

        response = client.put(f'/api/payments/{payment_id}', json=update_data, headers=auth_headers)

        assert response.status_code == 200
        data = response.json
        assert float(data['amount']) == 900.00
        assert data['payment_method'] == 'card'
        assert data['payment_status'] == 'completed'
        assert data['notes'] == 'Updated payment'

    def test_update_payment_not_found(self, client, auth_headers):
        """Test updating non-existent payment"""
        response = client.put('/api/payments/99999', json={'amount': 100.00}, headers=auth_headers)
        assert response.status_code == 404

    def test_update_payment_unauthorized(self, client, patient_auth_headers, app):
        """Test updating payment as non-professional"""
        with app.app_context():
            payment = Payment(
                amount=Decimal('500.00'),
                payment_method='cash'
            )
            db.session.add(payment)
            db.session.commit()
            payment_id = payment.id

        response = client.put(
            f'/api/payments/{payment_id}',
            json={'amount': 600.00},
            headers=patient_auth_headers
        )
        assert response.status_code in [401, 403]

    def test_update_payment_supports_payment_date_and_reference_alias(self, client, auth_headers, app):
        """Test update supports payment_date and transaction_reference alias."""
        with app.app_context():
            payment = Payment(
                amount=Decimal('420.00'),
                payment_method='cash',
                payment_status='pending'
            )
            db.session.add(payment)
            db.session.commit()
            payment_id = payment.id

        response = client.put(
            f'/api/payments/{payment_id}',
            json={
                'payment_date': '2026-02-14T18:00:00Z',
                'transaction_reference': 'UPD-REF-001'
            },
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json
        assert data['transaction_id'] == 'UPD-REF-001'
        assert data['transaction_reference'] == 'UPD-REF-001'
        assert data['payment_date'].startswith('2026-02-14T18:00:00')

    def test_update_payment_invalid_payment_date(self, client, auth_headers, app):
        """Test update rejects invalid payment_date format."""
        with app.app_context():
            payment = Payment(
                amount=Decimal('510.00'),
                payment_method='card',
                payment_status='pending'
            )
            db.session.add(payment)
            db.session.commit()
            payment_id = payment.id

        response = client.put(
            f'/api/payments/{payment_id}',
            json={'payment_date': '14-02-2026 18:00'},
            headers=auth_headers
        )

        assert response.status_code == 400


class TestProcessPayment:
    """Test process payment endpoint"""

    def test_process_payment_success(self, client, auth_headers, app):
        """Test processing a payment"""
        with app.app_context():
            payment = Payment(
                amount=Decimal('1500.00'),
                payment_method='card',
                payment_status='pending'
            )
            db.session.add(payment)
            db.session.commit()
            payment_id = payment.id

        data = {
            'transaction_id': 'TXN-ABC123'
        }

        response = client.post(f'/api/payments/{payment_id}/process', json=data, headers=auth_headers)

        assert response.status_code == 200
        json_data = response.json
        assert json_data['payment_status'] == 'completed'
        assert json_data['transaction_id'] == 'TXN-ABC123'
        assert 'payment_date' in json_data

    def test_process_payment_without_transaction_id(self, client, auth_headers, app):
        """Test processing payment without providing transaction_id (should auto-generate)"""
        with app.app_context():
            payment = Payment(
                amount=Decimal('600.00'),
                payment_method='cash',
                payment_status='pending'
            )
            db.session.add(payment)
            db.session.commit()
            payment_id = payment.id

        response = client.post(f'/api/payments/{payment_id}/process', json={}, headers=auth_headers)

        assert response.status_code == 200
        json_data = response.json
        assert json_data['payment_status'] == 'completed'
        assert json_data['transaction_id'] == f'TXN-{payment_id}'

    def test_process_payment_not_found(self, client, auth_headers):
        """Test processing non-existent payment"""
        response = client.post('/api/payments/99999/process', json={}, headers=auth_headers)
        assert response.status_code == 404

    def test_process_payment_unauthorized(self, client, patient_auth_headers, app):
        """Test processing payment as non-professional"""
        with app.app_context():
            payment = Payment(
                amount=Decimal('400.00'),
                payment_method='transfer',
                payment_status='pending'
            )
            db.session.add(payment)
            db.session.commit()
            payment_id = payment.id

        response = client.post(f'/api/payments/{payment_id}/process', json={}, headers=patient_auth_headers)
        assert response.status_code in [401, 403]


class TestPaymentWorkflow:
    """Test complete payment workflow"""

    def test_complete_payment_workflow(self, client, auth_headers, sample_patient, sample_professional, app):
        """Test complete workflow: create budget -> create payment -> process payment"""
        # 1. Create budget
        with app.app_context():
            budget = Budget(
                patient_id=sample_patient.id,
                created_by=sample_professional.id,
                title='Workflow Budget',
                total_amount=Decimal('3000.00')
            )
            db.session.add(budget)
            db.session.commit()
            budget_id = budget.id

        # 2. Create payment for budget
        data = {
            'budget_id': budget_id,
            'amount': 3000.00,
            'payment_method': 'card',
            'notes': 'Full payment for treatment'
        }

        response = client.post('/api/payments', json=data, headers=auth_headers)
        assert response.status_code == 201
        payment_id = response.json['id']
        assert response.json['payment_status'] == 'pending'
        assert response.json['budget_id'] == budget_id

        # 3. Process payment
        process_data = {
            'transaction_id': 'TXN-WORKFLOW-123'
        }

        response = client.post(f'/api/payments/{payment_id}/process', json=process_data, headers=auth_headers)
        assert response.status_code == 200
        assert response.json['payment_status'] == 'completed'
        assert response.json['transaction_id'] == 'TXN-WORKFLOW-123'

        # 4. Verify final state
        response = client.get(f'/api/payments/{payment_id}', headers=auth_headers)
        assert response.status_code == 200
        assert response.json['payment_status'] == 'completed'
        assert 'payment_date' in response.json

    def test_partial_payments_for_budget(self, client, auth_headers, sample_patient, sample_professional, app):
        """Test multiple partial payments for same budget"""
        with app.app_context():
            budget = Budget(
                patient_id=sample_patient.id,
                created_by=sample_professional.id,
                title='Budget with Partial Payments',
                total_amount=Decimal('5000.00')
            )
            db.session.add(budget)
            db.session.commit()
            budget_id = budget.id

        # First payment
        data1 = {
            'budget_id': budget_id,
            'amount': 2000.00,
            'payment_method': 'cash',
            'notes': 'First partial payment'
        }

        response1 = client.post('/api/payments', json=data1, headers=auth_headers)
        assert response1.status_code == 201
        payment1_id = response1.json['id']

        # Second payment
        data2 = {
            'budget_id': budget_id,
            'amount': 3000.00,
            'payment_method': 'card',
            'notes': 'Second partial payment'
        }

        response2 = client.post('/api/payments', json=data2, headers=auth_headers)
        assert response2.status_code == 201
        payment2_id = response2.json['id']

        # List payments for budget
        response = client.get(f'/api/payments?budget_id={budget_id}', headers=auth_headers)
        assert response.status_code == 200
        payments = response.json
        assert len(payments) == 2

        # Verify total
        total = sum(float(p['amount']) for p in payments)
        assert total == 5000.00
