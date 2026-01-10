# -*- coding: utf-8 -*-
"""
Celery async tasks
"""

from app.tasks.sync_tasks import (
    sync_all_data_task,
    sync_periodic_task,
    sync_daily_full_task,
    sync_files_on_demand_task,
    verify_data_integrity_task,
    cleanup_old_sync_logs_task
)
from app.tasks.notification_tasks import (
    send_appointment_reminder_task,
    send_appointment_confirmation_task,
    send_budget_notification_task,
    send_payment_confirmation_task,
    send_email_task,
    send_push_notification_task,
    send_daily_appointment_reminders_task
)
from app.tasks.backup_tasks import (
    backup_database_task,
    backup_files_task,
    backup_all_task,
    cleanup_old_backups_task,
    get_backup_status_task
)

__all__ = [
    # Sync tasks
    'sync_all_data_task',
    'sync_periodic_task',
    'sync_daily_full_task',
    'sync_files_on_demand_task',
    'verify_data_integrity_task',
    'cleanup_old_sync_logs_task',
    # Notification tasks
    'send_appointment_reminder_task',
    'send_appointment_confirmation_task',
    'send_budget_notification_task',
    'send_payment_confirmation_task',
    'send_email_task',
    'send_push_notification_task',
    'send_daily_appointment_reminders_task',
    # Backup tasks
    'backup_database_task',
    'backup_files_task',
    'backup_all_task',
    'cleanup_old_backups_task',
    'get_backup_status_task'
]
