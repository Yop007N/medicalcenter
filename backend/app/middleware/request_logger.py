# -*- coding: utf-8 -*-
"""
Request logging middleware
"""

import time
import logging
from flask import request, g

logger = logging.getLogger(__name__)


def before_request():
    """Log request start"""
    g.start_time = time.time()
    logger.info(f"{request.method} {request.path} - Request started")


def after_request(response):
    """Log request completion"""
    if hasattr(g, 'start_time'):
        elapsed = time.time() - g.start_time
        logger.info(
            f"{request.method} {request.path} - "
            f"Status: {response.status_code} - "
            f"Duration: {elapsed:.3f}s"
        )
    return response


def register_request_logger(app):
    """Register request logging middleware"""
    app.before_request(before_request)
    app.after_request(after_request)
