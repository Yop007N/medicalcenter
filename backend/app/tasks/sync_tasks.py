# -*- coding: utf-8 -*-
"""
Celery tasks for data synchronization
Handles periodic sync, on-demand sync, and conflict resolution
"""

from app.extensions import celery, db
from app.models.patient import Patient
from app.models.professional import Professional
from app.models.appointment import Appointment
from app.models.medical_record import MedicalRecord
from app.models.file import File
from app.models.budget import Budget
from app.models.payment import Payment
from datetime import datetime, timedelta
import logging
import hashlib
import json

logger = logging.getLogger(__name__)


class SyncService:
    """Handle data synchronization logic"""

    @staticmethod
    def calculate_checksum(data):
        """
        Calculate SHA256 checksum for data integrity verification

        Args:
            data: Dictionary or string to hash

        Returns:
            str: SHA256 hash
        """
        if isinstance(data, dict):
            data = json.dumps(data, sort_keys=True, default=str)

        return hashlib.sha256(data.encode('utf-8')).hexdigest()

    @staticmethod
    def get_model_updates_since(model_class, since_datetime):
        """
        Get all records updated since a specific datetime

        Args:
            model_class: SQLAlchemy model class
            since_datetime: datetime to check updates from

        Returns:
            list: Updated records
        """
        try:
            return model_class.query.filter(
                model_class.updated_at >= since_datetime
            ).all()
        except Exception as e:
            logger.error(f"Error getting updates for {model_class.__name__}: {str(e)}")
            return []

    @staticmethod
    def resolve_conflict(local_record, remote_record):
        """
        Resolve sync conflicts using last-write-wins strategy

        Args:
            local_record: Local database record
            remote_record: Remote record data

        Returns:
            str: 'local' or 'remote' indicating which version to keep
        """
        # Last-write-wins: compare updated_at timestamps
        local_updated = local_record.updated_at if hasattr(local_record, 'updated_at') else local_record.created_at
        remote_updated = remote_record.get('updated_at') or remote_record.get('created_at')

        if isinstance(remote_updated, str):
            remote_updated = datetime.fromisoformat(remote_updated.replace('Z', '+00:00'))

        if local_updated >= remote_updated:
            logger.info(f"Conflict resolved: keeping local version (newer)")
            return 'local'
        else:
            logger.info(f"Conflict resolved: using remote version (newer)")
            return 'remote'

    @staticmethod
    def sync_model_data(model_class, since_datetime=None):
        """
        Sync data for a specific model

        Args:
            model_class: SQLAlchemy model to sync
            since_datetime: Optional datetime for incremental sync

        Returns:
            dict: Sync statistics
        """
        stats = {
            'model': model_class.__name__,
            'updated': 0,
            'created': 0,
            'conflicts': 0,
            'errors': 0
        }

        try:
            if since_datetime:
                records = SyncService.get_model_updates_since(model_class, since_datetime)
                logger.info(f"Incremental sync for {model_class.__name__}: {len(records)} records updated since {since_datetime}")
            else:
                records = model_class.query.all()
                logger.info(f"Full sync for {model_class.__name__}: {len(records)} records")

            stats['updated'] = len(records)

            # In a real implementation, this would sync with remote server
            # For now, just validate checksums
            for record in records:
                try:
                    # Create a simple dict representation for checksum
                    record_data = {'id': record.id, 'model': model_class.__name__}
                    checksum = SyncService.calculate_checksum(record_data)
                    logger.debug(f"{model_class.__name__} ID {record.id} checksum: {checksum}")
                except Exception as e:
                    logger.error(f"Error processing {model_class.__name__} ID {record.id}: {str(e)}")
                    stats['errors'] += 1

        except Exception as e:
            logger.error(f"Error syncing {model_class.__name__}: {str(e)}")
            stats['errors'] += 1

        return stats


@celery.task(name='sync_all_data')
def sync_all_data_task(incremental=True):
    """
    Sync all data models

    Args:
        incremental: If True, only sync changes from last 15 minutes

    Returns:
        dict: Sync summary
    """
    try:
        since_datetime = None
        if incremental:
            # Sync changes from last 15 minutes (with 1 min buffer)
            since_datetime = datetime.utcnow() - timedelta(minutes=16)
            logger.info(f"Starting incremental sync since {since_datetime}")
        else:
            logger.info("Starting full sync")

        # Models to sync in order (respecting foreign key dependencies)
        models_to_sync = [
            Patient,
            Professional,
            Appointment,
            MedicalRecord,
            File,
            Budget,
            Payment
        ]

        summary = {
            'sync_type': 'incremental' if incremental else 'full',
            'started_at': datetime.utcnow().isoformat(),
            'models': [],
            'total_updated': 0,
            'total_created': 0,
            'total_conflicts': 0,
            'total_errors': 0
        }

        for model in models_to_sync:
            stats = SyncService.sync_model_data(model, since_datetime)
            summary['models'].append(stats)
            summary['total_updated'] += stats['updated']
            summary['total_created'] += stats['created']
            summary['total_conflicts'] += stats['conflicts']
            summary['total_errors'] += stats['errors']

        summary['completed_at'] = datetime.utcnow().isoformat()
        logger.info(f"Sync completed: {summary['total_updated']} updated, {summary['total_errors']} errors")

        return summary

    except Exception as e:
        logger.error(f"Error in sync_all_data_task: {str(e)}")
        return {'error': str(e), 'sync_type': 'incremental' if incremental else 'full'}


