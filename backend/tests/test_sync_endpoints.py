# -*- coding: utf-8 -*-
"""
Tests for sync REST endpoints (/api/sync/*)
"""

from datetime import datetime, timedelta

from app.extensions import db
from app.models.appointment import Appointment
from app.models.budget import Budget
from app.models.payment import Payment
from app.models.sync_log import SyncLog


class TestSyncPushEndpoint:
    """Test POST /api/sync/push endpoint."""

    def test_push_create_appointment_from_local_id(
        self,
        client,
        auth_headers,
        app,
        sample_patient,
        sample_professional
    ):
        payload = {
            'changes': [
                {
                    'entity_type': 'appointment',
                    'entity_id': 'local-apt-1',
                    'operation': 'create',
                    'data': {
                        'patient_id': sample_patient.id,
                        'professional_id': sample_professional.id,
                        'appointment_date': (datetime.utcnow() + timedelta(days=2)).isoformat(),
                        'status': 'scheduled',
                        'duration_minutes': 45,
                        'appointment_type': 'consultation'
                    }
                }
            ]
        }

        response = client.post('/api/sync/push', json=payload, headers=auth_headers)

        assert response.status_code == 200
        data = response.json
        assert len(data['synced']) == 1
        assert data['conflicts'] == []
        server_id = data['synced'][0]['server_id']
        assert isinstance(server_id, int)

        with app.app_context():
            created = Appointment.query.get(server_id)
            assert created is not None
            assert created.patient_id == sample_patient.id
            assert created.professional_id == sample_professional.id
            assert created.duration_minutes == 45

    def test_push_update_budget(self, client, auth_headers, app, sample_budget):
        payload = {
            'changes': [
                {
                    'entity_type': 'budget',
                    'entity_id': sample_budget.id,
                    'operation': 'update',
                    'data': {
                        'title': 'Updated Budget Title',
                        'status': 'accepted',
                        'total_amount': '1500.50'
                    }
                }
            ]
        }

        response = client.post('/api/sync/push', json=payload, headers=auth_headers)

        assert response.status_code == 200
        data = response.json
        assert len(data['synced']) == 1
        assert data['conflicts'] == []

        with app.app_context():
            updated_budget = Budget.query.get(sample_budget.id)
            assert updated_budget.title == 'Updated Budget Title'
            assert updated_budget.status == 'accepted'
            assert str(updated_budget.total_amount) == '1500.50'
            assert updated_budget.sync_version == 2

    def test_push_delete_payment(self, client, auth_headers, app, sample_payment):
        payload = {
            'changes': [
                {
                    'entity_type': 'payment',
                    'entity_id': sample_payment.id,
                    'operation': 'delete',
                    'data': {}
                }
            ]
        }

        response = client.post('/api/sync/push', json=payload, headers=auth_headers)

        assert response.status_code == 200
        data = response.json
        assert len(data['synced']) == 1
        assert data['conflicts'] == []
        with app.app_context():
            assert Payment.query.get(sample_payment.id) is None

    def test_push_unsupported_entity_returns_conflict_and_failed_log(self, client, auth_headers, app):
        payload = {
            'changes': [
                {
                    'entity_type': 'patient',
                    'entity_id': 'local-pat-1',
                    'operation': 'create',
                    'data': {'first_name': 'Unsupported'}
                }
            ]
        }

        response = client.post('/api/sync/push', json=payload, headers=auth_headers)

        assert response.status_code == 200
        data = response.json
        assert data['synced'] == []
        assert len(data['conflicts']) == 1
        assert 'Unsupported entity_type' in data['conflicts'][0]['error']

        with app.app_context():
            log = SyncLog.query.order_by(db.desc(SyncLog.id)).first()
            assert log is not None
            assert log.status == 'failed'
            assert log.direction == 'local_to_cloud'

    def test_push_internal_processing_error_is_sanitized_for_client(self, client, auth_headers, app):
        payload = {
            'changes': [
                {
                    'entity_type': 'appointment',
                    'entity_id': 'local-apt-invalid',
                    'operation': 'create',
                    # Missing required columns (patient_id/professional_id/appointment_date)
                    'data': {'status': 'scheduled'}
                }
            ]
        }

        response = client.post('/api/sync/push', json=payload, headers=auth_headers)

        assert response.status_code == 200
        data = response.json
        assert data['synced'] == []
        assert len(data['conflicts']) == 1
        assert data['conflicts'][0]['error'] == 'Internal sync processing error'

        with app.app_context():
            log = SyncLog.query.order_by(db.desc(SyncLog.id)).first()
            assert log is not None
            assert log.status == 'failed'
            # Internal details are kept for diagnostics in server-side logs
            assert log.error_message is not None
            assert len(log.error_message) > 0

    def test_push_with_invalid_changes_payload_returns_400(self, client, auth_headers):
        response = client.post('/api/sync/push', json={'changes': {}}, headers=auth_headers)
        assert response.status_code == 400
        assert response.json['msg'] == 'changes must be an array'

    def test_push_with_invalid_change_item_adds_conflict(self, client, auth_headers):
        payload = {'changes': ['invalid-item']}
        response = client.post('/api/sync/push', json=payload, headers=auth_headers)

        assert response.status_code == 200
        assert response.json['synced'] == []
        assert len(response.json['conflicts']) == 1
        assert response.json['conflicts'][0]['error'] == 'Invalid change payload'

    def test_push_with_missing_entity_type_adds_conflict(self, client, auth_headers):
        payload = {
            'changes': [
                {
                    'entity_id': 'local-missing-entity',
                    'operation': 'create',
                    'data': {}
                }
            ]
        }

        response = client.post('/api/sync/push', json=payload, headers=auth_headers)

        assert response.status_code == 200
        assert response.json['synced'] == []
        assert len(response.json['conflicts']) == 1
        assert response.json['conflicts'][0]['error'] == 'entity_type is required'

    def test_push_with_non_object_data_adds_conflict(self, client, auth_headers):
        payload = {
            'changes': [
                {
                    'entity_type': 'appointment',
                    'entity_id': 'local-invalid-data',
                    'operation': 'create',
                    'data': 'not-an-object'
                }
            ]
        }

        response = client.post('/api/sync/push', json=payload, headers=auth_headers)

        assert response.status_code == 200
        assert response.json['synced'] == []
        assert len(response.json['conflicts']) == 1
        assert response.json['conflicts'][0]['error'] == 'data must be an object for create/update'

    def test_push_rejects_changes_batch_over_limit(self, client, auth_headers):
        payload = {'changes': [{} for _ in range(501)]}

        response = client.post('/api/sync/push', json=payload, headers=auth_headers)

        assert response.status_code == 400
        assert response.json['msg'] == 'changes exceeds limit (500)'

    def test_push_idempotent_replay_returns_same_server_id(
        self,
        client,
        auth_headers,
        app,
        sample_patient,
        sample_professional
    ):
        payload = {
            'changes': [
                {
                    'entity_type': 'appointment',
                    'entity_id': 'local-apt-idempotent',
                    'operation': 'create',
                    'data': {
                        'patient_id': sample_patient.id,
                        'professional_id': sample_professional.id,
                        'appointment_date': (datetime.utcnow() + timedelta(days=3)).isoformat(),
                        'status': 'scheduled',
                        'duration_minutes': 30
                    }
                }
            ]
        }

        first = client.post('/api/sync/push', json=payload, headers=auth_headers)
        second = client.post('/api/sync/push', json=payload, headers=auth_headers)

        assert first.status_code == 200
        assert second.status_code == 200

        first_server_id = first.json['synced'][0]['server_id']
        second_synced = second.json['synced'][0]
        assert second_synced['server_id'] == first_server_id
        assert second_synced['idempotent'] is True
        assert isinstance(second_synced['sync_version'], int)

        with app.app_context():
            rows = Appointment.query.filter_by(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id
            ).all()
            assert len(rows) == 1

    def test_push_batch_idempotency_returns_two_idempotent_replays(
        self,
        client,
        auth_headers,
        app,
        sample_patient,
        sample_professional
    ):
        payload = {
            'changes': [
                {
                    'entity_type': 'appointment',
                    'entity_id': 'local-batch-1',
                    'operation': 'create',
                    'data': {
                        'patient_id': sample_patient.id,
                        'professional_id': sample_professional.id,
                        'appointment_date': (datetime.utcnow() + timedelta(days=4)).isoformat(),
                        'status': 'scheduled',
                        'duration_minutes': 20
                    }
                },
                {
                    'entity_type': 'appointment',
                    'entity_id': 'local-batch-2',
                    'operation': 'create',
                    'data': {
                        'patient_id': sample_patient.id,
                        'professional_id': sample_professional.id,
                        'appointment_date': (datetime.utcnow() + timedelta(days=5)).isoformat(),
                        'status': 'scheduled',
                        'duration_minutes': 25
                    }
                }
            ]
        }

        first = client.post('/api/sync/push', json=payload, headers=auth_headers)
        second = client.post('/api/sync/push', json=payload, headers=auth_headers)

        assert first.status_code == 200
        assert second.status_code == 200
        assert len(first.json['synced']) == 2
        assert len(second.json['synced']) == 2
        assert all(item.get('idempotent') is True for item in second.json['synced'])

        with app.app_context():
            created = Appointment.query.filter_by(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id
            ).all()
            assert len(created) == 2

    def test_push_update_conflict_returns_server_wins_payload(
        self,
        client,
        auth_headers,
        app,
        sample_appointment
    ):
        payload = {
            'changes': [
                {
                    'entity_type': 'appointment',
                    'entity_id': sample_appointment.id,
                    'operation': 'update',
                    'data': {
                        'status': 'completed',
                        'updated_at': '2000-01-01T00:00:00Z'
                    }
                }
            ]
        }

        response = client.post('/api/sync/push', json=payload, headers=auth_headers)
        assert response.status_code == 200

        data = response.json
        assert data['synced'] == []
        assert len(data['conflicts']) == 1
        conflict = data['conflicts'][0]['conflict']
        assert conflict['conflict'] is True
        assert conflict['resolution'] == 'server_wins'
        assert conflict['strategy'] == 'version_then_timestamp'
        assert 'server_version' in conflict
        assert 'client_version' in conflict

        with app.app_context():
            log = SyncLog.query.order_by(db.desc(SyncLog.id)).first()
            assert log.status == 'failed'
            assert log.conflict_payload['resolution'] == 'server_wins'

    def test_push_multi_entity_conflict_returns_conflicts_for_each_change(
        self,
        client,
        auth_headers,
        sample_appointment,
        sample_budget
    ):
        payload = {
            'changes': [
                {
                    'entity_type': 'appointment',
                    'entity_id': sample_appointment.id,
                    'operation': 'update',
                    'data': {
                        'status': 'completed',
                        'updated_at': '2000-01-01T00:00:00Z'
                    }
                },
                {
                    'entity_type': 'budget',
                    'entity_id': sample_budget.id,
                    'operation': 'update',
                    'data': {
                        'status': 'accepted',
                        'updated_at': '2000-01-01T00:00:00Z'
                    }
                }
            ]
        }

        response = client.post('/api/sync/push', json=payload, headers=auth_headers)
        assert response.status_code == 200
        assert response.json['synced'] == []
        assert len(response.json['conflicts']) == 2
        for conflict in response.json['conflicts']:
            assert conflict['conflict']['resolution'] == 'server_wins'
            assert conflict['conflict']['strategy'] == 'version_then_timestamp'

    def test_push_stale_sync_version_conflict_is_detected_without_timestamp(
        self,
        client,
        auth_headers,
        sample_appointment
    ):
        payload = {
            'changes': [
                {
                    'entity_type': 'appointment',
                    'entity_id': sample_appointment.id,
                    'operation': 'update',
                    'data': {
                        'status': 'completed',
                        'sync_version': 0
                    }
                }
            ]
        }

        response = client.post('/api/sync/push', json=payload, headers=auth_headers)
        assert response.status_code == 200
        assert response.json['synced'] == []
        assert len(response.json['conflicts']) == 1

        conflict = response.json['conflicts'][0]['conflict']
        assert conflict['resolution'] == 'server_wins'
        assert conflict['strategy'] == 'version_then_timestamp'
        assert conflict['server_sync_version'] == 1
        assert conflict['client_sync_version'] == 0


