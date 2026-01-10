# -*- coding: utf-8 -*-
"""
Frontend Logs endpoints - Receives and stores frontend debug logs
"""

from flask import Blueprint, jsonify, request, current_app
from datetime import datetime
import os
import json
from app.extensions import limiter


blueprint = Blueprint('logs', __name__, url_prefix='/api/logs')

# Path to log file
LOG_FILE_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    'doc.log'
)


@blueprint.route('/frontend', methods=['POST'])
@limiter.exempt
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
        data = request.get_json()
        logs = data.get('logs', [])

        if not logs:
            return jsonify({'msg': 'No logs provided'}), 400

        # Append logs to file
        with open(LOG_FILE_PATH, 'a', encoding='utf-8') as f:
            for log in logs:
                timestamp = log.get('timestamp', datetime.now().isoformat())
                level = log.get('level', 'INFO')
                source = log.get('source', 'UNKNOWN')
                message = log.get('message', '')
                data_str = ''
                if log.get('data'):
                    try:
                        data_str = f" | DATA: {json.dumps(log['data'], default=str)}"
                    except:
                        data_str = f" | DATA: {str(log['data'])}"

                log_line = f"[{timestamp}] [{level}] [{source}] {message}{data_str}\n"
                f.write(log_line)

        return jsonify({'msg': f'{len(logs)} logs stored successfully'}), 200

    except Exception as e:
        current_app.logger.error(f"Error storing frontend logs: {str(e)}")
        return jsonify({'msg': f'Error storing logs: {str(e)}'}), 500


@blueprint.route('/frontend', methods=['GET'])
@limiter.exempt
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

        if not os.path.exists(LOG_FILE_PATH):
            return jsonify({'logs': [], 'msg': 'No logs yet'}), 200

        with open(LOG_FILE_PATH, 'r', encoding='utf-8') as f:
            all_lines = f.readlines()
            last_lines = all_lines[-lines:] if len(all_lines) > lines else all_lines

        return jsonify({
            'logs': [line.strip() for line in last_lines],
            'total_lines': len(all_lines),
            'returned_lines': len(last_lines)
        }), 200

    except Exception as e:
        return jsonify({'msg': f'Error reading logs: {str(e)}'}), 500


@blueprint.route('/frontend', methods=['DELETE'])
@limiter.exempt
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
        if os.path.exists(LOG_FILE_PATH):
            os.remove(LOG_FILE_PATH)
        return jsonify({'msg': 'Logs cleared successfully'}), 200
    except Exception as e:
        return jsonify({'msg': f'Error clearing logs: {str(e)}'}), 500
