# -*- coding: utf-8 -*-
"""Frontend logs endpoints."""

import os

from flask import Blueprint, jsonify, request, current_app

from app.extensions import limiter
from app.resources.domain_errors import domain_error_response, message_response
from app.utils.decorators import admin_required
from app.services.exceptions import ValidationError
from app.services.logs_service import LogsService


blueprint = Blueprint('logs', __name__, url_prefix='/api/logs')

# Path to log file
LOG_FILE_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    'doc.log'
)


def _logs_service() -> LogsService:
    return LogsService(log_file_path=LOG_FILE_PATH, os_module=os)


@blueprint.route('/frontend', methods=['POST'])
@limiter.limit("10 per minute")
def receive_frontend_logs():
    """
    Receive logs from frontend and store them in doc.log
    ---
    tags:
      - Logs
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            logs:
              type: array
              items:
                type: object
                properties:
                  timestamp:
                    type: string
                  level:
                    type: string
                  source:
                    type: string
                  message:
                    type: string
                  data:
                    type: object
    responses:
      200:
        description: Logs stored successfully
      400:
        description: No logs provided
      500:
        description: Error storing logs
    """
    try:
        stored_count = _logs_service().store_frontend_logs(request.get_json(silent=True))
        return message_response(f'{stored_count} logs stored successfully', 200)
    except ValidationError as exc:
        return domain_error_response(exc)
    except Exception as exc:
        current_app.logger.error("Error storing frontend logs: %s", exc)
        return message_response('Error storing logs', 500)


@blueprint.route('/frontend', methods=['GET'])
@admin_required
def get_frontend_logs():
    """
    Get the last N lines of frontend logs
    ---
    tags:
      - Logs
    parameters:
      - name: lines
        in: query
        type: integer
        default: 100
        description: Number of lines to return
    responses:
      200:
        description: Logs retrieved successfully
      500:
        description: Error reading logs
    """
    try:
        lines = request.args.get('lines', 100, type=int)
        payload = _logs_service().get_frontend_logs(lines=lines or 100)
        return jsonify(payload), 200
    except Exception:
        return message_response('Error reading logs', 500)


@blueprint.route('/frontend', methods=['DELETE'])
@admin_required
def clear_frontend_logs():
    """
    Clear all frontend logs
    ---
    tags:
      - Logs
    responses:
      200:
        description: Logs cleared successfully
      500:
        description: Error clearing logs
    """
    try:
        _logs_service().clear_frontend_logs()
        return message_response('Logs cleared successfully', 200)
    except Exception:
        return message_response('Error clearing logs', 500)
