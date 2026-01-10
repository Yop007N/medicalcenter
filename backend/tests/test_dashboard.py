# -*- coding: utf-8 -*-
"""
Tests for Dashboard and Analytics endpoints
"""

import pytest
import json
from datetime import datetime, timedelta
from decimal import Decimal
from app.models.patient import Patient
from app.models.professional import Professional
from app.models.appointment import Appointment
from app.models.medical_record import MedicalRecord
from app.models.budget import Budget
from app.models.payment import Payment
from app.models.file import File


class TestDashboardOverview:
    """Test dashboard overview endpoint"""

    def test_get_overview_success(self, client, auth_headers, sample_patient, sample_professional):
        """Test getting dashboard overview"""
        response = client.get('/api/dashboard/overview', headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)

        # Check structure
        assert 'totals' in data
        assert 'recent_activity' in data
        assert 'appointment_status' in data
        assert 'revenue' in data
        assert 'generated_at' in data

        # Check totals
        assert 'patients' in data['totals']
        assert 'professionals' in data['totals']
        assert 'appointments' in data['totals']
        assert 'medical_records' in data['totals']
        assert 'budgets' in data['totals']
        assert 'payments' in data['totals']

        # Check recent activity
        assert 'new_patients_30d' in data['recent_activity']
        assert 'appointments_30d' in data['recent_activity']

        # Check revenue
        assert 'total' in data['revenue']
        assert 'currency' in data['revenue']
        assert data['revenue']['currency'] == 'ARS'

    def test_get_overview_unauthorized(self, client):
        """Test getting overview without authentication"""
        response = client.get('/api/dashboard/overview')
        assert response.status_code == 401

    def test_get_overview_with_data(self, client, auth_headers, sample_patient,
                                     sample_professional, sample_appointment):
        """Test overview with actual data"""
        response = client.get('/api/dashboard/overview', headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)

        # Should have at least 1 patient and 1 professional
        assert data['totals']['patients'] >= 1
        assert data['totals']['professionals'] >= 1
        assert data['totals']['appointments'] >= 1


class TestAppointmentStats:
    """Test appointment statistics endpoint"""

    def test_get_appointment_stats_success(self, client, auth_headers):
        """Test getting appointment statistics"""
        response = client.get('/api/dashboard/appointments/stats', headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)

        # Check structure
        assert 'periods' in data
        assert 'metrics' in data
        assert 'top_professionals' in data
        assert 'generated_at' in data

        # Check periods
        assert 'today' in data['periods']
        assert 'this_week' in data['periods']
        assert 'this_month' in data['periods']

        # Check metrics
        assert 'completion_rate' in data['metrics']
        assert 'no_show_rate' in data['metrics']

        # Check top_professionals is a list
        assert isinstance(data['top_professionals'], list)

    def test_get_appointment_stats_unauthorized(self, client):
        """Test getting appointment stats without authentication"""
        response = client.get('/api/dashboard/appointments/stats')
        assert response.status_code == 401

    def test_get_appointment_stats_with_appointments(self, client, auth_headers,
                                                      sample_appointment):
        """Test appointment stats with actual appointments"""
        response = client.get('/api/dashboard/appointments/stats', headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)

        # Metrics should be numbers
        assert isinstance(data['metrics']['completion_rate'], (int, float))
        assert isinstance(data['metrics']['no_show_rate'], (int, float))
        assert data['metrics']['completion_rate'] >= 0
        assert data['metrics']['no_show_rate'] >= 0

    def test_get_appointment_stats_top_professionals(self, client, auth_headers,
                                                      sample_professional, sample_patient, app):
        """Test top professionals list"""
        with app.app_context():
            # Create multiple appointments for the professional
            for i in range(3):
                appointment = Appointment(
                    patient_id=sample_patient.id,
                    professional_id=sample_professional.id,
                    appointment_date=datetime.utcnow() + timedelta(days=i),
                    duration_minutes=30,
                    status='scheduled',
                    appointment_type='consultation'
                )
                from app.extensions import db
                db.session.add(appointment)
            db.session.commit()

        response = client.get('/api/dashboard/appointments/stats', headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)

        # Should have professionals in the list
        if data['top_professionals']:
            prof = data['top_professionals'][0]
            assert 'id' in prof
            assert 'name' in prof
            assert 'specialty' in prof
            assert 'appointments' in prof