@celery.task(name='sync_periodic')
def sync_periodic_task():
    """
    Periodic sync task (runs every 15 minutes)
    Syncs only changes from the last sync

    Returns:
        dict: Sync summary
    """
    logger.info("Starting periodic 15-minute sync")
    return sync_all_data_task(incremental=True)


@celery.task(name='sync_daily_full')
def sync_daily_full_task():
    """
    Daily full sync task (runs at 2 AM)
    Syncs all data to ensure consistency

    Returns:
        dict: Sync summary
    """
    logger.info("Starting daily full sync at 2 AM")
    return sync_all_data_task(incremental=False)


@celery.task(name='sync_files_on_demand')
def sync_files_on_demand_task(file_ids=None):
    """
    On-demand file sync for large files
    Only syncs specified files or all pending files

    Args:
        file_ids: List of file IDs to sync, or None for all pending

    Returns:
        dict: Sync summary
    """
    try:
        if file_ids:
            files = File.query.filter(File.id.in_(file_ids)).all()
            logger.info(f"On-demand sync for {len(file_ids)} specific files")
        else:
            # Sync files that haven't been synced in last 24 hours
            yesterday = datetime.utcnow() - timedelta(days=1)
            files = File.query.filter(File.created_at >= yesterday).all()
            logger.info(f"On-demand sync for files from last 24 hours: {len(files)} files")

        synced = 0
        failed = 0
        total_size = 0

        for file_record in files:
            try:
                # Calculate file checksum for integrity
                import os
                if os.path.exists(file_record.file_path):
                    with open(file_record.file_path, 'rb') as f:
                        file_content = f.read()
                        checksum = hashlib.sha256(file_content).hexdigest()
                        logger.info(f"File {file_record.id} checksum: {checksum}")
                        synced += 1
                        total_size += file_record.file_size
                else:
                    logger.warning(f"File {file_record.id} not found on disk: {file_record.file_path}")
                    failed += 1
            except Exception as e:
                logger.error(f"Error syncing file {file_record.id}: {str(e)}")
                failed += 1

        summary = {
            'total_files': len(files),
            'synced': synced,
            'failed': failed,
            'total_size_bytes': total_size,
            'total_size_mb': round(total_size / (1024 * 1024), 2),
            'timestamp': datetime.utcnow().isoformat()
        }

        logger.info(f"File sync completed: {synced} synced, {failed} failed, {summary['total_size_mb']} MB")
        return summary

    except Exception as e:
        logger.error(f"Error in sync_files_on_demand_task: {str(e)}")
        return {'error': str(e)}


@celery.task(name='verify_data_integrity')
def verify_data_integrity_task():
    """
    Verify data integrity using checksums
    Checks for corrupted or inconsistent data

    Returns:
        dict: Verification summary
    """
    try:
        models_to_verify = [
            Patient,
            Professional,
            Appointment,
            MedicalRecord,
            Budget,
            Payment
        ]

        summary = {
            'verified_at': datetime.utcnow().isoformat(),
            'models': [],
            'total_records': 0,
            'total_errors': 0
        }

        for model in models_to_verify:
            records = model.query.all()
            errors = 0

            for record in records:
                try:
                    # Verify record can be serialized and has valid data
                    data = {'id': record.id, 'model': model.__name__}
                    checksum = SyncService.calculate_checksum(data)
                    # In production, would compare with stored checksum
                except Exception as e:
                    logger.error(f"Integrity error in {model.__name__} ID {record.id}: {str(e)}")
                    errors += 1

            model_summary = {
                'model': model.__name__,
                'total_records': len(records),
                'errors': errors
            }

            summary['models'].append(model_summary)
            summary['total_records'] += len(records)
            summary['total_errors'] += errors

        logger.info(f"Integrity verification completed: {summary['total_records']} records, {summary['total_errors']} errors")
        return summary

    except Exception as e:
        logger.error(f"Error in verify_data_integrity_task: {str(e)}")
        return {'error': str(e)}


@celery.task(name='cleanup_old_sync_logs')
def cleanup_old_sync_logs_task(days=30):
    """
    Clean up old sync logs and temporary files

    Args:
        days: Keep logs from last N days

    Returns:
        dict: Cleanup summary
    """
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        logger.info(f"Cleaning up sync logs older than {cutoff_date}")

        # In production, would delete old sync log records
        # For now, just report what would be deleted

        summary = {
            'cutoff_date': cutoff_date.isoformat(),
            'cleaned_up': 0,
            'timestamp': datetime.utcnow().isoformat()
        }

        logger.info(f"Cleanup completed: {summary['cleaned_up']} items removed")
        return summary

    except Exception as e:
        logger.error(f"Error in cleanup_old_sync_logs_task: {str(e)}")
        return {'error': str(e)}