class TestSyncPullEndpoint:
    """Test GET /api/sync/pull endpoint."""

    def test_pull_returns_changes_for_supported_entities(
        self,
        client,
        auth_headers,
        sample_appointment,
        sample_budget,
        sample_payment
    ):
        response = client.get('/api/sync/pull?since=2000-01-01T00:00:00Z', headers=auth_headers)

        assert response.status_code == 200
        data = response.json
        assert 'changes' in data
        assert 'timestamp' in data

        entity_types = {item['entity_type'] for item in data['changes']}
        assert 'appointment' in entity_types
        assert 'budget' in entity_types
        assert 'payment' in entity_types


class TestSyncStatusAndLogsEndpoints:
    """Test /api/sync/status and /api/sync/logs endpoint responses."""

    def test_status_and_logs_include_extended_sync_metadata(
        self,
        client,
        auth_headers,
        admin_auth_headers,
        sample_patient,
        sample_professional
    ):
        create_payload = {
            'changes': [
                {
                    'entity_type': 'appointment',
                    'entity_id': 'local-status-1',
                    'operation': 'create',
                    'data': {
                        'patient_id': sample_patient.id,
                        'professional_id': sample_professional.id,
                        'appointment_date': (datetime.utcnow() + timedelta(days=6)).isoformat(),
                        'status': 'scheduled'
                    }
                },
                {
                    'entity_type': 'unknown_entity',
                    'entity_id': 'local-status-fail',
                    'operation': 'create',
                    'data': {}
                }
            ]
        }

        push_response = client.post('/api/sync/push', json=create_payload, headers=auth_headers)
        assert push_response.status_code == 200

        status_response = client.get('/api/sync/status', headers=auth_headers)
        assert status_response.status_code == 200
        assert status_response.json['completed'] >= 1
        assert status_response.json['failed'] >= 1

        logs_response = client.get('/api/sync/logs?limit=10', headers=admin_auth_headers)
        assert logs_response.status_code == 200
        assert isinstance(logs_response.json, list)
        assert len(logs_response.json) >= 2

        first_log = logs_response.json[0]
        assert 'idempotency_key' in first_log
        assert 'external_entity_ref' in first_log
        assert 'result_entity_id' in first_log
        assert 'result_entity_version' in first_log
        assert 'conflict_payload' in first_log

    def test_logs_limit_validation(self, client, admin_auth_headers):
        invalid_negative = client.get('/api/sync/logs?limit=-1', headers=admin_auth_headers)
        assert invalid_negative.status_code == 400
        assert invalid_negative.json['msg'] == 'limit must be between 1 and 500'

        invalid_too_high = client.get('/api/sync/logs?limit=9999', headers=admin_auth_headers)
        assert invalid_too_high.status_code == 400
        assert invalid_too_high.json['msg'] == 'limit must be between 1 and 500'

        invalid_type = client.get('/api/sync/logs?limit=abc', headers=admin_auth_headers)
        assert invalid_type.status_code == 400
        assert invalid_type.json['msg'] == 'limit must be an integer'

    def test_logs_endpoint_forbidden_for_non_admin(self, client, auth_headers):
        response = client.get('/api/sync/logs?limit=10', headers=auth_headers)
        assert response.status_code == 403
