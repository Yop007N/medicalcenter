# -*- coding: utf-8 -*-
"""
Tests for Reports functionality
"""

import pytest
from datetime import datetime, timedelta
from flask_jwt_extended import create_access_token


class TestPatientHistoryReport:
    """Test patient history report generation"""

    def test_patient_history_report_success(self, client, admin_user, sample_patient):
        """Test generating patient history report"""
        with client.application.app_context():
            token = create_access_token(identity=str(admin_user.id))

        response = client.get(
            f'/api/reports/medical/patient/{sample_patient.id}',
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'patient' in data
        assert 'summary' in data
        assert 'medical_records' in data
        assert data['patient']['id'] == sample_patient.id

    def test_patient_history_report_with_date_filter(self, client, admin_user, sample_patient):
        """Test patient history with date filters"""
        with client.application.app_context():
            token = create_access_token(identity=str(admin_user.id))

        start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        end_date = datetime.now().strftime('%Y-%m-%d')

        response = client.get(
            f'/api/reports/medical/patient/{sample_patient.id}',
            query_string={
                'start_date': start_date,
                'end_date': end_date
            },
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        # Dates come back as ISO format with time, so just check they start with the date
        assert data['period']['start_date'].startswith(start_date)
        assert data['period']['end_date'].startswith(end_date)

    def test_patient_history_report_not_found(self, client, admin_user):
        """Test patient history for non-existent patient"""
        with client.application.app_context():
            token = create_access_token(identity=str(admin_user.id))

        response = client.get(
            '/api/reports/medical/patient/99999',
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response.status_code == 404

    def test_patient_history_report_csv_export(self, client, admin_user, sample_patient):
        """Test CSV export of patient history"""
        with client.application.app_context():
            token = create_access_token(identity=str(admin_user.id))

        response = client.get(
            f'/api/reports/medical/patient/{sample_patient.id}',
            query_string={'format': 'csv'},
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response.status_code == 200
        assert response.mimetype == 'text/csv'

    def test_patient_history_report_unauthorized(self, client, sample_patient):
        """Test patient history without authentication"""
        response = client.get(f'/api/reports/medical/patient/{sample_patient.id}')
        assert response.status_code == 401


class TestProfessionalActivityReport:
    """Test professional activity report"""

    def test_professional_activity_report_success(self, client, admin_auth_headers, sample_professional):
        """Test generating professional activity report"""
        start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        end_date = datetime.now().strftime('%Y-%m-%d')

        response = client.get(
            f'/api/reports/medical/professional/{sample_professional.id}',
            query_string={
                'start_date': start_date,
                'end_date': end_date
            },
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'professional' in data
        assert 'summary' in data
        assert 'by_status' in data
        assert 'by_type' in data

    def test_professional_activity_report_missing_dates(self, client, admin_auth_headers, sample_professional):
        """Test professional activity without dates"""
        response = client.get(
            f'/api/reports/medical/professional/{sample_professional.id}',
            headers=admin_auth_headers
        )

        assert response.status_code == 400

    def test_professional_activity_report_not_found(self, client, admin_auth_headers):
        """Test professional activity for non-existent professional"""
        start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        end_date = datetime.now().strftime('%Y-%m-%d')

        response = client.get(
            '/api/reports/medical/professional/99999',
            query_string={
                'start_date': start_date,
                'end_date': end_date
            },
            headers=admin_auth_headers
        )

        assert response.status_code == 404


class TestRevenueReport:
    """Test revenue report"""

    def test_revenue_report_success(self, client, admin_auth_headers):
        """Test generating revenue report"""
        start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        end_date = datetime.now().strftime('%Y-%m-%d')

        response = client.get(
            '/api/reports/financial/revenue',
            query_string={
                'start_date': start_date,
                'end_date': end_date
            },
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'summary' in data
        assert 'by_payment_method' in data
        assert 'daily_revenue' in data
        assert 'total_revenue' in data['summary']

    def test_revenue_report_with_professional_filter(self, client, admin_auth_headers, sample_professional):
        """Test revenue report filtered by professional"""
        start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        end_date = datetime.now().strftime('%Y-%m-%d')

        response = client.get(
            '/api/reports/financial/revenue',
            query_string={
                'start_date': start_date,
                'end_date': end_date,
                'professional_id': sample_professional.id
            },
            headers=admin_auth_headers
        )

        assert response.status_code == 200

    def test_revenue_report_csv_export(self, client, admin_auth_headers):
        """Test CSV export of revenue report"""
        start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        end_date = datetime.now().strftime('%Y-%m-%d')

        response = client.get(
            '/api/reports/financial/revenue',
            query_string={
                'start_date': start_date,
                'end_date': end_date,
                'format': 'csv'
            },
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        assert response.mimetype == 'text/csv'

    def test_revenue_report_missing_dates(self, client, admin_auth_headers):
        """Test revenue report without dates"""
        response = client.get(
            '/api/reports/financial/revenue',
            headers=admin_auth_headers
        )

        assert response.status_code == 400

    def test_revenue_report_unauthorized(self, client, auth_headers):
        """Test revenue report without admin permissions"""
        start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        end_date = datetime.now().strftime('%Y-%m-%d')

        response = client.get(
            '/api/reports/financial/revenue',
            query_string={
                'start_date': start_date,
                'end_date': end_date
            },
            headers=auth_headers
        )

        assert response.status_code == 403


class TestBudgetReport:
    """Test budget report"""

    def test_budget_report_success(self, client, admin_auth_headers):
        """Test generating budget report"""
        start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        end_date = datetime.now().strftime('%Y-%m-%d')

        response = client.get(
            '/api/reports/financial/budgets',
            query_string={
                'start_date': start_date,
                'end_date': end_date
            },
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'summary' in data
        assert 'by_status' in data
        assert 'budgets' in data

    def test_budget_report_with_status_filter(self, client, admin_auth_headers):
        """Test budget report with status filter"""
        start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        end_date = datetime.now().strftime('%Y-%m-%d')

        response = client.get(
            '/api/reports/financial/budgets',
            query_string={
                'start_date': start_date,
                'end_date': end_date,
                'status': 'accepted'
            },
            headers=admin_auth_headers
        )

        assert response.status_code == 200

    def test_budget_report_missing_dates(self, client, admin_auth_headers):
        """Test budget report without dates"""
        response = client.get(
            '/api/reports/financial/budgets',
            headers=admin_auth_headers
        )

        assert response.status_code == 400


class TestAppointmentReport:
    """Test appointment report"""

    def test_appointment_report_success(self, client, admin_user):
        """Test generating appointment report"""
        with client.application.app_context():
            token = create_access_token(identity=str(admin_user.id))

        start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        end_date = datetime.now().strftime('%Y-%m-%d')

        response = client.get(
            '/api/reports/appointments',
            query_string={
                'start_date': start_date,
                'end_date': end_date
            },
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'summary' in data
        assert 'by_status' in data
        assert 'by_type' in data
        assert 'by_weekday' in data
        assert 'daily_breakdown' in data

    def test_appointment_report_with_professional_filter(self, client, admin_user, sample_professional):
        """Test appointment report filtered by professional"""
        with client.application.app_context():
            token = create_access_token(identity=str(admin_user.id))

        start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        end_date = datetime.now().strftime('%Y-%m-%d')

        response = client.get(
            '/api/reports/appointments',
            query_string={
                'start_date': start_date,
                'end_date': end_date,
                'professional_id': sample_professional.id
            },
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response.status_code == 200

    def test_appointment_report_with_patient_filter(self, client, admin_user, sample_patient):
        """Test appointment report filtered by patient"""
        with client.application.app_context():
            token = create_access_token(identity=str(admin_user.id))

        start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        end_date = datetime.now().strftime('%Y-%m-%d')

        response = client.get(
            '/api/reports/appointments',
            query_string={
                'start_date': start_date,
                'end_date': end_date,
                'patient_id': sample_patient.id
            },
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response.status_code == 200

    def test_appointment_report_csv_export(self, client, admin_user):
        """Test CSV export of appointment report"""
        with client.application.app_context():
            token = create_access_token(identity=str(admin_user.id))

        start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        end_date = datetime.now().strftime('%Y-%m-%d')

        response = client.get(
            '/api/reports/appointments',
            query_string={
                'start_date': start_date,
                'end_date': end_date,
                'format': 'csv'
            },
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response.status_code == 200
        assert response.mimetype == 'text/csv'

    def test_appointment_report_missing_dates(self, client, admin_user):
        """Test appointment report without dates"""
        with client.application.app_context():
            token = create_access_token(identity=str(admin_user.id))

        response = client.get(
            '/api/reports/appointments',
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response.status_code == 400

    def test_appointment_report_frontend_contract(self, client, admin_user):
        """Test appointment report includes frontend-compatible fields."""
        with client.application.app_context():
            token = create_access_token(identity=str(admin_user.id))

        start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        end_date = datetime.now().strftime('%Y-%m-%d')

        response = client.get(
            '/api/reports/appointments',
            query_string={
                'start_date': start_date,
                'end_date': end_date
            },
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'total_appointments' in data
        assert 'by_status' in data
        assert isinstance(data['by_status'], list)
        assert 'by_professional' in data
        assert 'cancellation_rate' in data
        assert 'no_show_rate' in data
        assert 'period' in data


class TestQuickReports:
    """Test quick/predefined reports"""

    def test_monthly_summary_success(self, client, admin_auth_headers):
        """Test monthly summary report"""
        response = client.get(
            '/api/reports/quick/monthly',
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'period' in data
        assert 'appointments' in data
        assert 'revenue' in data
        assert 'budgets' in data

    def test_monthly_summary_specific_month(self, client, admin_auth_headers):
        """Test monthly summary for specific month"""
        response = client.get(
            '/api/reports/quick/monthly',
            query_string={
                'month': 1,
                'year': 2024
            },
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data['period']['month'] == 1
        assert data['period']['year'] == 2024

    def test_monthly_summary_unauthorized(self, client, auth_headers):
        """Test monthly summary without admin permissions"""
        response = client.get(
            '/api/reports/quick/monthly',
            headers=auth_headers
        )

        assert response.status_code == 403

    def test_weekly_summary_success(self, client, admin_user):
        """Test weekly summary report"""
        with client.application.app_context():
            token = create_access_token(identity=str(admin_user.id))

        response = client.get(
            '/api/reports/quick/weekly',
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'period' in data
        assert 'appointments' in data
        assert 'by_status' in data
        assert 'by_weekday' in data
        assert data['period']['days'] == 7


class TestFrontendReportContracts:
    """Contract tests for frontend report endpoints."""

    def test_medical_summary_contract(self, client, auth_headers):
        start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        end_date = datetime.now().strftime('%Y-%m-%d')

        response = client.get(
            '/api/reports/medical',
            query_string={'start_date': start_date, 'end_date': end_date},
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'total_records' in data
        assert 'by_professional' in data
        assert 'by_specialty' in data
        assert 'period' in data

    def test_financial_summary_contract(self, client, auth_headers):
        start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        end_date = datetime.now().strftime('%Y-%m-%d')

        response = client.get(
            '/api/reports/financial',
            query_string={'start_date': start_date, 'end_date': end_date},
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'total_revenue' in data
        assert 'total_pending' in data
        assert 'currency' in data
        assert 'by_payment_method' in data
        assert 'by_month' in data
        assert 'period' in data

    def test_quick_stats_contract(self, client, auth_headers):
        response = client.get('/api/reports/quick/stats', headers=auth_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert 'today_appointments' in data
        assert 'pending_budgets' in data
        assert 'new_patients_this_month' in data
        assert 'revenue_this_month' in data

    def test_export_contract_accepts_frontend_path(self, client, auth_headers):
        response = client.get(
            '/api/reports/financial/export',
            query_string={'format': 'pdf'},
            headers=auth_headers
        )
        assert response.status_code == 200
        assert response.mimetype == 'text/csv'


class TestReportIntegration:
    """Integration tests for reports"""

    def test_complete_reporting_workflow(self, app, admin_auth_headers, sample_professional, sample_patient):
        """Test complete workflow of generating multiple reports"""
        from app.extensions import db
        from app.models.appointment import Appointment
        from app.models.medical_record import MedicalRecord
        from app.models.payment import Payment
        from app.models.budget import Budget
        from datetime import datetime, timedelta

        client = app.test_client()

        with app.app_context():
            # Create test data
            appointment = Appointment(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                appointment_date=datetime.utcnow() + timedelta(days=1),
                duration_minutes=30,
                status='scheduled',
                appointment_type='consultation'
            )
            db.session.add(appointment)
            db.session.commit()

            medical_record = MedicalRecord(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                diagnosis='Test diagnosis',
                treatment='Test treatment'
            )
            db.session.add(medical_record)
            db.session.commit()

        # Test all report types
        start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        end_date = datetime.now().strftime('%Y-%m-%d')

        # Patient history
        response = client.get(
            f'/api/reports/medical/patient/{sample_patient.id}',
            headers=admin_auth_headers
        )
        assert response.status_code == 200

        # Appointments report
        response = client.get(
            '/api/reports/appointments',
            query_string={'start_date': start_date, 'end_date': end_date},
            headers=admin_auth_headers
        )
        assert response.status_code == 200

        # Revenue report
        response = client.get(
            '/api/reports/financial/revenue',
            query_string={'start_date': start_date, 'end_date': end_date},
            headers=admin_auth_headers
        )
        assert response.status_code == 200

    def test_budgets_payments_reports_end_to_end(
        self,
        client,
        auth_headers,
        patient_auth_headers,
        admin_auth_headers,
        sample_patient
    ):
        """Test chained flow: budget lifecycle + payment processing + financial reports."""
        budget_response = client.post(
            '/api/budgets',
            json={
                'patient_id': sample_patient.id,
                'title': 'Budget Payment Report E2E',
                'description': 'End-to-end financial flow',
                'total_amount': 4500.00
            },
            headers=auth_headers
        )
        assert budget_response.status_code == 201
        budget_data = budget_response.get_json()
        budget_id = budget_data['id']
        assert budget_data['status'] == 'draft'

        send_budget_response = client.post(
            f'/api/budgets/{budget_id}/send',
            headers=auth_headers
        )
        assert send_budget_response.status_code == 200
        assert send_budget_response.get_json()['status'] == 'sent'

        accept_budget_response = client.post(
            f'/api/budgets/{budget_id}/accept',
            headers=patient_auth_headers
        )
        assert accept_budget_response.status_code == 200
        assert accept_budget_response.get_json()['status'] == 'accepted'

        payment_response = client.post(
            '/api/payments',
            json={
                'budget_id': budget_id,
                'amount': 4500.00,
                'payment_method': 'transfer',
                'notes': 'E2E payment for accepted budget'
            },
            headers=auth_headers
        )
        assert payment_response.status_code == 201
        payment_data = payment_response.get_json()
        payment_id = payment_data['id']
        assert payment_data['payment_status'] == 'pending'

        process_payment_response = client.post(
            f'/api/payments/{payment_id}/process',
            json={'transaction_reference': 'E2E-TRX-001'},
            headers=auth_headers
        )
        assert process_payment_response.status_code == 200
        processed_payment = process_payment_response.get_json()
        assert processed_payment['payment_status'] == 'completed'
        assert processed_payment['transaction_reference'] == 'E2E-TRX-001'

        budget_detail_response = client.get(f'/api/budgets/{budget_id}', headers=auth_headers)
        assert budget_detail_response.status_code == 200
        assert budget_detail_response.get_json()['status'] == 'accepted'

        payment_detail_response = client.get(f'/api/payments/{payment_id}', headers=auth_headers)
        assert payment_detail_response.status_code == 200
        assert payment_detail_response.get_json()['payment_status'] == 'completed'

        start_date = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
        end_date = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')

        revenue_report_response = client.get(
            '/api/reports/financial/revenue',
            query_string={'start_date': start_date, 'end_date': end_date},
            headers=admin_auth_headers
        )
        assert revenue_report_response.status_code == 200
        revenue_report = revenue_report_response.get_json()
        assert revenue_report['summary']['total_transactions'] >= 1
        assert any(payment_row['id'] == payment_id for payment_row in revenue_report['payments'])

        budgets_report_response = client.get(
            '/api/reports/financial/budgets',
            query_string={
                'start_date': start_date,
                'end_date': end_date,
                'status': 'accepted'
            },
            headers=admin_auth_headers
        )
        assert budgets_report_response.status_code == 200
        budgets_report = budgets_report_response.get_json()
        assert any(budget_row['id'] == budget_id for budget_row in budgets_report['budgets'])

        financial_summary_response = client.get(
            '/api/reports/financial',
            query_string={'start_date': start_date, 'end_date': end_date},
            headers=auth_headers
        )
        assert financial_summary_response.status_code == 200
        financial_summary = financial_summary_response.get_json()
        assert financial_summary['total_revenue'] >= 4500.00
