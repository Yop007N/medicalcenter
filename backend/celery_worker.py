# -*- coding: utf-8 -*-
"""
Celery worker entry point
"""

from app import create_app
from app.extensions import celery

# Create Flask app to configure Celery
app = create_app()
app.app_context().push()

if __name__ == '__main__':
    # Start Celery worker
    celery.start()
