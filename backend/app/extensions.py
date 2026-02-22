# -*- coding: utf-8 -*-
"""
Flask extensions initialization
All extensions are initialized here and imported by the application factory
"""

import os
from urllib.parse import urlparse
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_marshmallow import Marshmallow
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_caching import Cache
from flask_socketio import SocketIO
from flask_migrate import Migrate
from celery import Celery
from redis import Redis


# SQLAlchemy ORM
db = SQLAlchemy()

# Database Migrations
migrate = Migrate()

# JWT Authentication
jwt = JWTManager()

# Marshmallow for serialization/validation
ma = Marshmallow()

# Cache
cache = Cache()

# Rate Limiter - Increased limits for development/testing
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["10000 per day", "1000 per hour", "100 per minute"],
    storage_uri=os.getenv('REDIS_URL', 'redis://localhost:6379/0')
)

# Celery for async tasks
celery = Celery(
    'medical_services',
    broker=os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0'),
    backend=os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
)


def _build_redis_client_kwargs():
    redis_url = os.getenv('REDIS_URL')
    if redis_url:
        parsed = urlparse(redis_url)
        if parsed.scheme.startswith('redis'):
            return {
                'host': parsed.hostname or 'localhost',
                'port': int(parsed.port or 6379),
                'db': int((parsed.path or '/0').lstrip('/')) if (parsed.path or '/0').lstrip('/').isdigit() else 0,
                'password': parsed.password,
                'decode_responses': True,
            }

    return {
        'host': os.getenv('REDIS_HOST', 'localhost'),
        'port': int(os.getenv('REDIS_PORT', '6379')),
        'db': int(os.getenv('REDIS_DB', '0')),
        'decode_responses': True,
    }


# Redis client for caching
redis_client = Redis(**_build_redis_client_kwargs())

# SocketIO for real-time communication
socketio = SocketIO(
    cors_allowed_origins="*",  # Configure based on environment
    async_mode='threading',  # Use threading mode for simplicity
    logger=True,
    engineio_logger=True
)
