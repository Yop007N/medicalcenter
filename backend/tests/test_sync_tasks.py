# -*- coding: utf-8 -*-
"""
Tests for sync Celery tasks.
"""

from datetime import datetime, timedelta

from app.extensions import db
from app.models.sync_log import SyncLog
from app.tasks.sync_tasks import cleanup_old_sync_logs_task


class TestCleanupOldSyncLogsTask:
    def test_cleanup_removes_only_old_terminal_logs(self, app):
        now = datetime.utcnow()
        with app.app_context():
            old_completed = SyncLog(
                entity_type='appointment',
                entity_id=1,
                operation='update',
                direction='local_to_cloud',
                status='completed',
                created_at=now - timedelta(days=50),
                completed_at=now - timedelta(days=49),
            )
            old_failed = SyncLog(
                entity_type='appointment',
                entity_id=2,
                operation='update',
                direction='local_to_cloud',
                status='failed',
                created_at=now - timedelta(days=45),
            )
            recent_completed = SyncLog(
                entity_type='appointment',
                entity_id=3,
                operation='update',
                direction='local_to_cloud',
                status='completed',
                created_at=now - timedelta(days=5),
                completed_at=now - timedelta(days=4),
            )
            old_pending = SyncLog(
                entity_type='appointment',
                entity_id=4,
                operation='update',
                direction='local_to_cloud',
                status='pending',
                created_at=now - timedelta(days=60),
            )
            db.session.add_all([old_completed, old_failed, recent_completed, old_pending])
            db.session.commit()

            result = cleanup_old_sync_logs_task.run(days=30)
            assert result['cleaned_up'] == 2
            assert result['matched'] == 2

            remaining_ids = {row.entity_id for row in SyncLog.query.all()}
            assert remaining_ids == {3, 4}

    def test_cleanup_rejects_invalid_days(self, app):
        with app.app_context():
            result = cleanup_old_sync_logs_task.run(days=0)
            assert 'error' in result
            assert 'days must be >= 1' in result['error']

