# -*- coding: utf-8 -*-
"""Unit tests for app.services.sync_service."""

import pytest

from app.extensions import db
from app.services.exceptions import ValidationError
from app.services.sync_service import SyncService


def test_sync_to_cloud_creates_completed_log(app):
    with app.app_context():
        log = SyncService.sync_to_cloud(
            entity_type='appointment',
            entity_id=10,
            operation='create',
        )

        assert log.id is not None
        assert log.direction == 'local_to_cloud'
        assert log.operation == 'create'
        assert log.status == 'completed'
        assert log.completed_at is not None


def test_sync_from_cloud_uses_update_operation(app):
    with app.app_context():
        log = SyncService.sync_from_cloud(
            entity_type='patient',
            entity_id=7,
        )

        assert log.direction == 'cloud_to_local'
        assert log.operation == 'update'
        assert log.status == 'completed'


def test_create_sync_log_validates_operation(app):
    with app.app_context():
        with pytest.raises(ValidationError):
            SyncService.create_sync_log(
                entity_type='patient',
                entity_id=1,
                operation='merge',
                direction='local_to_cloud',
            )


def test_get_pending_syncs_returns_only_pending(app):
    with app.app_context():
        pending = SyncService.create_sync_log(
            entity_type='budget',
            entity_id=20,
            operation='update',
            direction='local_to_cloud',
        )
        done = SyncService.create_sync_log(
            entity_type='budget',
            entity_id=21,
            operation='delete',
            direction='cloud_to_local',
        )
        done.status = 'completed'
        db.session.add(done)
        db.session.commit()

        logs = SyncService.get_pending_syncs()
        ids = {item.id for item in logs}

        assert pending.id in ids
        assert done.id not in ids
