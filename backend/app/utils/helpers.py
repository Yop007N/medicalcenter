# -*- coding: utf-8 -*-
"""
Helper utility functions
"""

from datetime import datetime, timedelta
import hashlib
import os


def generate_file_hash(file_content):
    """Generate SHA256 hash of file content"""
    return hashlib.sha256(file_content).hexdigest()


def generate_unique_filename(original_filename):
    """Generate unique filename with timestamp"""
    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    name, ext = os.path.splitext(original_filename)
    return f"{name}_{timestamp}{ext}"


def format_currency(amount, currency='ARS'):
    """Format currency for display"""
    # TODO: Implement proper currency formatting
    return f"{currency} {amount:,.2f}"


def calculate_age(date_of_birth):
    """Calculate age from date of birth"""
    today = datetime.today()
    return today.year - date_of_birth.year - (
        (today.month, today.day) < (date_of_birth.month, date_of_birth.day)
    )


def get_date_range(period='week'):
    """Get date range for common periods"""
    today = datetime.today()
    if period == 'today':
        return today, today
    elif period == 'week':
        start = today - timedelta(days=today.weekday())
        end = start + timedelta(days=6)
        return start, end
    elif period == 'month':
        start = today.replace(day=1)
        next_month = today.replace(day=28) + timedelta(days=4)
        end = next_month - timedelta(days=next_month.day)
        return start, end
    return today, today


def get_pagination_params(request, default_page=1, default_per_page=20, max_per_page=100):
    """
    Extract and validate pagination parameters from request

    Args:
        request: Flask request object
        default_page: Default page number
        default_per_page: Default items per page
        max_per_page: Maximum items per page

    Returns:
        tuple: (page, per_page) validated integers
    """
    from app.utils.constants import DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE

    page = request.args.get('page', default_page or DEFAULT_PAGE, type=int)
    per_page = request.args.get('per_page', default_per_page or DEFAULT_PAGE_SIZE, type=int)

    # Ensure per_page doesn't exceed maximum
    per_page = min(per_page, max_per_page or MAX_PAGE_SIZE)

    # Ensure positive values
    page = max(1, page)
    per_page = max(1, per_page)

    return page, per_page


def validate_required_fields(data, required_fields):
    """
    Validate that all required fields are present in data

    Args:
        data: Dictionary of data to validate
        required_fields: List of required field names

    Returns:
        tuple: (is_valid, missing_fields)
    """
    if not data:
        return False, required_fields

    missing = [field for field in required_fields if field not in data or data[field] is None]
    return len(missing) == 0, missing


def sanitize_search_input(search_term, max_length=100):
    """
    Sanitize search input to prevent SQL injection

    Args:
        search_term: User input search term
        max_length: Maximum allowed length

    Returns:
        str: Sanitized search term
    """
    if not search_term:
        return ''

    # Remove any SQL-like characters that could be dangerous
    dangerous_chars = [';', '--', '/*', '*/', 'xp_', 'sp_', 'DROP', 'DELETE', 'INSERT', 'UPDATE']

    sanitized = str(search_term)[:max_length]

    # Convert to lowercase for case-insensitive check
    lower_sanitized = sanitized.lower()

    # Check for dangerous patterns
    for dangerous in dangerous_chars:
        if dangerous.lower() in lower_sanitized:
            # Return empty string if dangerous pattern found
            return ''

    return sanitized.strip()
