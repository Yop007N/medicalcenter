# -*- coding: utf-8 -*-
"""
Tests for frontend logs endpoints (/api/logs/frontend)
"""

import builtins

from app.resources import logs as logs_resource


class TestFrontendLogsEndpoints:
    """Test POST/GET/DELETE frontend logs endpoints."""

    def test_receive_frontend_logs_success(self, client, tmp_path, monkeypatch, admin_auth_headers):
        log_path = tmp_path / 'doc.log'
        monkeypatch.setattr(logs_resource, 'LOG_FILE_PATH', str(log_path))

        response = client.post(
            '/api/logs/frontend',
            headers=admin_auth_headers,
            json={
                'logs': [
                    {'timestamp': '2026-01-01T00:00:00', 'level': 'INFO', 'source': 'UI', 'message': 'hello'},
                    {'level': 'ERROR', 'source': 'UI', 'message': 'boom', 'data': {'code': 500}},
                ]
            },
        )

        assert response.status_code == 200
        assert response.json['msg'] == '2 logs stored successfully'
        assert log_path.exists()
        content = log_path.read_text(encoding='utf-8')
        assert '[INFO] [UI] hello' in content
        assert '[ERROR] [UI] boom' in content

    def test_receive_frontend_logs_validates_payload(self, client, admin_auth_headers):
        invalid_json = client.post(
            '/api/logs/frontend',
            headers=admin_auth_headers,
            data='{"broken": true',
            content_type='application/json',
        )
        assert invalid_json.status_code == 400
        assert invalid_json.json['msg'] == 'Invalid JSON body'

        non_object = client.post('/api/logs/frontend', headers=admin_auth_headers, json=['not-object'])
        assert non_object.status_code == 400
        assert non_object.json['msg'] == 'Request body must be an object'

        invalid_logs_type = client.post('/api/logs/frontend', headers=admin_auth_headers, json={'logs': {}})
        assert invalid_logs_type.status_code == 400
        assert invalid_logs_type.json['msg'] == 'logs must be an array'

    def test_receive_frontend_logs_internal_error_is_sanitized(self, client, monkeypatch, admin_auth_headers):
        def _raise_io_error(*_args, **_kwargs):
            raise OSError('disk full')

        monkeypatch.setattr(builtins, 'open', _raise_io_error)

        response = client.post('/api/logs/frontend', headers=admin_auth_headers, json={'logs': [{'message': 'will fail'}]})
        assert response.status_code == 500
        assert response.json['msg'] == 'Error storing logs'

    def test_get_frontend_logs_no_file(self, client, tmp_path, monkeypatch, admin_auth_headers):
        log_path = tmp_path / 'doc.log'
        monkeypatch.setattr(logs_resource, 'LOG_FILE_PATH', str(log_path))

        response = client.get('/api/logs/frontend', headers=admin_auth_headers)
        assert response.status_code == 200
        assert response.json['logs'] == []
        assert response.json['msg'] == 'No logs yet'

    def test_get_frontend_logs_internal_error_is_sanitized(self, client, tmp_path, monkeypatch, admin_auth_headers):
        log_path = tmp_path / 'doc.log'
        monkeypatch.setattr(logs_resource, 'LOG_FILE_PATH', str(log_path))
        log_path.write_text('line 1\n', encoding='utf-8')

        def _raise_io_error(*_args, **_kwargs):
            raise OSError('cannot read')

        monkeypatch.setattr(builtins, 'open', _raise_io_error)

        response = client.get('/api/logs/frontend', headers=admin_auth_headers)
        assert response.status_code == 500
        assert response.json['msg'] == 'Error reading logs'

    def test_clear_frontend_logs_success(self, client, tmp_path, monkeypatch, admin_auth_headers):
        log_path = tmp_path / 'doc.log'
        monkeypatch.setattr(logs_resource, 'LOG_FILE_PATH', str(log_path))
        log_path.write_text('line 1\n', encoding='utf-8')

        response = client.delete('/api/logs/frontend', headers=admin_auth_headers)
        assert response.status_code == 200
        assert response.json['msg'] == 'Logs cleared successfully'
        assert not log_path.exists()

    def test_clear_frontend_logs_internal_error_is_sanitized(self, client, tmp_path, monkeypatch, admin_auth_headers):
        log_path = tmp_path / 'doc.log'
        monkeypatch.setattr(logs_resource, 'LOG_FILE_PATH', str(log_path))
        log_path.write_text('line 1\n', encoding='utf-8')

        def _raise_remove_error(*_args, **_kwargs):
            raise OSError('cannot remove')

        monkeypatch.setattr(logs_resource.os, 'remove', _raise_remove_error)

        response = client.delete('/api/logs/frontend', headers=admin_auth_headers)
        assert response.status_code == 500
        assert response.json['msg'] == 'Error clearing logs'
