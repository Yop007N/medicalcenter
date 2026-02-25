# -*- coding: utf-8 -*-
"""Shared domain error to HTTP mapping for legacy resources."""

from flask import jsonify

from app.services.exceptions import (
    AccessDeniedError,
    ConflictError,
    ResourceNotFoundError,
    ValidationError,
)

DOMAIN_ERROR_STATUS_MAP = {
    ValidationError: 400,
    AccessDeniedError: 403,
    ResourceNotFoundError: 404,
    ConflictError: 409,
}


def domain_error_response(error, default_status=400):
    """Return normalized API payload/status for service/domain errors."""
    status = DOMAIN_ERROR_STATUS_MAP.get(type(error), default_status)
    payload = {"msg": getattr(error, "message", str(error))}
    details = getattr(error, "details", None)
    if details:
        payload.update(details)
    return jsonify(payload), status


def message_response(message, status=400, details=None):
    """Return a normalized message payload for non-domain exceptions."""
    payload = {"msg": message}
    if details:
        payload.update(details)
    return jsonify(payload), status
