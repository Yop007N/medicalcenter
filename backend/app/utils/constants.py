# -*- coding: utf-8 -*-
"""
Application constants
"""

# User roles
ROLE_ADMIN = 'admin'
ROLE_PROFESSIONAL = 'professional'
ROLE_PATIENT = 'patient'

ROLES = [ROLE_ADMIN, ROLE_PROFESSIONAL, ROLE_PATIENT]

# Appointment statuses
APPOINTMENT_SCHEDULED = 'scheduled'
APPOINTMENT_CONFIRMED = 'confirmed'
APPOINTMENT_COMPLETED = 'completed'
APPOINTMENT_CANCELLED = 'cancelled'
APPOINTMENT_NO_SHOW = 'no_show'

APPOINTMENT_STATUSES = [
    APPOINTMENT_SCHEDULED,
    APPOINTMENT_CONFIRMED,
    APPOINTMENT_COMPLETED,
    APPOINTMENT_CANCELLED,
    APPOINTMENT_NO_SHOW
]

# Budget statuses
BUDGET_DRAFT = 'draft'
BUDGET_SENT = 'sent'
BUDGET_ACCEPTED = 'accepted'
BUDGET_REJECTED = 'rejected'
BUDGET_EXPIRED = 'expired'

BUDGET_STATUSES = [
    BUDGET_DRAFT,
    BUDGET_SENT,
    BUDGET_ACCEPTED,
    BUDGET_REJECTED,
    BUDGET_EXPIRED
]

# Payment statuses
PAYMENT_PENDING = 'pending'
PAYMENT_COMPLETED = 'completed'
PAYMENT_FAILED = 'failed'
PAYMENT_REFUNDED = 'refunded'

PAYMENT_STATUSES = [
    PAYMENT_PENDING,
    PAYMENT_COMPLETED,
    PAYMENT_FAILED,
    PAYMENT_REFUNDED
]

# File types
FILE_LAB_RESULT = 'lab_result'
FILE_XRAY = 'xray'
FILE_MRI = 'mri'
FILE_CT_SCAN = 'ct_scan'
FILE_PRESCRIPTION = 'prescription'
FILE_OTHER = 'other'

FILE_TYPES = [
    FILE_LAB_RESULT,
    FILE_XRAY,
    FILE_MRI,
    FILE_CT_SCAN,
    FILE_PRESCRIPTION,
    FILE_OTHER
]

# Sync directions
SYNC_CLOUD_TO_LOCAL = 'cloud_to_local'
SYNC_LOCAL_TO_CLOUD = 'local_to_cloud'

# Pagination constants
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100
DEFAULT_PAGE = 1

# Cache TTL (Time To Live) in seconds
CACHE_TTL_SHORT = 300       # 5 minutes
CACHE_TTL_MEDIUM = 1800     # 30 minutes
CACHE_TTL_LONG = 3600       # 1 hour

# Password validation
PASSWORD_MIN_LENGTH = 8

# Appointment defaults
DEFAULT_APPOINTMENT_DURATION = 30  # minutes

# Rate limiting
RATE_LIMIT_LOGIN = "5 per minute"
RATE_LIMIT_GLOBAL_PER_DAY = "200 per day"
RATE_LIMIT_GLOBAL_PER_HOUR = "50 per hour"

# File upload
MAX_FILE_SIZE_MB = 50
