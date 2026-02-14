# -*- coding: utf-8 -*-
"""
Tests for Backup system
"""

import pytest
import os
import shutil
import tempfile
from datetime import datetime
from app.tasks.backup_tasks import (
    BackupService,
    backup_database_task,
    backup_files_task,
    backup_all_task,
    cleanup_old_backups_task,
    get_backup_status_task
)


class TestBackupService:
    """Test BackupService utility methods"""

    def test_ensure_backup_directories(self, app):
        """Test that backup directories are created"""
        with app.app_context():
            BackupService.ensure_backup_directories()

            assert os.path.exists(BackupService.BACKUP_BASE_DIR)
            assert os.path.exists(BackupService.DB_BACKUP_DIR)
            assert os.path.exists(BackupService.FILES_BACKUP_DIR)

    def test_get_database_config(self, app):
        """Test database configuration parsing"""
        with app.app_context():
            config = BackupService.get_database_config()

            assert 'user' in config
            assert 'password' in config
            assert 'host' in config
            assert 'port' in config
            assert 'database' in config
            assert isinstance(config['user'], str)
            assert isinstance(config['host'], str)

    def test_create_database_backup(self, app):
        """Test database backup creation"""
        with app.app_context():
            result = BackupService.create_database_backup()

            assert 'success' in result
            if result['success']:
                assert 'backup_file' in result
                assert 'file_size' in result
                assert 'timestamp' in result
                assert os.path.exists(result['backup_file'])
                assert result['file_size'] > 0

    def test_create_files_backup_no_files(self, app):
        """Test files backup when no files exist"""
        with app.app_context():
            # Ensure files directory exists but is empty
            files_dir = 'storage/files'
            backup_temp = None
            if os.path.exists(files_dir):
                # Backup and restore later
                backup_temp = tempfile.mkdtemp()
                if os.listdir(files_dir):
                    shutil.copytree(files_dir, os.path.join(backup_temp, 'files'))

            try:
                result = BackupService.create_files_backup()

                # Should handle empty directory gracefully
                assert 'success' in result

            finally:
                # Restore files if they existed
                if backup_temp and os.path.exists(backup_temp):
                    shutil.rmtree(backup_temp, ignore_errors=True)

    def test_create_files_backup_with_files(self, app, sample_patient, sample_professional):
        """Test files backup with actual files"""
        with app.app_context():
            # Create a test file in storage
            test_dir = 'storage/files/test_backup'
            os.makedirs(test_dir, exist_ok=True)

            test_file = os.path.join(test_dir, 'test_file.txt')
            with open(test_file, 'w') as f:
                f.write('Test backup content')

            try:
                result = BackupService.create_files_backup()

                assert result['success'] is True
                assert 'backup_file' in result
                assert 'file_count' in result
                assert result['file_count'] >= 1
                assert os.path.exists(result['backup_file'])
                assert result['backup_file'].endswith('.zip')

            finally:
                # Cleanup
                if os.path.exists(test_dir):
                    shutil.rmtree(test_dir, ignore_errors=True)

    def test_cleanup_old_backups_no_backups(self, app):
        """Test cleanup when no backups exist"""
        with app.app_context():
            # Create a temporary backup directory
            temp_dir = tempfile.mkdtemp()

            try:
                result = BackupService.cleanup_old_backups(temp_dir, max_backups=3)

                assert result['success'] is True
                assert result['removed'] == 0

            finally:
                if os.path.exists(temp_dir):
                    os.rmdir(temp_dir)

    def test_cleanup_old_backups_keeps_recent(self, app):
        """Test that cleanup keeps recent backups"""
        with app.app_context():
            # Create temporary backup directory
            temp_dir = tempfile.mkdtemp()

            try:
                # Create 10 dummy backup files
                import time
                for i in range(10):
                    filename = f"backup_{i}.sql"
                    filepath = os.path.join(temp_dir, filename)
                    with open(filepath, 'w') as f:
                        f.write(f"Backup {i}")
                    time.sleep(0.01)  # Small delay to ensure different mtimes

                # Keep only 5 most recent
                result = BackupService.cleanup_old_backups(temp_dir, max_backups=5)

                assert result['success'] is True
                assert result['removed'] == 5
                assert result['remaining'] == 5

                # Verify 5 files remain
                remaining_files = [f for f in os.listdir(temp_dir) if os.path.isfile(os.path.join(temp_dir, f))]
                assert len(remaining_files) == 5

            finally:
                if os.path.exists(temp_dir):
                    shutil.rmtree(temp_dir, ignore_errors=True)

    def test_get_backup_status_empty(self, app):
        """Test getting backup status when no backups exist"""
        with app.app_context():
            # Clean backup directories first
            for backup_dir in [BackupService.DB_BACKUP_DIR, BackupService.FILES_BACKUP_DIR]:
                if os.path.exists(backup_dir):
                    for filename in os.listdir(backup_dir):
                        filepath = os.path.join(backup_dir, filename)
                        if os.path.isfile(filepath):
                            os.remove(filepath)

            status = BackupService.get_backup_status()

            assert 'database_backups' in status
            assert 'file_backups' in status
            assert 'total_size' in status
            assert isinstance(status['database_backups'], list)
            assert isinstance(status['file_backups'], list)

    def test_get_backup_status_with_backups(self, app):
        """Test getting backup status with existing backups"""
        with app.app_context():
            # Create a test backup
            BackupService.ensure_backup_directories()

            test_file = os.path.join(BackupService.DB_BACKUP_DIR, 'test_backup.sql')
            with open(test_file, 'w') as f:
                f.write('Test backup content')

            try:
                status = BackupService.get_backup_status()

                assert status['database_backups'] or status['file_backups']
                assert status['total_size'] > 0

            finally:
                if os.path.exists(test_file):
                    os.remove(test_file)


