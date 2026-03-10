# -*- coding: utf-8 -*-
"""Psychopedagogy endpoints - evaluations and intervention sessions."""

from app.resources.domain_errors import domain_error_response
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError

from app.extensions import db
from app.schemas.psychopedagogy_schema import (
    psychopedagogical_evaluation_schema,
    psychopedagogical_evaluations_schema,
    intervention_session_schema,
    intervention_sessions_schema,
)
from app.services.exceptions import ResourceNotFoundError, ValidationError
from app.services.psychopedagogy_service import PsychopedagogyService
from app.utils.decorators import module_access_required
from app.utils.helpers import get_pagination_params

blueprint = Blueprint('psychopedagogy', __name__, url_prefix='/api/psychopedagogy')




def _db_error_response():
    db.session.rollback()
    return domain_error_response(error, default_status=500)


@blueprint.before_request
@module_access_required('psychopedagogy')
def _enforce_module_scope():
    return None


# ==================== Psychopedagogical Evaluations ====================

@blueprint.route('/evaluations', methods=['POST'])
@jwt_required()
def create_evaluation():
    """Create a new psychopedagogical evaluation."""
    try:
        evaluation = PsychopedagogyService.create_evaluation(
            current_user_id=get_jwt_identity(),
            data=request.get_json() or {},
        )
        return jsonify(psychopedagogical_evaluation_schema.dump(evaluation)), 201
    except (ValidationError, ResourceNotFoundError) as error:
        return domain_error_response(error)
    except SQLAlchemyError:
        return _db_error_response()


@blueprint.route('/evaluations/<int:evaluation_id>', methods=['GET'])
@jwt_required()
def get_evaluation(evaluation_id):
    """Get a specific psychopedagogical evaluation."""
    try:
        evaluation = PsychopedagogyService.get_evaluation(evaluation_id)
        return jsonify(psychopedagogical_evaluation_schema.dump(evaluation)), 200
    except (ValidationError, ResourceNotFoundError) as error:
        return domain_error_response(error)


@blueprint.route('/evaluations/<int:evaluation_id>', methods=['PUT'])
@jwt_required()
def update_evaluation(evaluation_id):
    """Update a psychopedagogical evaluation."""
    try:
        evaluation = PsychopedagogyService.update_evaluation(
            evaluation_id=evaluation_id,
            data=request.get_json() or {},
        )
        return jsonify(psychopedagogical_evaluation_schema.dump(evaluation)), 200
    except (ValidationError, ResourceNotFoundError) as error:
        return domain_error_response(error)
    except SQLAlchemyError:
        return _db_error_response()


@blueprint.route('/evaluations/<int:evaluation_id>', methods=['DELETE'])
@jwt_required()
def delete_evaluation(evaluation_id):
    """Delete a psychopedagogical evaluation."""
    try:
        PsychopedagogyService.delete_evaluation(evaluation_id)
        return jsonify({'msg': 'Evaluation deleted successfully'}), 200
    except (ValidationError, ResourceNotFoundError) as error:
        return domain_error_response(error)
    except SQLAlchemyError:
        return _db_error_response()


@blueprint.route('/evaluations/patient/<int:patient_id>', methods=['GET'])
@jwt_required()
def get_patient_evaluations(patient_id):
    """Get all evaluations for a patient."""
    try:
        page, page_size = get_pagination_params(request)
        paginated = PsychopedagogyService.get_patient_evaluations(
            patient_id=patient_id,
            page=page,
            page_size=page_size,
            status=request.args.get('status'),
        )
        return jsonify({
            'evaluations': psychopedagogical_evaluations_schema.dump(paginated.items),
            'total': paginated.total,
            'page': paginated.page,
            'pages': paginated.pages,
            'page_size': page_size,
        }), 200
    except (ValidationError, ResourceNotFoundError) as error:
        return domain_error_response(error)


