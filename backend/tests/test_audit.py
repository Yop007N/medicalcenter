# -*- coding: utf-8 -*-
"""
Tests for Audit endpoints
"""

import pytest
import json
from datetime import datetime, timedelta
from app.models.audit_log import AuditLog
from app.services.audit_service import audit_service


class TestAuditService:
    """Test audit service functionality"""

    def test_log_action_creates_audit_log(self, app):
        """Test that log_action creates an audit log"""
        with app.app_context():
            from app.extensions import db

            log = audit_service.log_action(
                action='TEST_ACTION',
                entity_type='test_entity',
                entity_id=1,
                description='Test action description',
                metadata={'key': 'value'}
            )

            assert log is not None
            assert log.action == 'TEST_ACTION'
            assert log.entity_type == 'test_entity'
            assert log.entity_id == 1
            assert log.description == 'Test action description'
            assert log.extra_data == {'key': 'value'}

    def test_log_create(self, app):
        """Test log_create helper"""
        with app.app_context():
            log = audit_service.log_create(
                entity_type='patient',
                entity_id=123,
                description='Created patient'
            )

            assert log.action == 'CREATE'
            assert log.entity_type == 'patient'
            assert log.entity_id == 123
            assert log.status_code == 201

    def test_log_read(self, app):
        """Test log_read helper"""
        with app.app_context():
            log = audit_service.log_read(
                entity_type='medical_record',
                entity_id=456
            )

            assert log.action == 'READ'
            assert log.entity_type == 'medical_record'
            assert log.entity_id == 456
            assert log.sensitive_data_access is True  # medical_record is sensitive

    def test_log_update(self, app):
        """Test log_update helper"""
        with app.app_context():
            changes = {
                'before': {'name': 'Old Name'},
                'after': {'name': 'New Name'}
            }

            log = audit_service.log_update(
                entity_type='patient',
                entity_id=789,
                changes=changes
            )

            assert log.action == 'UPDATE'
            assert log.changes == changes
            assert log.entity_id == 789

    def test_log_delete(self, app):
        """Test log_delete helper"""
        with app.app_context():
            log = audit_service.log_delete(
                entity_type='appointment',
                entity_id=111
            )

            assert log.action == 'DELETE'
            assert log.entity_type == 'appointment'
            assert log.entity_id == 111

    def test_log_export_marks_as_export(self, app):
        """Test log_export marks record as export"""
        with app.app_context():
            log = audit_service.log_export(
                entity_type='patient',
                record_count=100
            )

            assert log.action == 'EXPORT'
            assert log.export_action is True
            assert log.extra_data['record_count'] == 100

    def test_sensitive_data_tracking(self, app):
        """Test sensitive data access tracking"""
        with app.app_context():
            # Medical record should be marked sensitive
            log1 = audit_service.log_read(entity_type='medical_record', entity_id=1)
            assert log1.sensitive_data_access is True

            # Regular data should not be marked sensitive
            log2 = audit_service.log_read(entity_type='appointment', entity_id=1)
            assert log2.sensitive_data_access is False