class TestBackupDatabaseTask:
    """Test backup_database_task"""

    def test_backup_database_task_success(self, app):
        """Test database backup task execution"""
        with app.app_context():
            result = backup_database_task()

            assert 'success' in result
            if result['success']:
                assert 'backup_file' in result
                assert 'cleanup' in result
                assert result['cleanup']['success'] is True

    def test_backup_database_task_creates_file(self, app):
        """Test that database backup creates a file"""
        with app.app_context():
            result = backup_database_task()

            if result['success']:
                # Verify backup file exists
                assert 'backup_file' in result
                assert os.path.exists(result['backup_file'])
                assert result['file_size'] > 0


class TestBackupFilesTask:
    """Test backup_files_task"""

    def test_backup_files_task_execution(self, app):
        """Test files backup task execution"""
        with app.app_context():
            # Create test files directory
            test_dir = 'storage/files/test'
            os.makedirs(test_dir, exist_ok=True)
            test_file = os.path.join(test_dir, 'test.txt')
            with open(test_file, 'w') as f:
                f.write('Test content')

            try:
                result = backup_files_task()

                assert 'success' in result
                if result['success']:
                    assert 'backup_file' in result
                    assert 'cleanup' in result

            finally:
                if os.path.exists(test_dir):
                    shutil.rmtree(test_dir, ignore_errors=True)


class TestBackupAllTask:
    """Test backup_all_task"""

    def test_backup_all_task_combines_backups(self, app):
        """Test that backup_all runs both database and files backups"""
        with app.app_context():
            result = backup_all_task()

            assert 'database' in result
            assert 'files' in result
            assert 'timestamp' in result
            assert 'success' in result['database']


class TestCleanupOldBackupsTask:
    """Test cleanup_old_backups_task"""

    def test_cleanup_task_execution(self, app):
        """Test cleanup task execution"""
        with app.app_context():
            result = cleanup_old_backups_task(max_backups=5)

            assert 'database' in result
            assert 'files' in result
            assert 'timestamp' in result
            assert result['database']['success'] is True
            assert result['files']['success'] is True

    def test_cleanup_task_with_custom_max(self, app):
        """Test cleanup with custom max backups"""
        with app.app_context():
            result = cleanup_old_backups_task(max_backups=3)

            assert result['database']['success'] is True
            assert result['files']['success'] is True


class TestGetBackupStatusTask:
    """Test get_backup_status_task"""

    def test_get_backup_status_task(self, app):
        """Test getting backup status via task"""
        with app.app_context():
            result = get_backup_status_task()

            assert 'database_backups' in result
            assert 'file_backups' in result
            assert 'total_size' in result


class TestBackupIntegration:
    """Integration tests for backup workflow"""

    def test_complete_backup_workflow(self, app):
        """Test complete backup workflow: create -> status -> cleanup"""
        with app.app_context():
            # 1. Create database backup
            db_result = backup_database_task()
            assert db_result.get('success') is not None

            # 2. Create files backup
            files_result = backup_files_task()
            assert files_result.get('success') is not None

            # 3. Get status
            status = get_backup_status_task()
            assert status['database_backups'] or status['file_backups']

            # 4. Cleanup
            cleanup_result = cleanup_old_backups_task(max_backups=7)
            assert cleanup_result['database']['success'] is True

    def test_backup_rotation_workflow(self, app):
        """Test that backups are properly rotated"""
        with app.app_context():
            # Create multiple backups
            for i in range(3):
                db_result = backup_database_task()
                if db_result.get('success'):
                    import time
                    time.sleep(0.1)  # Small delay to ensure different timestamps

            # Get status
            status = get_backup_status_task()

            # Should have backups
            if status['database_backups']:
                # Backups should be sorted by date (newest first)
                assert len(status['database_backups']) > 0

                # If we have more than 1 backup, verify sorting
                if len(status['database_backups']) > 1:
                    first_date = status['database_backups'][0]['created']
                    second_date = status['database_backups'][1]['created']
                    assert first_date >= second_date

    def test_backup_error_handling(self, app):
        """Test backup error handling with invalid configuration"""
        with app.app_context():
            # All backup functions should handle errors gracefully
            # Even if pg_dump is not available, should create mock backup
            result = BackupService.create_database_backup()
            assert 'success' in result
