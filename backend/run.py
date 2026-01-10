# -*- coding: utf-8 -*-
"""
Development server runner with WebSocket support
"""

import os
from app import create_app
from app.extensions import socketio

# Create app with development configuration
app = create_app('development')

if __name__ == '__main__':
    # Run development server with SocketIO support
    socketio.run(
        app,
        host=os.getenv('FLASK_HOST', '0.0.0.0'),
        port=int(os.getenv('FLASK_PORT', 5000)),
        debug=True,
        allow_unsafe_werkzeug=True  # Only for development
    )
