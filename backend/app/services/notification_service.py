# -*- coding: utf-8 -*-
"""
Notification Service - Handle all types of notifications
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import logging
import os

logger = logging.getLogger(__name__)


class NotificationService:
    """Handle email, SMS, and push notifications"""

    # Email configuration (local SMTP for now)
    SMTP_HOST = 'localhost'
    SMTP_PORT = 1025  # MailHog/local testing
    SMTP_USER = 'noreply@medical-services.local'
    SMTP_FROM = 'Medical Services <noreply@medical-services.local>'

    @staticmethod
    def send_email(to_email, subject, body, html_body=None):
        """
        Send email notification

        Args:
            to_email: Recipient email address
            subject: Email subject
            body: Plain text body
            html_body: Optional HTML body

        Returns:
            bool: True if sent successfully
        """
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = NotificationService.SMTP_FROM
            msg['To'] = to_email

            # Add text part
            text_part = MIMEText(body, 'plain', 'utf-8')
            msg.attach(text_part)

            # Add HTML part if provided
            if html_body:
                html_part = MIMEText(html_body, 'html', 'utf-8')
                msg.attach(html_part)

            # Send email (local SMTP for now)
            # In production, use proper SMTP server or service like SendGrid
            logger.info(f"Sending email to {to_email}: {subject}")
            # For local development, just log
            logger.info(f"Email body: {body}")

            return True

        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return False

    @staticmethod
    def send_appointment_reminder(appointment):
        """
        Send appointment reminder email

        Args:
            appointment: Appointment model instance

        Returns:
            bool: True if sent successfully
        """
        from app.models.patient import Patient
        from app.models.professional import Professional

        try:
            patient = Patient.query.get(appointment.patient_id)
            professional = Professional.query.get(appointment.professional_id)

            if not patient or not professional:
                logger.error(f"Patient or professional not found for appointment {appointment.id}")
                return False

            subject = f"Recordatorio de Cita - {appointment.appointment_date.strftime('%d/%m/%Y %H:%M')}"

            body = f"""
Estimado/a {patient.first_name} {patient.last_name},

Le recordamos su cita médica programada para:

Fecha y hora: {appointment.appointment_date.strftime('%d de %B de %Y a las %H:%M')}
Profesional: Dr/a. {professional.first_name} {professional.last_name}
Especialidad: {professional.specialty}
Motivo: {appointment.reason or 'Consulta general'}

Por favor, llegue 10 minutos antes de su hora programada.

Si necesita cancelar o reprogramar, contáctenos con al menos 24 horas de anticipación.

Saludos cordiales,
Medical Services
            """.strip()

            return NotificationService.send_email(
                to_email=patient.email,
                subject=subject,
                body=body
            )

        except Exception as e:
            logger.error(f"Failed to send appointment reminder: {str(e)}")
            return False

    @staticmethod
    def send_appointment_confirmation(appointment):
        """
        Send appointment confirmation email

        Args:
            appointment: Appointment model instance

        Returns:
            bool: True if sent successfully
        """
        from app.models.patient import Patient
        from app.models.professional import Professional

        try:
            patient = Patient.query.get(appointment.patient_id)
            professional = Professional.query.get(appointment.professional_id)

            if not patient or not professional:
                logger.error(f"Patient or professional not found for appointment {appointment.id}")
                return False

            subject = f"Confirmación de Cita - {appointment.appointment_date.strftime('%d/%m/%Y %H:%M')}"

            body = f"""
Estimado/a {patient.first_name} {patient.last_name},

Su cita médica ha sido confirmada:

Fecha y hora: {appointment.appointment_date.strftime('%d de %B de %Y a las %H:%M')}
Profesional: Dr/a. {professional.first_name} {professional.last_name}
Especialidad: {professional.specialty}
Motivo: {appointment.reason or 'Consulta general'}
Estado: {appointment.status}

Gracias por confirmar su asistencia.

