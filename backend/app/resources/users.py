# -*- coding: utf-8 -*-
"""
User CRUD endpoints
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.services.user_service import UserService
from app.schemas.user_schema import UserSchema
from app.utils.helpers import get_pagination_params
from app.utils.decorators import admin_required


blueprint = Blueprint('users', __name__, url_prefix='/api/users')

user_schema = UserSchema()
users_schema = UserSchema(many=True)


@blueprint.route('', methods=['GET'])
@jwt_required()
def list_users():
    """List users with optional query filters (role, email) and pagination
    ---
    tags:
      - Users
    security:
      - Bearer: []
    parameters:
      - in: query
        name: role
        type: string
        description: Filtrar por rol (admin, professional, patient)
      - in: query
        name: email
        type: string
        description: Filtrar por email
      - in: query
        name: page
        type: integer
        default: 1
        description: Número de página
      - in: query
        name: per_page
        type: integer
        default: 20
        description: Elementos por página (máximo 100)
    responses:
      200:
        description: Lista paginada de usuarios
        schema:
          type: object
          properties:
            items:
              type: array
              items:
                type: object
            total:
              type: integer
            page:
              type: integer
            pages:
              type: integer
            per_page:
              type: integer
      401:
        description: No autenticado
    """
    # Pagination parameters using helper
    page, per_page = get_pagination_params(request)

    filters = {
        'role': request.args.get('role'),
        'email': request.args.get('email')
    }
    # remove None values
    filters = {k: v for k, v in filters.items() if v}

    pagination = UserService.get_all_users_paginated(
        page=page,
        per_page=per_page,
        filters=filters if filters else None
    )

    return jsonify({
        'items': users_schema.dump(pagination.items),
        'total': pagination.total,
        'page': pagination.page,
        'pages': pagination.pages,
        'per_page': per_page
    }), 200


@blueprint.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    """Get user by ID
    ---
    tags:
      - Users
    security:
      - Bearer: []
    parameters:
      - in: path
        name: user_id
        type: integer
        required: true
        description: ID del usuario
    responses:
      200:
        description: Usuario encontrado
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
      404:
        description: Usuario no encontrado
      401:
        description: No autenticado
    """
    user = UserService.get_user_by_id(user_id)
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    return jsonify(user_schema.dump(user)), 200


@blueprint.route('', methods=['POST'])
@jwt_required()
@admin_required
def create_user():
    """Create new user
    ---
    tags:
      - Users
    security:
      - Bearer: []
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
            password:
              type: string
              minLength: 8
            first_name:
              type: string
            last_name:
              type: string
            role:
              type: string
              enum: [admin, professional, patient]
    responses:
      201:
        description: Usuario creado exitosamente
      400:
        description: Datos inválidos o email duplicado
      401:
        description: No autenticado
    """
    data = request.get_json() or {}
    try:
        user = UserService.create_user(data)
    except ValueError as exc:
        return jsonify({'msg': str(exc)}), 400

    return jsonify(user_schema.dump(user)), 201


@blueprint.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_user(user_id):
    """Update user
    ---
    tags:
      - Users
    security:
      - Bearer: []
    parameters:
      - in: path
        name: user_id
        type: integer
        required: true
        description: ID del usuario
      - in: body
        name: body
        schema:
          type: object
          properties:
            email:
              type: string
            first_name:
              type: string
            last_name:
              type: string
            role:
              type: string
            is_active:
              type: boolean
    responses:
      200:
        description: Usuario actualizado
      404:
        description: Usuario no encontrado
      401:
        description: No autenticado
    """
    data = request.get_json() or {}
    try:
        user = UserService.update_user(user_id, data)
        if not user:
            return jsonify({'msg': 'User not found'}), 404
        return jsonify(user_schema.dump(user)), 200
    except ValueError as e:
        return jsonify({'msg': str(e)}), 400


@blueprint.route('/<int:user_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_user(user_id):
    """Delete user
    ---
    tags:
      - Users
    security:
      - Bearer: []
    parameters:
      - in: path
        name: user_id
        type: integer
        required: true
        description: ID del usuario
    responses:
      200:
        description: Usuario eliminado
      404:
        description: Usuario no encontrado
      401:
        description: No autenticado
    """
    ok = UserService.delete_user(user_id)
    if not ok:
        return jsonify({'msg': 'User not found'}), 404
    return jsonify({'msg': 'User deleted'}), 200