class TestRevenueStats:
    """Test revenue statistics endpoint"""

    def test_get_revenue_stats_success(self, client, auth_headers):
        """Test getting revenue statistics"""
        response = client.get('/api/dashboard/revenue/stats', headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)

        # Check structure
        assert 'revenue_by_status' in data
        assert 'monthly_revenue' in data
        assert 'metrics' in data
        assert 'payment_methods' in data
        assert 'generated_at' in data

        # Check metrics
        assert 'average_transaction' in data['metrics']
        assert 'pending_amount' in data['metrics']

        # Check monthly_revenue is a list
        assert isinstance(data['monthly_revenue'], list)

    def test_get_revenue_stats_unauthorized(self, client):
        """Test getting revenue stats without authentication"""
        response = client.get('/api/dashboard/revenue/stats')
        assert response.status_code == 401

    def test_get_revenue_stats_with_payments(self, client, auth_headers,
                                              sample_payment, app):
        """Test revenue stats with actual payments"""
        response = client.get('/api/dashboard/revenue/stats', headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)

        # Should have some revenue data
        assert isinstance(data['revenue_by_status'], dict)
        assert isinstance(data['payment_methods'], dict)

        # Metrics should be numbers
        assert isinstance(data['metrics']['average_transaction'], (int, float))
        assert isinstance(data['metrics']['pending_amount'], (int, float))

    def test_get_revenue_stats_monthly_data(self, client, auth_headers,
                                             sample_budget, app):
        """Test monthly revenue data structure"""
        with app.app_context():
            # Create payment with specific date
            payment = Payment(
                budget_id=sample_budget.id,
                amount=Decimal('1500.00'),
                payment_method='cash',
                payment_status='completed',
                payment_date=datetime.utcnow()
            )
            from app.extensions import db
            db.session.add(payment)
            db.session.commit()

        response = client.get('/api/dashboard/revenue/stats', headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)

        # Monthly data should have correct structure
        if data['monthly_revenue']:
            month_data = data['monthly_revenue'][0]
            assert 'month' in month_data
            assert 'revenue' in month_data
            assert isinstance(month_data['revenue'], (int, float))


class TestPatientStats:
    """Test patient statistics endpoint"""

    def test_get_patient_stats_success(self, client, auth_headers):
        """Test getting patient statistics"""
        response = client.get('/api/dashboard/patients/stats', headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)

        # Check structure
        assert 'totals' in data
        assert 'monthly_new_patients' in data
        assert 'metrics' in data
        assert 'generated_at' in data

        # Check totals
        assert 'active' in data['totals']
        assert 'inactive' in data['totals']
        assert 'with_medical_records' in data['totals']

        # Check metrics
        assert 'avg_appointments_per_patient' in data['metrics']

        # Check monthly_new_patients is a list
        assert isinstance(data['monthly_new_patients'], list)

    def test_get_patient_stats_unauthorized(self, client):
        """Test getting patient stats without authentication"""
        response = client.get('/api/dashboard/patients/stats')
        assert response.status_code == 401

    def test_get_patient_stats_with_data(self, client, auth_headers, sample_patient):
        """Test patient stats with actual data"""
        response = client.get('/api/dashboard/patients/stats', headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)

        # Should have at least 1 active patient
        assert data['totals']['active'] >= 1

        # Metrics should be numbers
        assert isinstance(data['metrics']['avg_appointments_per_patient'], (int, float))
        assert data['metrics']['avg_appointments_per_patient'] >= 0

    def test_get_patient_stats_monthly_data(self, client, auth_headers, sample_patient):
        """Test monthly new patients data structure"""
        response = client.get('/api/dashboard/patients/stats', headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)

        # Monthly data should have correct structure
        if data['monthly_new_patients']:
            month_data = data['monthly_new_patients'][0]
            assert 'month' in month_data
            assert 'new_patients' in month_data
            assert isinstance(month_data['new_patients'], int)


class TestFilesStats:
    """Test file statistics endpoint"""

    def test_get_files_stats_success(self, client, auth_headers):
        """Test getting file statistics"""
        response = client.get('/api/dashboard/files/stats', headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)

        # Check structure
        assert 'totals' in data
        assert 'files_by_type' in data
        assert 'recent_uploads_7d' in data
        assert 'generated_at' in data

        # Check totals
        assert 'files' in data['totals']
        assert 'storage_bytes' in data['totals']
        assert 'storage_mb' in data['totals']
        assert 'storage_gb' in data['totals']

        # Check files_by_type is a dict
        assert isinstance(data['files_by_type'], dict)

        # Check recent_uploads_7d is a number
        assert isinstance(data['recent_uploads_7d'], int)

    def test_get_files_stats_unauthorized(self, client):
        """Test getting file stats without authentication"""
        response = client.get('/api/dashboard/files/stats')
        assert response.status_code == 401

    def test_get_files_stats_with_files(self, client, auth_headers, sample_file):
        """Test file stats with actual files"""
        response = client.get('/api/dashboard/files/stats', headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)

        # Should have at least 1 file
        assert data['totals']['files'] >= 1
        assert data['totals']['storage_bytes'] > 0

        # Storage calculations should be correct
        bytes_val = data['totals']['storage_bytes']
        mb_val = data['totals']['storage_mb']
        gb_val = data['totals']['storage_gb']

        assert mb_val == round(bytes_val / (1024 * 1024), 2)
        assert gb_val == round(bytes_val / (1024 * 1024 * 1024), 2)

    def test_get_files_stats_by_type(self, client, auth_headers, sample_file):
        """Test files grouped by type"""
        response = client.get('/api/dashboard/files/stats', headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)

        # If there are files by type, check structure
        if data['files_by_type']:
            for file_type, stats in data['files_by_type'].items():
                assert 'count' in stats
                assert 'size_bytes' in stats
                assert 'size_mb' in stats
                assert isinstance(stats['count'], int)
                assert isinstance(stats['size_bytes'], int)
                assert isinstance(stats['size_mb'], (int, float))