Saludos cordiales,
Medical Services
            """.strip()

            return NotificationService.send_email(
                to_email=patient.email,
                subject=subject,
                body=body
            )

        except Exception as e:
            logger.error(f"Failed to send appointment confirmation: {str(e)}")
            return False

    @staticmethod
    def send_budget_notification(budget, patient=None):
        """
        Send budget notification to patient

        Args:
            budget: Budget model instance
            patient: Patient model instance (optional)

        Returns:
            bool: True if sent successfully
        """
        from app.models.patient import Patient
        from app.models.professional import Professional

        try:
            if not patient:
                patient = Patient.query.get(budget.patient_id)

            professional = Professional.query.get(budget.created_by)

            if not patient or not professional:
                logger.error(f"Patient or professional not found for budget {budget.id}")
                return False

            subject = f"Nuevo Presupuesto - {budget.title}"

            body = f"""
Estimado/a {patient.first_name} {patient.last_name},

Ha recibido un nuevo presupuesto para su tratamiento:

Título: {budget.title}
Descripción: {budget.description or 'Sin descripción'}
Monto Total: {budget.currency} {budget.total_amount:,.2f}
Válido hasta: {budget.valid_until.strftime('%d/%m/%Y') if budget.valid_until else 'Sin fecha límite'}

Profesional: Dr/a. {professional.first_name} {professional.last_name}

Por favor, revise el presupuesto en su portal de paciente.

Saludos cordiales,
Medical Services
            """.strip()

            return NotificationService.send_email(
                to_email=patient.email,
                subject=subject,
                body=body
            )

        except Exception as e:
            logger.error(f"Failed to send budget notification: {str(e)}")
            return False

    @staticmethod
    def send_payment_confirmation(payment):
        """
        Send payment confirmation email

        Args:
            payment: Payment model instance

        Returns:
            bool: True if sent successfully
        """
        from app.models.budget import Budget

        try:
            budget = None
            if payment.budget_id:
                budget = Budget.query.get(payment.budget_id)

            if not budget:
                logger.warning(f"No budget found for payment {payment.id}")
                return False

            from app.models.patient import Patient
            patient = Patient.query.get(budget.patient_id)

            if not patient:
                logger.error(f"Patient not found for budget {budget.id}")
                return False

            subject = f"Confirmación de Pago - Recibo #{payment.transaction_id}"

            body = f"""
Estimado/a {patient.first_name} {patient.last_name},

Su pago ha sido procesado exitosamente:

Número de Transacción: {payment.transaction_id}
Monto: {payment.currency} {payment.amount:,.2f}
Método de Pago: {payment.payment_method}
Fecha: {payment.payment_date.strftime('%d/%m/%Y %H:%M') if payment.payment_date else 'Pendiente'}
Estado: {payment.payment_status}

Concepto: {budget.title}

Gracias por su pago.

Saludos cordiales,
Medical Services
            """.strip()

            return NotificationService.send_email(
                to_email=patient.email,
                subject=subject,
                body=body
            )

        except Exception as e:
            logger.error(f"Failed to send payment confirmation: {str(e)}")
            return False

    @staticmethod
    def send_sms(to_phone, message):
        """
        Send SMS notification via configured provider.

        Args:
            to_phone: Phone number
            message: SMS message

        Returns:
            bool: True if accepted by provider
        """
        if not to_phone or not str(to_phone).strip():
            logger.warning("SMS not sent: empty phone")
            return False
        if not message or not str(message).strip():
            logger.warning("SMS not sent: empty message")
            return False

        provider = os.getenv('NOTIFICATION_SMS_PROVIDER', 'log').strip().lower()

        if provider in {'log', 'disabled'}:
            logger.info(f"SMS ({provider}) to {to_phone}: {message}")
            return True

        logger.error(f"Unsupported SMS provider: {provider}")
        return False

    @staticmethod
    def send_push_notification(user_id, title, message):
        """
        Send push notification via configured provider.

        Args:
            user_id: User ID
            title: Notification title
            message: Notification message

        Returns:
            bool: True if accepted by provider
        """
        if not user_id:
            logger.warning("Push notification not sent: empty user_id")
            return False
        if not title or not str(title).strip():
            logger.warning("Push notification not sent: empty title")
            return False
        if not message or not str(message).strip():
            logger.warning("Push notification not sent: empty message")
            return False

        provider = os.getenv('NOTIFICATION_PUSH_PROVIDER', 'log').strip().lower()

        if provider in {'log', 'disabled'}:
            logger.info(f"Push ({provider}) to user {user_id}: {title} - {message}")
            return True

        logger.error(f"Unsupported push provider: {provider}")
        return False