@blueprint.route('/evaluations/professional/<int:professional_id>', methods=['GET'])
@jwt_required()
def get_professional_evaluations(professional_id):
    """Get all evaluations by a professional."""
    try:
        page, page_size = get_pagination_params(request)
        paginated = PsychopedagogyService.get_professional_evaluations(
            professional_id=professional_id,
            page=page,
            page_size=page_size,
        )
        return jsonify({
            'evaluations': psychopedagogical_evaluations_schema.dump(paginated.items),
            'total': paginated.total,
            'page': paginated.page,
            'pages': paginated.pages,
            'page_size': page_size,
        }), 200
    except (ValidationError, ResourceNotFoundError) as error:
        return domain_error_response(error)


# ==================== Intervention Sessions ====================

@blueprint.route('/sessions', methods=['POST'])
@jwt_required()
def create_session():
    """Create a new intervention session."""
    try:
        session = PsychopedagogyService.create_session(
            current_user_id=get_jwt_identity(),
            data=request.get_json() or {},
        )
        return jsonify(intervention_session_schema.dump(session)), 201
    except (ValidationError, ResourceNotFoundError) as error:
        return domain_error_response(error)
    except SQLAlchemyError:
        return _db_error_response()


@blueprint.route('/sessions/<int:session_id>', methods=['GET'])
@jwt_required()
def get_session(session_id):
    """Get a specific intervention session."""
    try:
        session = PsychopedagogyService.get_session(session_id)
        return jsonify(intervention_session_schema.dump(session)), 200
    except (ValidationError, ResourceNotFoundError) as error:
        return domain_error_response(error)


@blueprint.route('/sessions/<int:session_id>', methods=['PUT'])
@jwt_required()
def update_session(session_id):
    """Update an intervention session."""
    try:
        session = PsychopedagogyService.update_session(
            session_id=session_id,
            data=request.get_json() or {},
        )
        return jsonify(intervention_session_schema.dump(session)), 200
    except (ValidationError, ResourceNotFoundError) as error:
        return domain_error_response(error)
    except SQLAlchemyError:
        return _db_error_response()


@blueprint.route('/sessions/<int:session_id>', methods=['DELETE'])
@jwt_required()
def delete_session(session_id):
    """Delete an intervention session."""
    try:
        PsychopedagogyService.delete_session(session_id)
        return jsonify({'msg': 'Session deleted successfully'}), 200
    except (ValidationError, ResourceNotFoundError) as error:
        return domain_error_response(error)
    except SQLAlchemyError:
        return _db_error_response()


@blueprint.route('/evaluations/<int:evaluation_id>/sessions', methods=['GET'])
@jwt_required()
def get_evaluation_sessions(evaluation_id):
    """Get all sessions for an evaluation."""
    try:
        page, page_size = get_pagination_params(request)
        paginated = PsychopedagogyService.get_evaluation_sessions(
            evaluation_id=evaluation_id,
            page=page,
            page_size=page_size,
        )
        return jsonify({
            'sessions': intervention_sessions_schema.dump(paginated.items),
            'total': paginated.total,
            'page': paginated.page,
            'pages': paginated.pages,
            'page_size': page_size,
        }), 200
    except (ValidationError, ResourceNotFoundError) as error:
        return domain_error_response(error)


@blueprint.route('/sessions/patient/<int:patient_id>/history', methods=['GET'])
@jwt_required()
def get_patient_session_history(patient_id):
    """Get complete intervention session history for a patient."""
    try:
        page, page_size = get_pagination_params(request)
        paginated = PsychopedagogyService.get_patient_session_history(
            patient_id=patient_id,
            page=page,
            page_size=page_size,
        )
        return jsonify({
            'sessions': intervention_sessions_schema.dump(paginated.items),
            'total': paginated.total,
            'page': paginated.page,
            'pages': paginated.pages,
            'page_size': page_size,
        }), 200
    except (ValidationError, ResourceNotFoundError) as error:
        return domain_error_response(error)