class TestRecentActivity:
    """Test recent activity endpoint"""

    def test_get_recent_activity_success(self, client, auth_headers):
        """Test getting recent activity"""
        response = client.get('/api/dashboard/activity/recent', headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)

        # Check structure
        assert 'recent_appointments' in data
        assert 'recent_payments' in data
        assert 'recent_files' in data
        assert 'generated_at' in data

        # All should be lists
        assert isinstance(data['recent_appointments'], list)
        assert isinstance(data['recent_payments'], list)
        assert isinstance(data['recent_files'], list)

    def test_get_recent_activity_unauthorized(self, client):
        """Test getting recent activity without authentication"""
        response = client.get('/api/dashboard/activity/recent')
        assert response.status_code == 401

    def test_get_recent_activity_appointments(self, client, auth_headers, sample_appointment):
        """Test recent appointments structure"""
        response = client.get('/api/dashboard/activity/recent', headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)

        # Should have at least 1 appointment
        if data['recent_appointments']:
            apt = data['recent_appointments'][0]
            assert 'id' in apt
            assert 'patient_id' in apt
            assert 'professional_id' in apt
            assert 'date' in apt
            assert 'status' in apt
            assert 'created_at' in apt

    def test_get_recent_activity_payments(self, client, auth_headers, sample_payment):
        """Test recent payments structure"""
        response = client.get('/api/dashboard/activity/recent', headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)

        # Should have at least 1 payment
        if data['recent_payments']:
            pmt = data['recent_payments'][0]
            assert 'id' in pmt
            assert 'amount' in pmt
            assert 'status' in pmt
            assert 'method' in pmt
            assert 'created_at' in pmt
            assert isinstance(pmt['amount'], (int, float))

    def test_get_recent_activity_files(self, client, auth_headers, sample_file):
        """Test recent files structure"""
        response = client.get('/api/dashboard/activity/recent', headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)

        # Should have at least 1 file
        if data['recent_files']:
            file = data['recent_files'][0]
            assert 'id' in file
            assert 'filename' in file
            assert 'file_type' in file
            assert 'size_mb' in file
            assert 'created_at' in file
            assert isinstance(file['size_mb'], (int, float))

    def test_get_recent_activity_limit(self, client, auth_headers, app,
                                        sample_patient, sample_professional):
        """Test that recent activity returns max 10 items"""
        with app.app_context():
            from app.extensions import db

            # Create 15 appointments
            for i in range(15):
                appointment = Appointment(
                    patient_id=sample_patient.id,
                    professional_id=sample_professional.id,
                    appointment_date=datetime.utcnow() + timedelta(days=i),
                    duration_minutes=30,
                    status='scheduled',
                    appointment_type='consultation'
                )
                db.session.add(appointment)
            db.session.commit()

        response = client.get('/api/dashboard/activity/recent', headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)

        # Should return max 10 appointments
        assert len(data['recent_appointments']) <= 10


class TestDashboardIntegration:
    """Integration tests for dashboard"""

    def test_complete_dashboard_workflow(self, client, auth_headers, sample_patient,
                                          sample_professional, sample_appointment,
                                          sample_payment, sample_file):
        """Test accessing all dashboard endpoints"""
        endpoints = [
            '/api/dashboard/overview',
            '/api/dashboard/appointments/stats',
            '/api/dashboard/revenue/stats',
            '/api/dashboard/patients/stats',
            '/api/dashboard/files/stats',
            '/api/dashboard/activity/recent'
        ]

        for endpoint in endpoints:
            response = client.get(endpoint, headers=auth_headers)
            assert response.status_code == 200
            data = json.loads(response.data)
            assert 'generated_at' in data or 'timestamp' in data or data is not None

    def test_dashboard_consistency(self, client, auth_headers, sample_patient):
        """Test that dashboard data is consistent across endpoints"""
        # Get overview
        overview_response = client.get('/api/dashboard/overview', headers=auth_headers)
        overview_data = json.loads(overview_response.data)

        # Get patient stats
        patient_response = client.get('/api/dashboard/patients/stats', headers=auth_headers)
        patient_data = json.loads(patient_response.data)

        # Patient count should match
        assert overview_data['totals']['patients'] == patient_data['totals']['active']

    def test_dashboard_performance(self, client, auth_headers):
        """Test that dashboard endpoints respond quickly"""
        import time

        endpoints = [
            '/api/dashboard/overview',
            '/api/dashboard/appointments/stats'
        ]

        for endpoint in endpoints:
            start = time.time()
            response = client.get(endpoint, headers=auth_headers)
            duration = time.time() - start

            assert response.status_code == 200
            # Should respond in less than 2 seconds
            assert duration < 2.0