class TestListAuditLogs:
    """Test listing audit logs"""

    def test_list_audit_logs_success(self, client, admin_auth_headers, app):
        """Test listing audit logs as admin"""
        # Create some audit logs
        with app.app_context():
            from app.extensions import db
            for i in range(5):
                log = AuditLog(
                    action=f'TEST_ACTION_{i}',
                    user_email='test@test.com',
                    user_role='admin',
                    timestamp=datetime.utcnow(),
                    success=True
                )
                db.session.add(log)
            db.session.commit()

        response = client.get('/api/audit/logs', headers=admin_auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'logs' in data
        assert isinstance(data['logs'], list)
        assert len(data['logs']) >= 5

    def test_list_audit_logs_with_filters(self, client, admin_auth_headers, app):
        """Test filtering audit logs"""
        with app.app_context():
            from app.extensions import db
            # Create logs with different actions
            log1 = AuditLog(
                action='CREATE',
                entity_type='patient',
                user_email='admin@test.com',
                user_role='admin',
                timestamp=datetime.utcnow(),
                success=True
            )
            log2 = AuditLog(
                action='DELETE',
                entity_type='patient',
                user_email='admin@test.com',
                user_role='admin',
                timestamp=datetime.utcnow(),
                success=True
            )
            db.session.add(log1)
            db.session.add(log2)
            db.session.commit()

        # Filter by action
        response = client.get('/api/audit/logs?action=CREATE', headers=admin_auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)
        for log in data['logs']:
            assert log['action'] == 'CREATE'

    def test_list_audit_logs_unauthorized(self, client, auth_headers):
        """Test that non-admin cannot access audit logs"""
        response = client.get('/api/audit/logs', headers=auth_headers)
        assert response.status_code == 403

    def test_list_audit_logs_without_auth(self, client):
        """Test listing audit logs without authentication"""
        response = client.get('/api/audit/logs')
        assert response.status_code == 401


class TestGetAuditLog:
    """Test getting single audit log"""

    def test_get_audit_log_success(self, client, admin_auth_headers, app):
        """Test getting specific audit log"""
        with app.app_context():
            from app.extensions import db
            log = AuditLog(
                action='TEST',
                user_email='test@test.com',
                user_role='admin',
                description='Test log',
                timestamp=datetime.utcnow(),
                success=True
            )
            db.session.add(log)
            db.session.commit()
            log_id = log.id

        response = client.get(f'/api/audit/logs/{log_id}', headers=admin_auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['id'] == log_id
        assert data['action'] == 'TEST'
        assert data['description'] == 'Test log'

    def test_get_audit_log_not_found(self, client, admin_auth_headers):
        """Test getting non-existent audit log"""
        response = client.get('/api/audit/logs/99999', headers=admin_auth_headers)
        assert response.status_code == 404

    def test_get_audit_log_unauthorized(self, client, auth_headers):
        """Test that non-admin cannot get specific audit log"""
        response = client.get('/api/audit/logs/1', headers=auth_headers)
        assert response.status_code == 403


class TestEntityHistory:
    """Test entity history endpoint"""

    def test_get_entity_history(self, client, admin_auth_headers, sample_patient, app):
        """Test getting audit history for specific entity"""
        with app.app_context():
            from app.extensions import db
            # Create multiple logs for same entity
            for action in ['CREATE', 'UPDATE', 'READ']:
                log = AuditLog(
                    action=action,
                    entity_type='patient',
                    entity_id=sample_patient.id,
                    user_email='admin@test.com',
                    user_role='admin',
                    timestamp=datetime.utcnow(),
                    success=True
                )
                db.session.add(log)
            db.session.commit()

        response = client.get(
            f'/api/audit/entity/patient/{sample_patient.id}/history',
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert isinstance(data, list)
        assert len(data) >= 3
        # All should be for the same entity
        for log in data:
            assert log['entity_type'] == 'patient'
            assert log['entity_id'] == sample_patient.id

    def test_get_entity_history_unauthorized(self, client, auth_headers):
        """Test that non-admin cannot get entity history"""
        response = client.get('/api/audit/entity/patient/1/history', headers=auth_headers)
        assert response.status_code == 403


class TestUserActivity:
    """Test user activity endpoint"""

    def test_get_user_activity(self, client, admin_auth_headers, admin_user, app):
        """Test getting user activity"""
        with app.app_context():
            from app.extensions import db
            # Create logs for user
            for i in range(3):
                log = AuditLog(
                    action=f'ACTION_{i}',
                    user_id=admin_user.id,
                    user_email=admin_user.email,
                    user_role='admin',
                    timestamp=datetime.utcnow(),
                    success=True
                )
                db.session.add(log)
            db.session.commit()

        response = client.get(
            f'/api/audit/user/{admin_user.id}/activity',
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert isinstance(data, list)
        assert len(data) >= 3

    def test_get_user_activity_with_days_filter(self, client, admin_auth_headers, admin_user):
        """Test filtering user activity by days"""
        response = client.get(
            f'/api/audit/user/{admin_user.id}/activity?days=7',
            headers=admin_auth_headers
        )

        assert response.status_code == 200

    def test_get_user_activity_unauthorized(self, client, auth_headers):
        """Test that non-admin cannot get user activity"""
        response = client.get('/api/audit/user/1/activity', headers=auth_headers)
        assert response.status_code == 403


class TestComplianceReport:
    """Test compliance report generation"""

    def test_get_compliance_report_success(self, client, admin_auth_headers, app):
        """Test generating compliance report"""
        with app.app_context():
            from app.extensions import db
            # Create variety of logs
            now = datetime.utcnow()
            logs_data = [
                {'action': 'CREATE', 'entity_type': 'patient', 'sensitive': True},
                {'action': 'READ', 'entity_type': 'medical_record', 'sensitive': True},
                {'action': 'EXPORT', 'entity_type': 'patient', 'sensitive': True, 'export': True},
                {'action': 'UNAUTHORIZED_ACCESS', 'success': False},
            ]

            for log_data in logs_data:
                log = AuditLog(
                    action=log_data['action'],
                    entity_type=log_data.get('entity_type'),
                    user_email='test@test.com',
                    user_role='admin',
                    timestamp=now,
                    success=log_data.get('success', True),
                    sensitive_data_access=log_data.get('sensitive', False),
                    export_action=log_data.get('export', False)
                )
                db.session.add(log)
            db.session.commit()

        start_date = (now - timedelta(days=1)).strftime('%Y-%m-%d')
        end_date = (now + timedelta(days=1)).strftime('%Y-%m-%d')

        response = client.get(
            f'/api/audit/compliance/report?start_date={start_date}&end_date={end_date}',
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'total_actions' in data
        assert 'by_action' in data
        assert 'sensitive_data_accesses' in data
        assert 'export_actions' in data
        assert 'failed_actions' in data
        assert 'unauthorized_attempts' in data

        # Verify counts
        assert data['total_actions'] >= 4
        assert data['sensitive_data_accesses'] >= 3
        assert data['export_actions'] >= 1
        assert data['failed_actions'] >= 1
        assert data['unauthorized_attempts'] >= 1

    def test_get_compliance_report_missing_dates(self, client, admin_auth_headers):
        """Test compliance report without dates"""
        response = client.get('/api/audit/compliance/report', headers=admin_auth_headers)
        assert response.status_code == 400

    def test_get_compliance_report_invalid_dates(self, client, admin_auth_headers):
        """Test compliance report with invalid dates"""
        response = client.get(
            '/api/audit/compliance/report?start_date=invalid&end_date=invalid',
            headers=admin_auth_headers
        )
        assert response.status_code == 400

    def test_get_compliance_report_unauthorized(self, client, auth_headers):
        """Test that non-admin cannot generate compliance report"""
        now = datetime.utcnow()
        start_date = (now - timedelta(days=1)).strftime('%Y-%m-%d')
        end_date = now.strftime('%Y-%m-%d')

        response = client.get(
            f'/api/audit/compliance/report?start_date={start_date}&end_date={end_date}',
            headers=auth_headers
        )
        assert response.status_code == 403


class TestCleanupOldLogs:
    """Test cleanup of old audit logs"""

    def test_cleanup_old_logs_success(self, client, admin_auth_headers, app):
        """Test cleaning up old audit logs"""
        with app.app_context():
            from app.extensions import db
            # Create old log (over 2 years ago)
            old_log = AuditLog(
                action='OLD_ACTION',
                user_email='test@test.com',
                user_role='admin',
                timestamp=datetime.utcnow() - timedelta(days=800),
                success=True
            )
            db.session.add(old_log)
            db.session.commit()

        # Cleanup logs older than 365 days
        response = client.post('/api/audit/cleanup?days=365', headers=admin_auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'deleted_count' in data
        assert data['deleted_count'] >= 1

    def test_cleanup_enforces_minimum_retention(self, client, admin_auth_headers):
        """Test that cleanup enforces minimum 365 days retention"""
        response = client.post('/api/audit/cleanup?days=30', headers=admin_auth_headers)
        assert response.status_code == 400

    def test_cleanup_unauthorized(self, client, auth_headers):
        """Test that non-admin cannot cleanup logs"""
        response = client.post('/api/audit/cleanup', headers=auth_headers)
        assert response.status_code == 403


class TestAuditIntegration:
    """Integration tests for audit system"""

    def test_complete_audit_workflow(self, client, admin_auth_headers, sample_patient, app):
        """Test complete audit workflow"""
        with app.app_context():
            # 1. Create an action
            log = audit_service.log_create(
                entity_type='patient',
                entity_id=sample_patient.id,
                description='Created patient record'
            )
            assert log is not None

            # 2. List logs
            list_response = client.get('/api/audit/logs', headers=admin_auth_headers)
            assert list_response.status_code == 200
            logs_data = json.loads(list_response.data)
            assert len(logs_data['logs']) > 0

            # 3. Get entity history
            history_response = client.get(
                f'/api/audit/entity/patient/{sample_patient.id}/history',
                headers=admin_auth_headers
            )
            assert history_response.status_code == 200
            history = json.loads(history_response.data)
            assert len(history) > 0

            # 4. Generate compliance report
            start_date = (datetime.utcnow() - timedelta(days=1)).strftime('%Y-%m-%d')
            end_date = (datetime.utcnow() + timedelta(days=1)).strftime('%Y-%m-%d')
            report_response = client.get(
                f'/api/audit/compliance/report?start_date={start_date}&end_date={end_date}',
                headers=admin_auth_headers
            )
            assert report_response.status_code == 200
            report = json.loads(report_response.data)
            assert report['total_actions'] > 0

    def test_audit_logs_access_control(self, client, auth_headers, patient_auth_headers, admin_auth_headers):
        """Test that only admins can access audit logs"""
        # Professional (non-admin)
        response1 = client.get('/api/audit/logs', headers=auth_headers)
        assert response1.status_code == 403

        # Patient (non-admin)
        response2 = client.get('/api/audit/logs', headers=patient_auth_headers)
        assert response2.status_code == 403

        # Admin (should succeed)
        response3 = client.get('/api/audit/logs', headers=admin_auth_headers)
        assert response3.status_code == 200
