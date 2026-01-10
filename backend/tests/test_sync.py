# -*- coding: utf-8 -*-
"""
Tests for Synchronization module
"""

import pytest
from datetime import datetime, timedelta
from decimal import Decimal
from app.tasks.sync_tasks import (
    SyncService,
    sync_all_data_task,
    sync_periodic_task,
    sync_daily_full_task,
    sync_files_on_demand_task,
    verify_data_integrity_task,
    cleanup_old_sync_logs_task
)
from app.models.patient import Patient
from app.models.professional import Professional
from app.models.appointment import Appointment
from app.models.medical_record import MedicalRecord
from app.models.file import File
from app.models.budget import Budget
from app.models.payment import Payment
from app.extensions import db


class TestSyncService:
    """Test SyncService utility methods"""

    def test_calculate_checksum_dict(self, app):
        """Test checksum calculation for dictionary"""
        with app.app_context():
            data = {'id': 1, 'name': 'Test', 'value': 100}
            checksum = SyncService.calculate_checksum(data)

            assert checksum is not None
            assert len(checksum) == 64  # SHA256 produces 64 char hex string
            assert isinstance(checksum, str)

    def test_calculate_checksum_string(self, app):
        """Test checksum calculation for string"""
        with app.app_context():
            data = "Test string for checksum"
            checksum = SyncService.calculate_checksum(data)

            assert checksum is not None
            assert len(checksum) == 64

    def test_calculate_checksum_consistency(self, app):
        """Test that same data produces same checksum"""
        with app.app_context():
            data = {'id': 1, 'name': 'Test'}
            checksum1 = SyncService.calculate_checksum(data)
            checksum2 = SyncService.calculate_checksum(data)

            assert checksum1 == checksum2

    def test_get_model_updates_since(self, app, sample_patient):
        """Test getting model updates since a specific datetime"""
        with app.app_context():
            # Get recent updates (last hour)
            recent_time = datetime.utcnow() - timedelta(hours=1)
            updates = SyncService.get_model_updates_since(Patient, recent_time)

            assert isinstance(updates, list)

    def test_get_model_updates_invalid_model(self, app):
        """Test handling of invalid model class"""
        with app.app_context():
            # Model without updated_at field
            class FakeModel:
                pass

            recent_time = datetime.utcnow() - timedelta(hours=1)
            updates = SyncService.get_model_updates_since(FakeModel, recent_time)

            assert updates == []

    def test_resolve_conflict_local_newer(self, app, sample_patient):
        """Test conflict resolution when local is newer"""
        with app.app_context():
            patient = Patient.query.get(sample_patient.id)

            # Remote record with older timestamp
            remote_data = {
                'updated_at': (datetime.utcnow() - timedelta(hours=1)).isoformat(),
                'created_at': (datetime.utcnow() - timedelta(days=1)).isoformat()
            }

            result = SyncService.resolve_conflict(patient, remote_data)
            assert result == 'local'

    def test_resolve_conflict_remote_newer(self, app, sample_patient):
        """Test conflict resolution when remote is newer"""
        with app.app_context():
            patient = Patient.query.get(sample_patient.id)

            # Remote record with newer timestamp
            remote_data = {
                'updated_at': (datetime.utcnow() + timedelta(hours=1)).isoformat(),
                'created_at': datetime.utcnow().isoformat()
            }

            result = SyncService.resolve_conflict(patient, remote_data)
            assert result == 'remote'

    def test_sync_model_data_full(self, app, sample_patient, sample_professional):
        """Test full sync for a model"""
        with app.app_context():
            stats = SyncService.sync_model_data(Patient, since_datetime=None)

            assert stats['model'] == 'Patient'
            assert stats['updated'] >= 1  # At least the sample patient
            assert 'errors' in stats
            assert 'conflicts' in stats

    def test_sync_model_data_incremental(self, app, sample_patient):
        """Test incremental sync for a model"""
        with app.app_context():
            recent_time = datetime.utcnow() - timedelta(minutes=30)
            stats = SyncService.sync_model_data(Patient, since_datetime=recent_time)

            assert stats['model'] == 'Patient'
            assert 'updated' in stats
            assert isinstance(stats['errors'], int)


