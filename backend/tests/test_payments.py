# -*- coding: utf-8 -*-
"""
Tests for Payment module
"""

import pytest
from decimal import Decimal
from datetime import datetime
from app.models.payment import Payment
from app.models.budget import Budget
from app.models.patient import Patient
from app.models.professional import Professional
from app.models.professional_patient_assignment import ProfessionalPatientAssignment
from app.extensions import db


def professional_headers(client, email, password='Doctor123'):
    response = client.post(
        '/api/auth/login',
        json={'email': email, 'password': password},
    )
    assert response.status_code == 200
    return {'Authorization': f"Bearer {response.get_json()['access_token']}"}


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

    def test_professional_can_list_payments_scoped_by_own_specialty(self, client, app):
        with app.app_context():
            cardio_professional = Professional(
                email='payment-scope-cardio-prof@test.com',
                first_name='Carla',
                last_name='Cardio',
                role='professional',
                license_number='PAY-SCOPE-CARD-001',
                specialty='Cardiología',
            )
            cardio_professional.set_password('Doctor123')

            derm_professional = Professional(
                email='payment-scope-derm-prof@test.com',
                first_name='Diego',
                last_name='Derma',
                role='professional',
                license_number='PAY-SCOPE-DERM-001',
                specialty='Dermatología',
            )
            derm_professional.set_password('Doctor123')

            cardio_patient = Patient(
                email='payment-scope-cardio-patient@test.com',
                first_name='Paciente',
                last_name='Cardio',
                role='patient',
            )
            cardio_patient.set_password('Patient123')

            derm_patient = Patient(
                email='payment-scope-derm-patient@test.com',
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
                title='Cardio payment budget',
                total_amount=Decimal('1000.00'),
            )
            derm_budget = Budget(
                patient_id=derm_patient.id,
                created_by=derm_professional.id,
                title='Derm payment budget',
                total_amount=Decimal('900.00'),
            )
            db.session.add_all([cardio_budget, derm_budget])
            db.session.flush()

            cardio_payment = Payment(
                budget_id=cardio_budget.id,
                amount=Decimal('250.00'),
                payment_method='cash',
                payment_status='pending',
            )
            derm_payment = Payment(
                budget_id=derm_budget.id,
                amount=Decimal('180.00'),
                payment_method='card',
                payment_status='pending',
            )
            db.session.add_all([cardio_payment, derm_payment])
            db.session.commit()
            cardio_payment_id = cardio_payment.id
            derm_payment_id = derm_payment.id
            cardio_patient_id = cardio_patient.id

        headers = professional_headers(client, 'payment-scope-cardio-prof@test.com')
        response = client.get(
            f'/api/payments?specialty_key=cardiology&patient_id={cardio_patient_id}',
            headers=headers,
        )

        assert response.status_code == 200
        payload = response.get_json()
        returned_ids = {item['id'] for item in payload}
        assert cardio_payment_id in returned_ids
        assert derm_payment_id not in returned_ids

    def test_professional_payment_scope_rejects_mismatched_specialty_key(self, client, app):
        with app.app_context():
            cardio_professional = Professional(
                email='payment-scope-mismatch@test.com',
                first_name='Cora',
                last_name='Mismatch',
                role='professional',
                license_number='PAY-SCOPE-MISMATCH',
                specialty='Cardiología',
            )
            cardio_professional.set_password('Doctor123')
            db.session.add(cardio_professional)
            db.session.commit()

        headers = professional_headers(client, 'payment-scope-mismatch@test.com')
        response = client.get('/api/payments?specialty_key=dermatology', headers=headers)
        assert response.status_code == 403


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

    def test_get_payment_forbidden_for_unlinked_professional(
        self,
        client,
        auth_headers,
        app,
    ):
        """Professional should not access payment from unrelated patient scope."""
        with app.app_context():
            other_professional = Professional(
                email='payment-other-prof@test.com',
                first_name='Other',
                last_name='Doctor',
                role='professional',
                license_number='PAY-OTH-001',
                specialty='Cardiología',
            )
            other_professional.set_password('Doctor123')
            db.session.add(other_professional)
            db.session.flush()

            patient_2 = Patient(
                email='payment-unlinked-patient@test.com',
                first_name='Payment',
                last_name='Unlinked',
                role='patient',
            )
            patient_2.set_password('Patient123')
            db.session.add(patient_2)
            db.session.flush()

            budget = Budget(
                patient_id=patient_2.id,
                created_by=other_professional.id,
                title='Payment Scope Budget',
                total_amount=Decimal('1200.00'),
            )
            db.session.add(budget)
            db.session.flush()

            payment = Payment(
                budget_id=budget.id,
                amount=Decimal('500.00'),
                payment_method='cash',
                payment_status='pending',
            )
            db.session.add(payment)
            db.session.commit()
            payment_id = payment.id

        response = client.get(f'/api/payments/{payment_id}', headers=auth_headers)
        assert response.status_code == 403

    def test_admin_can_filter_payments_by_specialty_key(
        self,
        client,
        admin_auth_headers,
        app,
    ):
        """Admin specialty_key filter should return only module payments."""
        with app.app_context():
            cardio_professional = Professional(
                email='payment-cardio-prof@test.com',
                first_name='Cardio',
                last_name='Doctor',
                role='professional',
                license_number='PAY-CARD-001',
                specialty='Cardiología',
            )
            cardio_professional.set_password('Doctor123')
            db.session.add(cardio_professional)

            derm_professional = Professional(
                email='payment-derm-prof@test.com',
                first_name='Derm',
                last_name='Doctor',
                role='professional',
                license_number='PAY-DERM-001',
                specialty='Dermatología',
            )
            derm_professional.set_password('Doctor123')
            db.session.add(derm_professional)
            db.session.flush()

            cardio_patient = Patient(
                email='payment-cardio-patient@test.com',
                first_name='Cardio',
                last_name='Patient',
                role='patient',
            )
            cardio_patient.set_password('Patient123')
            derm_patient = Patient(
                email='payment-derm-patient@test.com',
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
                title='Cardio Payment Budget',
                total_amount=Decimal('1000.00'),
            )
            derm_budget = Budget(
                patient_id=derm_patient.id,
                created_by=derm_professional.id,
                title='Derm Payment Budget',
                total_amount=Decimal('1000.00'),
            )
            db.session.add_all([cardio_budget, derm_budget])
            db.session.flush()

            cardio_payment = Payment(
                budget_id=cardio_budget.id,
                amount=Decimal('100.00'),
                payment_method='card',
                payment_status='pending',
            )
            derm_payment = Payment(
                budget_id=derm_budget.id,
                amount=Decimal('200.00'),
                payment_method='card',
                payment_status='pending',
            )
            db.session.add_all([cardio_payment, derm_payment])
            db.session.commit()
            cardio_payment_id = cardio_payment.id
            derm_payment_id = derm_payment.id

        response = client.get(
            '/api/payments?specialty_key=cardiology',
            headers=admin_auth_headers,
        )
        assert response.status_code == 200
        payload = response.json
        returned_ids = {item['id'] for item in payload}
        assert cardio_payment_id in returned_ids
        assert derm_payment_id not in returned_ids


