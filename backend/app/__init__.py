# -*- coding: utf-8 -*-
"""
Flask Application Factory
Creates and configures the Flask application instance
"""

from flask import Flask
from flask_cors import CORS
from flasgger import Swagger
from app.config import config_by_name
from app.extensions import db, jwt, celery, redis_client, ma, limiter, cache, socketio, migrate, configure_socketio
from app.services.token_blocklist_service import TokenBlocklistService


def create_app(config_name='development'):
    """
    Application factory pattern

    Args:
        config_name: Configuration name (development, production, test)

    Returns:
        Configured Flask application instance
    """
    app = Flask(__name__)

    # Load configuration (instantiate class so __init__ validations are applied)
    config_cls = config_by_name[config_name]
    config_obj = config_cls() if isinstance(config_cls, type) else config_cls
    app.config.from_object(config_obj)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    register_jwt_handlers()
    ma.init_app(app)
    limiter.init_app(app)
    configure_socketio(app)

    # Initialize cache
    cache.init_app(app, config={
        'CACHE_TYPE': 'redis',
        'CACHE_REDIS_URL': app.config.get('REDIS_URL', 'redis://localhost:6379/0'),
        'CACHE_DEFAULT_TIMEOUT': 300
    })

    # Configure CORS with specific origins from config
    cors_origins = [
        origin.strip()
        for origin in app.config.get('CORS_ORIGINS', ['http://localhost:4200'])
        if isinstance(origin, str) and origin.strip()
    ]
    if not cors_origins and config_name != 'production':
        cors_origins = ['http://localhost:4200', 'http://localhost:3000']

    supports_credentials = app.config.get('CORS_ALLOW_CREDENTIALS', True)
    if '*' in cors_origins and supports_credentials:
        app.logger.warning(
            'CORS wildcard origin with credentials is insecure; disabling credentials.'
        )
        supports_credentials = False

    CORS(app, resources={
        r"/api/*": {
            "origins": cors_origins,
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "expose_headers": ["Content-Type", "Authorization"],
            "supports_credentials": supports_credentials,
            "max_age": app.config.get('CORS_MAX_AGE', 3600)
        }
    })

    # Initialize Swagger/Flasgger
    swagger_template = {
        "swagger": "2.0",
        "info": {
            "title": "Medical Services API",
            "description": "API REST profesional para el sistema de gestión clínica Medical Services",
            "contact": {
                "responsibleOrganization": "Medical Services",
                "responsibleDeveloper": "Medical Services Team",
                "email": "dev@medical.com",
            },
            "version": "1.0.0"
        },
        "host": "localhost:5000",
        "basePath": "/",
        "schemes": ["http", "https"],
        "securityDefinitions": {
            "Bearer": {
                "type": "apiKey",
                "name": "Authorization",
                "in": "header",
                "description": "JWT Authorization header usando el esquema Bearer. Ejemplo: \"Authorization: Bearer {token}\""
            }
        },
        "tags": [
            {"name": "Authentication", "description": "Endpoints de autenticación y gestión de tokens"},
            {"name": "Users", "description": "Gestión de usuarios del sistema"},
            {"name": "Professionals", "description": "Gestión de profesionales médicos"},
            {"name": "Patients", "description": "Gestión de pacientes"},
            {"name": "Appointments", "description": "Gestión de turnos y citas médicas"},
            {"name": "Medical Records", "description": "Fichas médicas e historial clínico"},
            {"name": "Files", "description": "Gestión de archivos médicos"},
            {"name": "Budgets", "description": "Presupuestos y cotizaciones"},
            {"name": "Payments", "description": "Gestión de pagos"},
            {"name": "Sync", "description": "Sincronización nube-local"},
            {"name": "Dashboard", "description": "Métricas, indicadores y analytics del sistema"},
            {"name": "Audit", "description": "Auditoría y compliance - trazabilidad completa del sistema"},
            {"name": "Reports", "description": "Generación de reportes médicos, financieros y de agenda"},
            {"name": "Odontograms", "description": "Odontogramas y mapeo dental"},
            {"name": "Dental Treatments", "description": "Tratamientos odontológicos"},
            {"name": "Psychopedagogy", "description": "Evaluaciones psicopedagógicas e intervenciones"},
            {"name": "Psychology", "description": "Evaluaciones psicológicas y sesiones terapéuticas"},
            {"name": "Clinical History", "description": "Historia clínica odontológica: evoluciones, anamnesis, periodontograma, documentos, recetas y consentimientos"},
            {"name": "Specialties", "description": "Catálogo de módulos por especialidad y vista operativa por actor"}
        ]
    }

    Swagger(app, template=swagger_template)

    # Initialize Celery
    celery.conf.update(app.config)

    # Register blueprints
    register_blueprints(app)

    # Register health check endpoint
    register_health_check(app)

    # Register error handlers
    register_error_handlers(app)

    # Configure logging for production
    configure_logging(app)

    # Register WebSocket events
    register_websocket_events(app)

    return app


