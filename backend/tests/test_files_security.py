# -*- coding: utf-8 -*-
"""
Security Tests for File Management module
"""

import pytest
import os
from app.models.file import File
from app.models.medical_record import MedicalRecord
from app.models.professional import Professional
from app.extensions import db

@pytest.fixture(scope='function')
def other_professional(app):
    """Create a second professional for testing unauthorized access"""
    with app.app_context():
        prof = Professional(
            email='otherdoc@test.com',
            first_name='Other',
            last_name='Doctor',
            role='professional',
            license_number='OTHER123',
            specialty='Dermatology'
        )
        prof.set_password('Doctor123')
        db.session.add(prof)
        db.session.commit()
        prof_id = prof.id
        db.session.expunge(prof)

    class ProfData:
        def __init__(self, id):
            self.id = id

    return ProfData(prof_id)

@pytest.fixture(scope='function')
def other_auth_headers(client, other_professional):
    """Get authentication headers for the second professional user"""
    response = client.post('/api/auth/login', json={
        'email': 'otherdoc@test.com',
        'password': 'Doctor123'
    })
    token = response.json['access_token']
    return {'Authorization': f'Bearer {token}'}

class TestFileSecurity:
    """Test security vulnerabilities in file management"""

    def test_idor_download_file(self, client, other_auth_headers, sample_file):
        """
        Test IDOR vulnerability in file download.
        An unrelated professional should NOT be able to download a file
        belonging to a patient they are not treating.
        """
        # other_professional tries to download sample_file (owned by sample_patient/sample_professional)
        response = client.get(f'/api/files/{sample_file.id}/download', headers=other_auth_headers)

        # This should return 403 Forbidden, but currently returns 200 OK (Vulnerability)
        # We assert what we WANT to happen (security fix), so this test should FAIL initially
        assert response.status_code == 403, "IDOR Vulnerability: Unrelated professional could download file"

    def test_idor_get_file_metadata(self, client, other_auth_headers, sample_file):
        """
        Test IDOR vulnerability in getting file metadata.
        """
        response = client.get(f'/api/files/{sample_file.id}', headers=other_auth_headers)
        assert response.status_code == 403, "IDOR Vulnerability: Unrelated professional could view file metadata"

    def test_idor_delete_file(self, client, other_auth_headers, sample_file):
        """
        Test IDOR vulnerability in deleting file.
        """
        response = client.delete(f'/api/files/{sample_file.id}', headers=other_auth_headers)
        assert response.status_code == 403, "IDOR Vulnerability: Unrelated professional could delete file"