class TestCreatePayment:
    """Test create payment endpoint"""

    def test_create_payment_success(self, client, auth_headers):
        """Test creating a new payment"""
        data = {
            'amount': 1000.00,
            'payment_method': 'card',
            'currency': 'PYG',
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

    def test_create_payment_rejects_duplicate_transaction_reference(self, client, auth_headers):
        """Creating a second payment with the same transaction reference should return conflict."""
        first_response = client.post(
            '/api/payments',
            json={
                'amount': 500.00,
                'payment_method': 'transfer',
                'transaction_reference': 'DUP-REF-001'
            },
            headers=auth_headers
        )
        assert first_response.status_code == 201

        second_response = client.post(
            '/api/payments',
            json={
                'amount': 800.00,
                'payment_method': 'card',
                'transaction_reference': 'DUP-REF-001'
            },
            headers=auth_headers
        )

        assert second_response.status_code == 409
        assert 'transaction_id already exists' in second_response.get_json().get('msg', '')

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

    def test_update_payment_rejects_duplicate_transaction_id(self, client, auth_headers, app):
        """Updating transaction_id to an existing value should return conflict."""
        with app.app_context():
            existing = Payment(
                amount=Decimal('510.00'),
                payment_method='card',
                payment_status='pending',
                transaction_id='DUP-UPD-001',
            )
            target = Payment(
                amount=Decimal('220.00'),
                payment_method='cash',
                payment_status='pending',
            )
            db.session.add_all([existing, target])
            db.session.commit()
            target_id = target.id

        response = client.put(
            f'/api/payments/{target_id}',
            json={'transaction_id': 'DUP-UPD-001'},
            headers=auth_headers
        )

        assert response.status_code == 409
        assert 'transaction_id already exists' in response.get_json().get('msg', '')


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

    def test_process_payment_rejects_duplicate_transaction_id(self, client, auth_headers, app):
        """Processing with duplicate transaction_id should return conflict."""
        with app.app_context():
            first = Payment(
                amount=Decimal('300.00'),
                payment_method='cash',
                payment_status='pending',
            )
            second = Payment(
                amount=Decimal('450.00'),
                payment_method='card',
                payment_status='pending',
            )
            db.session.add_all([first, second])
            db.session.commit()
            first_id = first.id
            second_id = second.id

        first_process = client.post(
            f'/api/payments/{first_id}/process',
            json={'transaction_id': 'DUP-PROC-001'},
            headers=auth_headers
        )
        assert first_process.status_code == 200

        second_process = client.post(
            f'/api/payments/{second_id}/process',
            json={'transaction_id': 'DUP-PROC-001'},
            headers=auth_headers
        )
        assert second_process.status_code == 409
        assert 'transaction_id already exists' in second_process.get_json().get('msg', '')

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