def register_blueprints(app):
    """Register Flask blueprints/resources"""
    from app.resources import auth, users, professionals, patients
    from app.resources import appointments, medical_records, files
    from app.resources import budgets, payments, sync, dashboard, audit
    from app.resources import odontograms, dental_treatments
    from app.resources import psychopedagogy, psychology, reports, logs
    from app.resources import clinical_history, specialties

    # Register all blueprints
    app.register_blueprint(auth.blueprint)
    app.register_blueprint(users.blueprint)
    app.register_blueprint(professionals.blueprint)
    app.register_blueprint(patients.blueprint)
    app.register_blueprint(appointments.blueprint)
    app.register_blueprint(medical_records.blueprint)
    app.register_blueprint(files.blueprint)
    app.register_blueprint(budgets.blueprint)
    app.register_blueprint(payments.blueprint)
    app.register_blueprint(sync.blueprint)
    app.register_blueprint(dashboard.dashboard_bp)
    app.register_blueprint(audit.blueprint)
    app.register_blueprint(reports.blueprint)
    app.register_blueprint(logs.blueprint)  # Frontend debug logs

    # Medical specialty modules
    app.register_blueprint(odontograms.blueprint)
    app.register_blueprint(dental_treatments.blueprint)
    app.register_blueprint(psychopedagogy.blueprint)
    app.register_blueprint(psychology.blueprint)
    app.register_blueprint(clinical_history.blueprint)
    app.register_blueprint(specialties.blueprint)


def register_jwt_handlers():
    """Register JWT callbacks (revocation/blocklist)."""

    @jwt.token_in_blocklist_loader
    def is_token_revoked(jwt_header, jwt_payload):  # pylint: disable=unused-argument
        return TokenBlocklistService.is_revoked(jwt_payload.get('jti', ''))


def register_health_check(app):
    """Register health check endpoint"""
    from flask import jsonify

    @app.route('/health', methods=['GET'])
    def health_check():
        """Health check endpoint for monitoring
        ---
        tags:
          - Health
        responses:
          200:
            description: Service is healthy
            schema:
              type: object
              properties:
                status:
                  type: string
                  example: healthy
                database:
                  type: string
                  example: healthy
                redis:
                  type: string
                  example: healthy
                version:
                  type: string
                  example: 1.0.0
          503:
            description: Service is degraded
        """
        health_status = {
            'status': 'healthy',
            'database': 'unknown',
            'redis': 'unknown',
            'version': '1.0.0'
        }

        # Check database
        try:
            db.session.execute(db.text('SELECT 1'))
            health_status['database'] = 'healthy'
        except Exception as e:
            app.logger.error(f'Database health check failed: {str(e)}')
            health_status['database'] = 'unhealthy'
            health_status['status'] = 'degraded'

        # Check Redis
        try:
            redis_client.ping()
            health_status['redis'] = 'healthy'
        except Exception as e:
            app.logger.error(f'Redis health check failed: {str(e)}')
            health_status['redis'] = 'unhealthy'
            health_status['status'] = 'degraded'

        status_code = 200 if health_status['status'] == 'healthy' else 503
        return jsonify(health_status), status_code


def register_error_handlers(app):
    """Register error handlers"""
    from app.middleware.error_handler import register_error_handlers as register_handlers
    register_handlers(app)


def configure_logging(app):
    """Configure logging for production"""
    import logging
    from logging.handlers import RotatingFileHandler
    import os

    if not app.debug:
        # Create logs directory if it doesn't exist
        if not os.path.exists('logs'):
            os.makedirs('logs')

        # Configure file handler
        file_handler = RotatingFileHandler(
            'logs/medical_services.log',
            maxBytes=10240000,  # 10MB
            backupCount=10
        )

        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))

        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        app.logger.setLevel(logging.INFO)
        app.logger.info('Medical Services API startup')


def register_websocket_events(app):
    """Register WebSocket event handlers"""
    # Import events module to register handlers
    with app.app_context():
        import app.websockets.events  # noqa: F401
