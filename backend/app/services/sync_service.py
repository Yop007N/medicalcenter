# -*- coding: utf-8 -*-
"""
Sync Service - Handles cloud-local data synchronization
"""

from datetime import datetime
import logging

from app.models.sync_log import SyncLog
from app.extensions import db
from app.services.exceptions import ValidationError

logger = logging.getLogger(__name__)


class SyncService:
    """Cloud-local synchronization business logic"""

    VALID_OPERATIONS = {"create", "update", "delete"}
    VALID_DIRECTIONS = {"local_to_cloud", "cloud_to_local"}

    @classmethod
    def sync_to_cloud(cls, entity_type, entity_id, operation):
        """
        Synchronize local changes to cloud

        Args:
            entity_type: Type of entity (appointment, patient, etc.)
            entity_id: Entity ID
            operation: create, update, or delete
        """
        sync_log = cls.create_sync_log(
            entity_type=entity_type,
            entity_id=entity_id,
            operation=operation,
            direction="local_to_cloud",
        )
        return cls._execute_sync(sync_log)

    @classmethod
    def sync_from_cloud(cls, entity_type, entity_id):
        """Pull entity data from cloud to local"""
        sync_log = cls.create_sync_log(
            entity_type=entity_type,
            entity_id=entity_id,
            operation="update",
            direction="cloud_to_local",
        )
        return cls._execute_sync(sync_log)

    @staticmethod
    def get_pending_syncs():
        """Get all pending sync operations"""
        return SyncLog.query.filter_by(status='pending').order_by(SyncLog.created_at.asc()).all()

    @classmethod
    def create_sync_log(cls, entity_type, entity_id, operation, direction):
        """Create sync log entry"""
        cls._validate_sync_input(entity_type, entity_id, operation, direction)

        log = SyncLog(
            entity_type=entity_type,
            entity_id=entity_id,
            operation=operation,
            direction=direction,
            status='pending'
        )
        db.session.add(log)
        db.session.commit()
        return log

    @staticmethod
    def _execute_sync(sync_log):
        """Execute sync placeholder workflow and update status transitions."""
        try:
            sync_log.status = 'in_progress'
            db.session.add(sync_log)
            db.session.commit()

            # Current implementation persists deterministic status transitions.
            # External provider integration can be added without changing API callers.
            logger.info(
                "Syncing %s:%s (%s, %s)",
                sync_log.entity_type,
                sync_log.entity_id,
                sync_log.operation,
                sync_log.direction,
            )

            sync_log.status = 'completed'
            sync_log.completed_at = datetime.utcnow()
            sync_log.error_message = None
            db.session.add(sync_log)
            db.session.commit()
            return sync_log
        except Exception as exc:
            db.session.rollback()
            SyncService._mark_sync_failed(sync_log, str(exc))
            return sync_log

    @staticmethod
    def _mark_sync_failed(sync_log, error_message):
        """Persist failed sync status without masking original execution errors."""
        try:
            sync_log.status = 'failed'
            sync_log.error_message = error_message
            sync_log.retry_count = (sync_log.retry_count or 0) + 1
            db.session.add(sync_log)
            db.session.commit()
        except Exception:
            db.session.rollback()
            logger.exception("Unable to persist failed sync log")

    @classmethod
    def _validate_sync_input(cls, entity_type, entity_id, operation, direction):
        if not entity_type or not str(entity_type).strip():
            raise ValidationError("entity_type is required")

        if not isinstance(entity_id, int) or entity_id <= 0:
            raise ValidationError("entity_id must be a positive integer")

        if operation not in cls.VALID_OPERATIONS:
            raise ValidationError(
                "operation must be one of create/update/delete",
                details={"allowed_operations": sorted(cls.VALID_OPERATIONS)},
            )

        if direction not in cls.VALID_DIRECTIONS:
            raise ValidationError(
                "direction must be local_to_cloud or cloud_to_local",
                details={"allowed_directions": sorted(cls.VALID_DIRECTIONS)},
            )
