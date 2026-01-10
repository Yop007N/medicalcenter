# -*- coding: utf-8 -*-
"""
Input validation utilities
"""

import re
from datetime import datetime
from app.utils.constants import PASSWORD_MIN_LENGTH


def validate_email(email):
    """
    Validate email format

    Args:
        email: Email string to validate

    Returns:
        bool: True if valid email format
    """
    if not email:
        return False

    # RFC 5322 simplified email regex
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_phone(phone):
    """
    Validate phone number format (Paraguay)

    Args:
        phone: Phone string to validate

    Returns:
        bool: True if valid phone format

    Examples:
        Valid: +595981123456, 0981123456, 981123456
    """
    if not phone:
        return False

    # Remove spaces and dashes
    cleaned = phone.replace(' ', '').replace('-', '')

    # Paraguay phone patterns
    patterns = [
        r'^\+595\d{9}$',      # +595981123456
        r'^0\d{9}$',          # 0981123456
        r'^\d{9}$',           # 981123456
        r'^\d{6,7}$'          # Landline 123456 or 1234567
    ]

    return any(re.match(pattern, cleaned) for pattern in patterns)


def validate_password_strength(password):
    """
    Validate password strength

    Requirements:
    - Minimum PASSWORD_MIN_LENGTH characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit

    Args:
        password: Password string to validate

    Returns:
        tuple: (is_valid, error_message)
    """
    if not password:
        return False, 'Password is required'

    if len(password) < PASSWORD_MIN_LENGTH:
        return False, f'Password must be at least {PASSWORD_MIN_LENGTH} characters long'

    if not re.search(r'[A-Z]', password):
        return False, 'Password must contain at least one uppercase letter'

    if not re.search(r'[a-z]', password):
        return False, 'Password must contain at least one lowercase letter'

    if not re.search(r'\d', password):
        return False, 'Password must contain at least one number'

    return True, None


def validate_date_format(date_str, format='%Y-%m-%d'):
    """
    Validate and parse date string

    Args:
        date_str: Date string to validate
        format: Expected date format (default: YYYY-MM-DD)

    Returns:
        tuple: (is_valid, parsed_date or None)
    """
    if not date_str:
        return False, None

    try:
        parsed_date = datetime.strptime(date_str, format)
        return True, parsed_date
    except ValueError:
        return False, None


def validate_date_range(date_from, date_to):
    """
    Validate that date_from is before date_to

    Args:
        date_from: Start date
        date_to: End date

    Returns:
        bool: True if valid range
    """
    if not date_from or not date_to:
        return False

    return date_from <= date_to


def validate_required_fields(data, required_fields):
    """
    Validate that all required fields are present and not empty

    Args:
        data: Dictionary of data to validate
        required_fields: List of required field names

    Returns:
        tuple: (is_valid, missing_fields)
    """
    if not data:
        return False, required_fields

    missing = []
    for field in required_fields:
        if field not in data or data[field] is None or data[field] == '':
            missing.append(field)

    return len(missing) == 0, missing


def validate_positive_number(value, field_name='value'):
    """
    Validate that a number is positive

    Args:
        value: Number to validate
        field_name: Name of field for error message

    Returns:
        tuple: (is_valid, error_message)
    """
    try:
        num = float(value)
        if num <= 0:
            return False, f'{field_name} must be a positive number'
        return True, None
    except (TypeError, ValueError):
        return False, f'{field_name} must be a valid number'


def validate_in_range(value, min_val, max_val, field_name='value'):
    """
    Validate that a value is within a range

    Args:
        value: Value to validate
        min_val: Minimum allowed value
        max_val: Maximum allowed value
        field_name: Name of field for error message

    Returns:
        tuple: (is_valid, error_message)
    """
    try:
        num = float(value)
        if num < min_val or num > max_val:
            return False, f'{field_name} must be between {min_val} and {max_val}'
        return True, None
    except (TypeError, ValueError):
        return False, f'{field_name} must be a valid number'


def validate_choice(value, valid_choices, field_name='value'):
    """
    Validate that value is in a list of valid choices

    Args:
        value: Value to validate
        valid_choices: List of valid options
        field_name: Name of field for error message

    Returns:
        tuple: (is_valid, error_message)
    """
    if value not in valid_choices:
        return False, f'{field_name} must be one of: {", ".join(str(c) for c in valid_choices)}'
    return True, None


def sanitize_string_input(input_str, max_length=255):
    """
    Sanitize string input to prevent injection attacks

    Args:
        input_str: String to sanitize
        max_length: Maximum allowed length

    Returns:
        str: Sanitized string
    """
    if not input_str:
        return ''

    # Remove any null bytes
    sanitized = str(input_str).replace('\x00', '')

    # Truncate to max length
    sanitized = sanitized[:max_length]

    # Strip leading/trailing whitespace
    return sanitized.strip()


def validate_file_extension(filename, allowed_extensions):
    """
    Validate file extension

    Args:
        filename: Filename to validate
        allowed_extensions: Set/list of allowed extensions (e.g., {'pdf', 'jpg'})

    Returns:
        tuple: (is_valid, error_message)
    """
    if not filename:
        return False, 'Filename is required'

    if '.' not in filename:
        return False, 'File must have an extension'

    extension = filename.rsplit('.', 1)[1].lower()

    if extension not in allowed_extensions:
        return False, f'File extension must be one of: {", ".join(allowed_extensions)}'

    return True, None
