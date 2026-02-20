# -*- coding: utf-8 -*-
"""
Tests for CSV Injection Vulnerability
"""

import pytest
from app.models.medical_record import MedicalRecord
from app.extensions import db

class TestCSVInjection:
    """Test CSV injection prevention"""

    def test_csv_injection_vulnerability(self, client, admin_auth_headers, sample_patient, sample_professional):
        """Test that CSV injection payloads are sanitized"""

        # 1. Create a medical record with malicious payload
        with client.application.app_context():
            malicious_diagnosis = "=cmd|' /C calc'!A0"
            malicious_treatment = "+AnotherPayload"

            record = MedicalRecord(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                diagnosis=malicious_diagnosis,
                treatment=malicious_treatment,
                notes="Notes are not exported apparently"
            )
            db.session.add(record)
            db.session.commit()
            record_id = record.id

        # 2. Request CSV export
        response = client.get(
            f'/api/reports/medical/patient/{sample_patient.id}',
            query_string={'format': 'csv'},
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        content = response.data.decode('utf-8')

        print("\nCSV Content:\n", content)

        # 3. Check for sanitization
        # We expect the payload to be escaped, e.g., "'=cmd|' /C calc'!A0"
        assert "'=cmd|' /C calc'!A0" in content

        # Check treatment is also sanitized
        assert "'+AnotherPayload" in content
