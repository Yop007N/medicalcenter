# -*- coding: utf-8 -*-
"""
Global error handlers
"""

from flask import jsonify
from werkzeug.exceptions import HTTPException
from sqlalchemy.exc import SQLAlchemyError
from marshmallow import ValidationError


def handle_http_exception(error):
    """Handle HTTP exceptions"""
    response = {
        'error': error.name,
        'message': error.description,
        'status_code': error.code
    }
    return jsonify(response), error.code


def handle_validation_error(error):
    """Handle Marshmallow validation errors"""
    response = {
        'error': 'Validation Error',
        'message': error.messages,
        'status_code': 400
    }
    return jsonify(response), 400


def handle_database_error(error):
    """Handle database errors"""
    from flask import current_app
    current_app.logger.error(f'Database error: {str(error)}', exc_info=True)

    response = {
        'error': 'Database Error',
        'message': 'An error occurred while processing your request',
        'status_code': 500
    }
    return jsonify(response), 500


def handle_generic_error(error):
    """Handle generic exceptions"""
    from flask import current_app
    current_app.logger.error(f'Unhandled exception: {str(error)}', exc_info=True)

    response = {
        'error': 'Internal Server Error',
        'message': 'An unexpected error occurred' if not current_app.debug else str(error),
        'status_code': 500
    }
    return jsonify(response), 500


def register_error_handlers(app):
    """Register all error handlers with the app"""
    app.register_error_handler(HTTPException, handle_http_exception)
    app.register_error_handler(ValidationError, handle_validation_error)
    app.register_error_handler(SQLAlchemyError, handle_database_error)
    app.register_error_handler(Exception, handle_generic_error)
