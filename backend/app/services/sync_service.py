# -*- coding: utf-8 -*-
"""
Sync Service - Handles cloud-local data synchronization
"""

from datetime import datetime
import hashlib
import json
import logging

from app.extensions import db
from app.models.sync_log import SyncLog
from app.services.exceptions import ValidationError

logger = logging.getLogger(__name__)


class SyncService:
    """Cloud-local synchronization business logic"""

    VALID_OPERATIONS = {"create", "update", "delete"}
    VALID_DIRECTIONS = {"local_to_cloud", "cloud_to_local"}

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
    def calculate_checksum(data):
        """Calculate SHA256 checksum for integrity checks."""
        if isinstance(data, dict):
            data = json.dumps(data, sort_keys=True, default=str)
        return hashlib.sha256(str(data).encode('utf-8')).hexdigest()

    @staticmethod
    def get_model_updates_since(model_class, since_datetime):
        """Return rows updated since the provided datetime."""
        try:
            return model_class.query.filter(model_class.updated_at >= since_datetime).all()
        except Exception as exc:
            logger.error("Error getting updates for %s: %s", getattr(model_class, '__name__', model_class), exc)
            return []

    @staticmethod
    def resolve_conflict(local_record, remote_record):
        """Resolve conflicts using last-write-wins."""
        remote_record = remote_record or {}
        local_updated = (
            local_record.updated_at
            if hasattr(local_record, 'updated_at')
            else local_record.created_at
        )
        remote_updated = remote_record.get('updated_at') or remote_record.get('created_at')
        if not remote_updated:
            return 'local'
        if isinstance(remote_updated, str):
            remote_updated = datetime.fromisoformat(remote_updated.replace('Z', '+00:00'))

        if local_updated >= remote_updated:
            logger.info("Conflict resolved: keeping local version (newer)")
            return 'local'
        logger.info("Conflict resolved: using remote version (newer)")
        return 'remote'

    @classmethod
    def sync_model_data(cls, model_class, since_datetime=None):
        """Run simplified model sync and return sync stats."""
        stats = {
            'model': model_class.__name__,
            'updated': 0,
            'created': 0,
            'conflicts': 0,
            'errors': 0
        }

        try:
            if since_datetime:
                records = cls.get_model_updates_since(model_class, since_datetime)
                logger.info(
                    "Incremental sync for %s: %s records updated since %s",
                    model_class.__name__,
                    len(records),
                    since_datetime,
                )
            else:
                records = model_class.query.all()
                logger.info("Full sync for %s: %s records", model_class.__name__, len(records))

            stats['updated'] = len(records)

            for record in records:
                try:
                    checksum = cls.calculate_checksum({'id': record.id, 'model': model_class.__name__})
                    logger.debug("%s ID %s checksum: %s", model_class.__name__, record.id, checksum)
                except Exception as exc:
                    logger.error(
                        "Error processing %s ID %s: %s",
                        model_class.__name__,
                        getattr(record, 'id', None),
                        exc,
                    )
                    stats['errors'] += 1
        except Exception as exc:
            logger.error("Error syncing %s: %s", model_class.__name__, exc)
            stats['errors'] += 1

        return stats

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
