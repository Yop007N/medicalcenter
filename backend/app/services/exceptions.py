# -*- coding: utf-8 -*-
"""Shared service-layer exceptions."""


class ServiceError(Exception):
    """Base exception for domain/service failures."""

    def __init__(self, message, details=None):
        super().__init__(message)
        self.message = message
        self.details = details or {}


class ValidationError(ServiceError):
    """Raised when user input does not satisfy domain rules."""


class ResourceNotFoundError(ServiceError):
    """Raised when target entity does not exist."""


class AccessDeniedError(ServiceError):
    """Raised when current actor is not authorized."""


class ConflictError(ServiceError):
    """Raised when a resource state conflict is detected."""
