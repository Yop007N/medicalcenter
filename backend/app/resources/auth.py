# -*- coding: utf-8 -*-
"""
Authentication endpoints - Login, refresh token, logout
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity, get_jwt
from flasgger import swag_from
from app.resources.domain_errors import domain_error_response
from app.services.auth_service import AuthService
from app.services.exceptions import ConflictError, ValidationError
from app.services.token_blocklist_service import TokenBlocklistService
from app.extensions import limiter
from app.utils.security_logger import log_login_attempt, log_unauthorized_access

# Blueprint for authentication routes
blueprint = Blueprint('auth', __name__, url_prefix='/api/auth')


@blueprint.route('/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
	"""User login: accepts JSON {email, password} and returns access+refresh tokens.
	---
	tags:
	  - Authentication
	parameters:
	  - in: body
	    name: body
	    required: true
	    schema:
	      type: object
	      required:
	        - email
	        - password
	      properties:
	        email:
	          type: string
	          example: admin@medical.com
	        password:
	          type: string
	          example: admin123
	responses:
	  200:
	    description: Login exitoso
	    schema:
	      type: object
	      properties:
	        access_token:
	          type: string
	        refresh_token:
	          type: string
	        user:
	          type: object
	          properties:
	            id:
	              type: integer
	            email:
	              type: string
	            first_name:
	              type: string
	            last_name:
	              type: string
	            role:
	              type: string
	  400:
	    description: Email y contraseña requeridos
	  401:
	    description: Credenciales inválidas
	"""
	data = request.get_json() or {}
	email = data.get('email')
	password = data.get('password')

	if not email or not password:
		return jsonify({'msg': 'Email and password are required'}), 400

	user = AuthService.authenticate(email, password)
	if not user:
		log_login_attempt(email, success=False, reason='Invalid credentials')
		return jsonify({'msg': 'Invalid credentials'}), 401

	# Log successful login
	log_login_attempt(email, success=True)

	access_token = create_access_token(identity=str(user.id))
	refresh_token = create_refresh_token(identity=str(user.id))

	return jsonify({
		'access_token': access_token,
		'refresh_token': refresh_token,
		'user': {
			'id': user.id,
			'email': user.email,
			'first_name': user.first_name,
			'last_name': user.last_name,
			'role': user.role,
			'specialty': getattr(user, 'specialty', None),
		}
	}), 200


@blueprint.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
	"""Refresh access token using a valid refresh token.
	---
	tags:
	  - Authentication
	security:
	  - Bearer: []
	responses:
	  200:
	    description: Nuevo access token generado
	    schema:
	      type: object
	      properties:
	        access_token:
	          type: string
	  401:
	    description: Refresh token inválido o expirado
	"""
	identity = get_jwt_identity()
	access_token = create_access_token(identity=str(identity))
	return jsonify({'access_token': access_token}), 200


@blueprint.route('/logout', methods=['POST'])
@jwt_required()
def logout():
	"""Logout endpoint with JWT revocation."""
	token = get_jwt()
	TokenBlocklistService.revoke(
		jti=token.get('jti', ''),
		expires_at_epoch=token.get('exp')
	)
	return jsonify({'msg': 'Successfully logged out'}), 200


@blueprint.route('/register', methods=['POST'])
@limiter.limit("5 per hour")
def register():
	"""Register a new user. Expects JSON with email, password, first_name, last_name, role.
	---
	tags:
	  - Authentication
	parameters:
	  - in: body
	    name: body
	    required: true
	    schema:
	      type: object
	      required:
	        - email
	        - password
	        - first_name
	        - last_name
	        - role
	      properties:
	        email:
	          type: string
	          example: newuser@medical.com
	        password:
	          type: string
	          example: password123
	        first_name:
	          type: string
	          example: John
	        last_name:
	          type: string
	          example: Doe
	        role:
	          type: string
	          enum: [professional, patient]
	          example: patient
	responses:
	  201:
	    description: Usuario registrado exitosamente
	    schema:
	      type: object
	      properties:
	        id:
	          type: integer
	        email:
	          type: string
	        first_name:
	          type: string
	        last_name:
	          type: string
	        role:
	          type: string
	  400:
	    description: Campos requeridos faltantes o email ya existe
	  500:
	    description: Error en el registro
	"""
	# Allowed roles for public registration (admin can only be created by admin)
	data = request.get_json() or {}
	email = data.get('email')
	password = data.get('password')
	first_name = data.get('first_name')
	last_name = data.get('last_name')
	role = data.get('role')
	license_number = data.get('license_number')
	specialty = data.get('specialty')

	if not all([email, password, first_name, last_name, role]):
		return jsonify({'msg': 'Missing required fields'}), 400

	try:
		user = AuthService.register_user(
			email=email,
			password=password,
			first_name=first_name,
			last_name=last_name,
			role=role,
			license_number=license_number,
			specialty=specialty,
		)
	except (ValidationError, ConflictError) as exc:
		return domain_error_response(exc)

	if not user:
		return jsonify({'msg': 'Registration failed'}), 500

	return jsonify({
		'id': user.id,
		'email': user.email,
		'first_name': user.first_name,
		'last_name': user.last_name,
		'role': user.role,
	}), 201
