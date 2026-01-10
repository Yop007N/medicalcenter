# -*- coding: utf-8 -*-
"""
Celery tasks for notifications
"""

from app.extensions import celery
from app.services.notification_service import NotificationService
from app.models.appointment import Appointment
from app.models.budget import Budget
from app.models.payment import Payment
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


@celery.task(name='send_appointment_reminder')
def send_appointment_reminder_task(appointment_id):
    """
    Send appointment reminder notification

    Args:
        appointment_id: Appointment ID to send reminder for

    Returns:
        bool: True if sent successfully
    """
    try:
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            logger.error(f"Appointment {appointment_id} not found")
            return False

        return NotificationService.send_appointment_reminder(appointment)

    except Exception as e:
        logger.error(f"Error sending appointment reminder: {str(e)}")
        return False


@celery.task(name='send_appointment_confirmation')
def send_appointment_confirmation_task(appointment_id):
    """
    Send appointment confirmation notification

    Args:
        appointment_id: Appointment ID to send confirmation for

    Returns:
        bool: True if sent successfully
    """
    try:
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            logger.error(f"Appointment {appointment_id} not found")
            return False

        return NotificationService.send_appointment_confirmation(appointment)

    except Exception as e:
        logger.error(f"Error sending appointment confirmation: {str(e)}")
        return False


@celery.task(name='send_budget_notification')
def send_budget_notification_task(budget_id):
    """
    Send budget notification to patient

    Args:
        budget_id: Budget ID to send notification for

    Returns:
        bool: True if sent successfully
    """
    try:
        budget = Budget.query.get(budget_id)
        if not budget:
            logger.error(f"Budget {budget_id} not found")
            return False

        return NotificationService.send_budget_notification(budget)

    except Exception as e:
        logger.error(f"Error sending budget notification: {str(e)}")
        return False


@celery.task(name='send_payment_confirmation')
def send_payment_confirmation_task(payment_id):
    """
    Send payment confirmation to patient

    Args:
        payment_id: Payment ID to send confirmation for

    Returns:
        bool: True if sent successfully
    """
    try:
        payment = Payment.query.get(payment_id)
        if not payment:
            logger.error(f"Payment {payment_id} not found")
            return False

        return NotificationService.send_payment_confirmation(payment)

    except Exception as e:
        logger.error(f"Error sending payment confirmation: {str(e)}")
        return False


@celery.task(name='send_email')
def send_email_task(to, subject, body, html_body=None):
    """
    Send email notification

    Args:
        to: Recipient email
        subject: Email subject
        body: Email body (plain text)
        html_body: Optional HTML body

    Returns:
        bool: True if sent successfully
    """
    try:
        return NotificationService.send_email(to, subject, body, html_body)

    except Exception as e:
        logger.error(f"Error sending email: {str(e)}")
        return False


@celery.task(name='send_push_notification')
def send_push_notification_task(user_id, title, message):
    """
    Send push notification to mobile device

    Args:
        user_id: User ID to send notification to
        title: Notification title
        message: Notification message

    Returns:
        bool: True if sent successfully
    """
    try:
        return NotificationService.send_push_notification(user_id, title, message)

    except Exception as e:
        logger.error(f"Error sending push notification: {str(e)}")
        return False


@celery.task(name='send_daily_appointment_reminders')
def send_daily_appointment_reminders_task():
    """
    Send reminders for all appointments scheduled for tomorrow

    This task should be run daily (via cron/beat)

    Returns:
        dict: Summary of reminders sent
    """
    try:
        tomorrow = datetime.utcnow() + timedelta(days=1)
        start_of_day = tomorrow.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = tomorrow.replace(hour=23, minute=59, second=59, microsecond=999999)

        # Get all confirmed appointments for tomorrow
        appointments = Appointment.query.filter(
            Appointment.appointment_date >= start_of_day,
            Appointment.appointment_date <= end_of_day,
            Appointment.status.in_(['scheduled', 'confirmed'])
        ).all()

        sent = 0
        failed = 0

        for appointment in appointments:
            try:
                if NotificationService.send_appointment_reminder(appointment):
                    sent += 1
                else:
                    failed += 1
            except Exception as e:
                logger.error(f"Error sending reminder for appointment {appointment.id}: {str(e)}")
                failed += 1

        result = {
            'total_appointments': len(appointments),
            'sent': sent,
            'failed': failed,
            'date': tomorrow.strftime('%Y-%m-%d')
        }

        logger.info(f"Daily reminders sent: {result}")
        return result

    except Exception as e:
        logger.error(f"Error in daily appointment reminders task: {str(e)}")
        return {'error': str(e)}
