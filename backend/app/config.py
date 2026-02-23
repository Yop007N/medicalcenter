# -*- coding: utf-8 -*-
"""
Configuration settings for different environments
"""

import os
from datetime import timedelta


def _parse_bool(raw_value, default=False):
    if raw_value is None:
        return default
    return str(raw_value).strip().lower() in {'1', 'true', 'yes', 'on'}


def _parse_csv(raw_value, default=None):
    if raw_value is None:
        return list(default or [])
    values = [item.strip() for item in str(raw_value).split(',')]
    return [item for item in values if item]


class Config:
    """Base configuration"""

    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = False
    TESTING = False

    # SQLAlchemy
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False

    # JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    # Use 24 hours for access token as frontend lacks refresh logic, but we have revocation now.
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=7)
    JWT_IDENTITY_CLAIM = 'sub'  # Claim name for identity
    JWT_ERROR_MESSAGE_KEY = 'msg'  # Key for error messages

    # Redis
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

    # Celery
    CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
    CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')

    # File Upload (using constants)
    from app.utils.constants import MAX_FILE_SIZE_MB
    MAX_CONTENT_LENGTH = MAX_FILE_SIZE_MB * 1024 * 1024
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'storage/files')

    # S3/Storage
    S3_BUCKET = os.getenv('S3_BUCKET', '')
    S3_ACCESS_KEY = os.getenv('S3_ACCESS_KEY', '')
    S3_SECRET_KEY = os.getenv('S3_SECRET_KEY', '')
    S3_REGION = os.getenv('S3_REGION', 'us-east-1')

    # CORS Configuration
    CORS_ORIGINS = _parse_csv(
        os.getenv('CORS_ORIGINS', 'http://localhost:4200,http://localhost:3000')
    )
    CORS_ALLOW_CREDENTIALS = _parse_bool(
        os.getenv('CORS_ALLOW_CREDENTIALS'),
        default=True
    )
    CORS_MAX_AGE = int(os.getenv('CORS_MAX_AGE', '3600'))


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL',
        'postgresql://postgres:postgres@localhost:5432/medical_services_dev'
    )
    SQLALCHEMY_ECHO = True

    # Disable rate limiting in development to avoid Redis dependency
    RATELIMIT_ENABLED = False


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False

    # CRITICAL: Force environment variables in production (no defaults)
    # Using getenv with check in __init__ to avoid import errors
    SECRET_KEY = os.getenv('SECRET_KEY')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
    CORS_ORIGINS = _parse_csv(os.getenv('CORS_ORIGINS', ''))
    CORS_ALLOW_CREDENTIALS = _parse_bool(
        os.getenv('CORS_ALLOW_CREDENTIALS'),
        default=False
    )

    def __init__(self):
        super().__init__()
        # Validate that critical env vars are set when using production config
        if not self.SECRET_KEY:
            raise ValueError('SECRET_KEY environment variable must be set in production')
        if not self.JWT_SECRET_KEY:
            raise ValueError('JWT_SECRET_KEY environment variable must be set in production')
        if not self.SQLALCHEMY_DATABASE_URI:
            raise ValueError('DATABASE_URL environment variable must be set in production')
        if not self.CORS_ORIGINS:
            raise ValueError('CORS_ORIGINS environment variable must be set in production')

    # Security
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'


class TestConfig(Config):
    """Testing configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=5)

    # Disable rate limiting for tests
    RATELIMIT_ENABLED = False


config_by_name = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'test': TestConfig
}
