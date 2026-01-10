# -*- coding: utf-8 -*-
"""
WSGI entry point for production deployment
"""

import os
from app import create_app

# Get environment from environment variable
config_name = os.getenv('FLASK_ENV', 'production')

# Create application instance
app = create_app(config_name)

if __name__ == '__main__':
    app.run()