class TestSyncAllDataTask:
    """Test sync_all_data_task"""

    def test_sync_all_data_incremental(self, app, sample_patient, sample_professional):
        """Test incremental sync of all data"""
        with app.app_context():
            result = sync_all_data_task(incremental=True)

            assert 'sync_type' in result
            assert result['sync_type'] == 'incremental'
            assert 'started_at' in result
            assert 'completed_at' in result
            assert 'models' in result
            assert 'total_updated' in result
            assert 'total_errors' in result
            assert len(result['models']) == 7  # 7 models synced

    def test_sync_all_data_full(self, app, sample_patient, sample_professional):
        """Test full sync of all data"""
        with app.app_context():
            result = sync_all_data_task(incremental=False)

            assert result['sync_type'] == 'full'
            assert 'started_at' in result
            assert 'completed_at' in result
            assert len(result['models']) == 7
            assert result['total_updated'] >= 2  # At least patient and professional

    def test_sync_all_data_includes_all_models(self, app):
        """Test that sync includes all expected models"""
        with app.app_context():
            result = sync_all_data_task(incremental=False)

            model_names = [m['model'] for m in result['models']]

            assert 'Patient' in model_names
            assert 'Professional' in model_names
            assert 'Appointment' in model_names
            assert 'MedicalRecord' in model_names
            assert 'File' in model_names
            assert 'Budget' in model_names
            assert 'Payment' in model_names


class TestSyncPeriodicTask:
    """Test periodic sync task"""

    def test_sync_periodic_runs_incremental(self, app, sample_patient):
        """Test that periodic sync runs incremental sync"""
        with app.app_context():
            result = sync_periodic_task()

            assert result['sync_type'] == 'incremental'
            assert 'models' in result
            assert 'total_updated' in result


class TestSyncDailyFullTask:
    """Test daily full sync task"""

    def test_sync_daily_full_runs_full_sync(self, app, sample_patient):
        """Test that daily task runs full sync"""
        with app.app_context():
            result = sync_daily_full_task()

            assert result['sync_type'] == 'full'
            assert 'models' in result
            assert 'total_updated' in result


class TestSyncFilesOnDemandTask:
    """Test on-demand file sync"""

    def test_sync_files_specific_ids(self, app, sample_patient, sample_professional):
        """Test syncing specific file IDs"""
        with app.app_context():
            # Create a medical record and file
            medical_record = MedicalRecord(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                chief_complaint='Test complaint'
            )
            db.session.add(medical_record)
            db.session.commit()

            # Create a test file record (without actual file)
            file_record = File(
                medical_record_id=medical_record.id,
                filename='test.pdf',
                file_type='lab_result',
                mime_type='application/pdf',
                file_size=1024,
                storage_type='local',
                file_path='storage/files/test.pdf',
                uploaded_by=sample_professional.id
            )
            db.session.add(file_record)
            db.session.commit()
            file_id = file_record.id

            result = sync_files_on_demand_task(file_ids=[file_id])

            assert 'total_files' in result
            assert result['total_files'] == 1
            assert 'synced' in result
            assert 'failed' in result
            assert 'total_size_mb' in result

    def test_sync_files_all_recent(self, app):
        """Test syncing all recent files"""
        with app.app_context():
            result = sync_files_on_demand_task(file_ids=None)

            assert 'total_files' in result
            assert 'synced' in result
            assert 'failed' in result
            assert 'total_size_bytes' in result
            assert 'total_size_mb' in result
            assert 'timestamp' in result

    def test_sync_files_with_actual_file(self, app, sample_patient, sample_professional):
        """Test syncing files that exist on disk"""
        import os
        import tempfile

        with app.app_context():
            # Create a medical record
            medical_record = MedicalRecord(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                chief_complaint='Test'
            )
            db.session.add(medical_record)
            db.session.commit()

            # Create a temporary file
            with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as f:
                f.write('Test file content')
                tmp_path = f.name

            try:
                file_size = os.path.getsize(tmp_path)

                # Create file record pointing to real file
                file_record = File(
                    medical_record_id=medical_record.id,
                    filename='test.txt',
                    file_type='general',
                    mime_type='text/plain',
                    file_size=file_size,
                    storage_type='local',
                    file_path=tmp_path,
                    uploaded_by=sample_professional.id
                )
                db.session.add(file_record)
                db.session.commit()

                # Sync this specific file
                result = sync_files_on_demand_task(file_ids=[file_record.id])

                assert result['total_files'] == 1
                assert result['synced'] >= 0  # May be synced or failed
                assert result['total_size_bytes'] >= 0

            finally:
                # Cleanup
                try:
                    if os.path.exists(tmp_path):
                        os.remove(tmp_path)
                except:
                    pass


