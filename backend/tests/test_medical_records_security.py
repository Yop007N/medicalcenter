# -*- coding: utf-8 -*-
"""
Security Tests for Medical Records endpoints
"""

import pytest
import json
from app.models.medical_record import MedicalRecord

class TestMedicalRecordsSecurity:
    """Test security constraints for medical records"""

    def test_get_other_patient_medical_record_forbidden(self, client, patient_auth_headers, sample_patient, sample_professional, app):
        """Test that a patient cannot access another patient's medical record"""
        # 1. Create a medical record for sample_patient
        with app.app_context():
            from app.extensions import db
            record = MedicalRecord(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                chief_complaint='Secret',
                diagnosis='Secret'
            )
            db.session.add(record)
            db.session.commit()
            record_id = record.id

        # 2. Try to access it as patient_user (who is NOT sample_patient)
        # patient_auth_headers corresponds to 'patient@test.com'
        # sample_patient corresponds to 'testpatient@test.com'
        response = client.get(f'/api/medical-records/{record_id}', headers=patient_auth_headers)

        # 3. Assert 403 Forbidden
        assert response.status_code == 403

    def test_list_medical_records_enforces_patient_isolation(self, client, patient_auth_headers, sample_patient, sample_professional, app):
        """Test that a patient listing records only sees their own"""
        # 1. Create a medical record for sample_patient
        with app.app_context():
            from app.extensions import db
            record = MedicalRecord(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                chief_complaint='Secret',
                diagnosis='Secret'
            )
            db.session.add(record)
            db.session.commit()
            record_id = record.id

        # 2. Try to list records as patient_user
        # Even if we try to filter by sample_patient.id
        response = client.get(f'/api/medical-records?patient_id={sample_patient.id}', headers=patient_auth_headers)

        # 3. We expect that we CANNOT see the secret record.
        # The API might return 403 (if we strictly check filter) or 200 with empty list (if we silently enforce own filter)
        # We will implement it to return 403 if they explicitly ask for another patient.
        # Or if they ask for all, it returns 200 but only their records.

        if response.status_code == 200:
            data = json.loads(response.data)
            # Ensure the secret record is NOT in the list
            record_ids = [r['id'] for r in data]
            assert record_id not in record_ids
        else:
            assert response.status_code == 403
