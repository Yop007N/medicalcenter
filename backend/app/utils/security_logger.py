# -*- coding: utf-8 -*-
"""
Security event logging utilities
"""

import logging
from datetime import datetime
from flask import request, has_request_context

# Create security logger
security_logger = logging.getLogger('security')


def log_login_attempt(email, success, reason=None):
    """
    Log login attempt (successful or failed)

    Args:
        email: User email attempting login
        success: Boolean indicating if login was successful
        reason: Failure reason if applicable
    """
    ip_address = get_client_ip()
    user_agent = get_user_agent()

    if success:
        security_logger.info(
            f'LOGIN_SUCCESS | Email: {email} | IP: {ip_address} | UA: {user_agent}'
        )
    else:
        security_logger.warning(
            f'LOGIN_FAILED | Email: {email} | Reason: {reason} | IP: {ip_address} | UA: {user_agent}'
        )


def log_unauthorized_access(resource, user_id=None, reason='Not authenticated'):
    """
    Log unauthorized access attempt

    Args:
        resource: Resource that was accessed
        user_id: User ID if known
        reason: Reason for denial
    """
    ip_address = get_client_ip()
    security_logger.warning(
        f'UNAUTHORIZED_ACCESS | Resource: {resource} | User: {user_id} | Reason: {reason} | IP: {ip_address}'
    )


def log_forbidden_action(action, user_id, reason='Insufficient permissions'):
    """
    Log forbidden action (authenticated but not authorized)

    Args:
        action: Action that was attempted
        user_id: User ID who attempted action
        reason: Reason for denial
    """
    ip_address = get_client_ip()
    security_logger.warning(
        f'FORBIDDEN_ACTION | Action: {action} | User: {user_id} | Reason: {reason} | IP: {ip_address}'
    )


def log_data_access(resource_type, resource_id, user_id, action='READ'):
    """
    Log access to sensitive data

    Args:
        resource_type: Type of resource (patient, medical_record, etc.)
        resource_id: ID of resource accessed
        user_id: User ID who accessed resource
        action: Type of action (READ, UPDATE, DELETE)
    """
    security_logger.info(
        f'DATA_ACCESS | Type: {resource_type} | ID: {resource_id} | User: {user_id} | Action: {action}'
    )


def log_password_change(user_id, initiated_by=None):
    """
    Log password change event

    Args:
        user_id: User ID whose password was changed
        initiated_by: User ID who initiated change (if different, e.g., admin reset)
    """
    ip_address = get_client_ip()
    initiator = initiated_by or user_id

    security_logger.info(
        f'PASSWORD_CHANGE | User: {user_id} | Initiated by: {initiator} | IP: {ip_address}'
    )


def log_account_lockout(user_id, reason='Too many failed attempts'):
    """
    Log account lockout event

    Args:
        user_id: User ID that was locked out
        reason: Reason for lockout
    """
    ip_address = get_client_ip()
    security_logger.warning(
        f'ACCOUNT_LOCKOUT | User: {user_id} | Reason: {reason} | IP: {ip_address}'
    )


def log_suspicious_activity(description, user_id=None, details=None):
    """
    Log suspicious activity

    Args:
        description: Description of suspicious activity
        user_id: User ID if known
        details: Additional details dictionary
    """
    ip_address = get_client_ip()
    security_logger.error(
        f'SUSPICIOUS_ACTIVITY | Description: {description} | User: {user_id} | IP: {ip_address} | Details: {details}'
    )


def log_data_export(user_id, data_type, record_count):
    """
    Log data export event

    Args:
        user_id: User who exported data
        data_type: Type of data exported
        record_count: Number of records exported
    """
    security_logger.info(
        f'DATA_EXPORT | User: {user_id} | Type: {data_type} | Records: {record_count}'
    )


def log_configuration_change(user_id, config_key, old_value, new_value):
    """
    Log system configuration change

    Args:
        user_id: User who made the change
        config_key: Configuration key that was changed
        old_value: Previous value
        new_value: New value
    """
    security_logger.warning(
        f'CONFIG_CHANGE | User: {user_id} | Key: {config_key} | Old: {old_value} | New: {new_value}'
    )


def get_client_ip():
    """Get client IP address from request"""
    if not has_request_context():
        return 'N/A'

    # Check for proxies
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0].strip()
    elif request.headers.get('X-Real-IP'):
        return request.headers.get('X-Real-IP')
    else:
        return request.remote_addr or 'Unknown'


def get_user_agent():
    """Get user agent from request"""
    if not has_request_context():
        return 'N/A'

    return request.headers.get('User-Agent', 'Unknown')[:200]  # Truncate