class TestVerifyDataIntegrityTask:
    """Test data integrity verification"""

    def test_verify_data_integrity_all_models(self, app, sample_patient, sample_professional):
        """Test integrity verification for all models"""
        with app.app_context():
            result = verify_data_integrity_task()

            assert 'verified_at' in result
            assert 'models' in result
            assert 'total_records' in result
            assert 'total_errors' in result
            assert len(result['models']) == 6  # 6 models verified

    def test_verify_data_integrity_model_details(self, app, sample_patient):
        """Test that verification includes model details"""
        with app.app_context():
            result = verify_data_integrity_task()

            # Check that each model has required fields
            for model_result in result['models']:
                assert 'model' in model_result
                assert 'total_records' in model_result
                assert 'errors' in model_result
                assert isinstance(model_result['total_records'], int)
                assert isinstance(model_result['errors'], int)

    def test_verify_data_integrity_with_valid_data(self, app, sample_patient, sample_professional):
        """Test verification with valid data"""
        with app.app_context():
            # Create some test data
            appointment = Appointment(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                appointment_date=datetime.utcnow() + timedelta(days=1),
                status='scheduled'
            )
            db.session.add(appointment)
            db.session.commit()

            result = verify_data_integrity_task()

            # Should complete without errors
            assert 'error' not in result
            assert result['total_records'] >= 3  # patient, professional, appointment


class TestCleanupOldSyncLogsTask:
    """Test cleanup of old sync logs"""

    def test_cleanup_default_days(self, app):
        """Test cleanup with default 30 days"""
        with app.app_context():
            result = cleanup_old_sync_logs_task()

            assert 'cutoff_date' in result
            assert 'cleaned_up' in result
            assert 'timestamp' in result
            assert isinstance(result['cleaned_up'], int)

    def test_cleanup_custom_days(self, app):
        """Test cleanup with custom retention period"""
        with app.app_context():
            result = cleanup_old_sync_logs_task(days=7)

            assert 'cutoff_date' in result

            # Verify cutoff date is approximately 7 days ago
            cutoff = datetime.fromisoformat(result['cutoff_date'])
            expected_cutoff = datetime.utcnow() - timedelta(days=7)

            # Allow 1 minute difference for test execution time
            time_diff = abs((cutoff - expected_cutoff).total_seconds())
            assert time_diff < 60

    def test_cleanup_returns_summary(self, app):
        """Test that cleanup returns proper summary"""
        with app.app_context():
            result = cleanup_old_sync_logs_task(days=90)

            assert 'cutoff_date' in result
            assert 'cleaned_up' in result
            assert 'timestamp' in result


class TestSyncIntegration:
    """Integration tests for sync functionality"""

    def test_sync_workflow_incremental_then_full(self, app, sample_patient, sample_professional):
        """Test complete sync workflow: incremental then full"""
        with app.app_context():
            # Run incremental sync
            incremental_result = sync_periodic_task()
            assert incremental_result['sync_type'] == 'incremental'

            # Run full sync
            full_result = sync_daily_full_task()
            assert full_result['sync_type'] == 'full'

            # Full sync should have same or more records
            assert full_result['total_updated'] >= incremental_result['total_updated']

    def test_sync_with_file_verification(self, app, sample_patient, sample_professional):
        """Test sync combined with file sync and integrity check"""
        with app.app_context():
            # Sync all data
            sync_result = sync_all_data_task(incremental=False)
            assert 'error' not in sync_result

            # Sync files
            file_result = sync_files_on_demand_task()
            assert 'error' not in file_result

            # Verify integrity
            verify_result = verify_data_integrity_task()
            assert 'error' not in verify_result

            # All tasks should complete successfully
            assert sync_result['total_errors'] == 0
            assert verify_result['total_errors'] == 0

    def test_sync_preserves_data_integrity(self, app, sample_patient):
        """Test that sync doesn't corrupt data"""
        with app.app_context():
            # Get patient data before sync
            patient_before = Patient.query.get(sample_patient.id)
            email_before = patient_before.email
            name_before = patient_before.first_name

            # Run sync
            sync_all_data_task(incremental=False)

            # Get patient data after sync
            patient_after = Patient.query.get(sample_patient.id)

            # Data should be unchanged
            assert patient_after.email == email_before
            assert patient_after.first_name == name_before

    def test_checksum_consistency_after_sync(self, app, sample_patient):
        """Test that checksums are consistent before and after sync"""
        with app.app_context():
            patient = Patient.query.get(sample_patient.id)

            # Create dict manually from patient data
            patient_data = {
                'id': patient.id,
                'email': patient.email,
                'first_name': patient.first_name,
                'last_name': patient.last_name
            }

            # Calculate checksum before sync
            checksum_before = SyncService.calculate_checksum(patient_data)

            # Run sync
            sync_all_data_task(incremental=False)

            # Calculate checksum after sync
            patient_after = Patient.query.get(sample_patient.id)
            patient_data_after = {
                'id': patient_after.id,
                'email': patient_after.email,
                'first_name': patient_after.first_name,
                'last_name': patient_after.last_name
            }
            checksum_after = SyncService.calculate_checksum(patient_data_after)

            # Checksums should match (data unchanged)
            assert checksum_before == checksum_after
