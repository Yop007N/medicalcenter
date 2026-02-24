# -*- coding: utf-8 -*-
"""Psychology endpoints - evaluations and therapy sessions."""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError

from app.extensions import db
from app.schemas.psychology_schema import (
    psychological_evaluation_schema,
    psychological_evaluations_schema,
    therapy_session_schema,
    therapy_sessions_schema,
)
from app.services.exceptions import ResourceNotFoundError, ValidationError
from app.services.psychology_service import PsychologyService
from app.utils.helpers import get_pagination_params

blueprint = Blueprint('psychology', __name__, url_prefix='/api/psychology')


def _service_error_response(error):
    status_map = {
        ValidationError: 400,
        ResourceNotFoundError: 404,
    }
    status = status_map.get(type(error), 400)
    payload = {'msg': error.message}
    if getattr(error, 'details', None):
        payload.update(error.details)
    return jsonify(payload), status


# ==================== Psychological Evaluations ====================

@blueprint.route('/evaluations', methods=['POST'])
@jwt_required()
def create_evaluation():
    """Create a new psychological evaluation."""
    try:
        evaluation = PsychologyService.create_evaluation(
            current_user_id=get_jwt_identity(),
            data=request.get_json() or {},
        )
        return jsonify(psychological_evaluation_schema.dump(evaluation)), 201
    except (ValidationError, ResourceNotFoundError) as error:
        return _service_error_response(error)
    except SQLAlchemyError as error:
        db.session.rollback()
        return jsonify({'msg': 'Database error', 'error': str(error)}), 500


@blueprint.route('/evaluations/<int:evaluation_id>', methods=['GET'])
@jwt_required()
def get_evaluation(evaluation_id):
    """Get a specific psychological evaluation."""
    try:
        evaluation = PsychologyService.get_evaluation(evaluation_id)
        return jsonify(psychological_evaluation_schema.dump(evaluation)), 200
    except (ValidationError, ResourceNotFoundError) as error:
        return _service_error_response(error)


@blueprint.route('/evaluations/<int:evaluation_id>', methods=['PUT'])
@jwt_required()
def update_evaluation(evaluation_id):
    """Update a psychological evaluation."""
    try:
        evaluation = PsychologyService.update_evaluation(
            evaluation_id=evaluation_id,
            data=request.get_json() or {},
        )
        return jsonify(psychological_evaluation_schema.dump(evaluation)), 200
    except (ValidationError, ResourceNotFoundError) as error:
        return _service_error_response(error)
    except SQLAlchemyError as error:
        db.session.rollback()
        return jsonify({'msg': 'Database error', 'error': str(error)}), 500


@blueprint.route('/evaluations/<int:evaluation_id>', methods=['DELETE'])
@jwt_required()
def delete_evaluation(evaluation_id):
    """Delete a psychological evaluation."""
    try:
        PsychologyService.delete_evaluation(evaluation_id)
        return jsonify({'msg': 'Evaluation deleted successfully'}), 200
    except (ValidationError, ResourceNotFoundError) as error:
        return _service_error_response(error)
    except SQLAlchemyError as error:
        db.session.rollback()
        return jsonify({'msg': 'Database error', 'error': str(error)}), 500


@blueprint.route('/evaluations/patient/<int:patient_id>', methods=['GET'])
@jwt_required()
def get_patient_evaluations(patient_id):
    """Get all psychological evaluations for a patient."""
    try:
        page, page_size = get_pagination_params(request)
        paginated = PsychologyService.get_patient_evaluations(
            patient_id=patient_id,
            page=page,
            page_size=page_size,
            status=request.args.get('status'),
        )
        return jsonify({
            'evaluations': psychological_evaluations_schema.dump(paginated.items),
            'total': paginated.total,
            'page': paginated.page,
            'pages': paginated.pages,
            'page_size': page_size,
        }), 200
    except (ValidationError, ResourceNotFoundError) as error:
        return _service_error_response(error)


@blueprint.route('/evaluations/professional/<int:professional_id>', methods=['GET'])
@jwt_required()
def get_professional_evaluations(professional_id):
    """Get all evaluations by a professional."""
    try:
        page, page_size = get_pagination_params(request)
        paginated = PsychologyService.get_professional_evaluations(
            professional_id=professional_id,
            page=page,
            page_size=page_size,
        )
        return jsonify({
            'evaluations': psychological_evaluations_schema.dump(paginated.items),
            'total': paginated.total,
            'page': paginated.page,
            'pages': paginated.pages,
            'page_size': page_size,
        }), 200
    except (ValidationError, ResourceNotFoundError) as error:
        return _service_error_response(error)


# ==================== Therapy Sessions ====================

@blueprint.route('/sessions', methods=['POST'])
@jwt_required()
def create_session():
    """Create a new therapy session."""
    try:
        session = PsychologyService.create_session(
            current_user_id=get_jwt_identity(),
            data=request.get_json() or {},
        )
        return jsonify(therapy_session_schema.dump(session)), 201
    except (ValidationError, ResourceNotFoundError) as error:
        return _service_error_response(error)
    except SQLAlchemyError as error:
        db.session.rollback()
        return jsonify({'msg': 'Database error', 'error': str(error)}), 500


@blueprint.route('/sessions/<int:session_id>', methods=['GET'])
@jwt_required()
def get_session(session_id):
    """Get a specific therapy session."""
    try:
        session = PsychologyService.get_session(session_id)
        return jsonify(therapy_session_schema.dump(session)), 200
    except (ValidationError, ResourceNotFoundError) as error:
        return _service_error_response(error)


@blueprint.route('/sessions/<int:session_id>', methods=['PUT'])
@jwt_required()
def update_session(session_id):
    """Update a therapy session."""
    try:
        session = PsychologyService.update_session(
            session_id=session_id,
            data=request.get_json() or {},
        )
        return jsonify(therapy_session_schema.dump(session)), 200
    except (ValidationError, ResourceNotFoundError) as error:
        return _service_error_response(error)
    except SQLAlchemyError as error:
        db.session.rollback()
        return jsonify({'msg': 'Database error', 'error': str(error)}), 500


@blueprint.route('/sessions/<int:session_id>', methods=['DELETE'])
@jwt_required()
def delete_session(session_id):
    """Delete a therapy session."""
    try:
        PsychologyService.delete_session(session_id)
        return jsonify({'msg': 'Session deleted successfully'}), 200
    except (ValidationError, ResourceNotFoundError) as error:
        return _service_error_response(error)
    except SQLAlchemyError as error:
        db.session.rollback()
        return jsonify({'msg': 'Database error', 'error': str(error)}), 500


@blueprint.route('/evaluations/<int:evaluation_id>/sessions', methods=['GET'])
@jwt_required()
def get_evaluation_sessions(evaluation_id):
    """Get all sessions for an evaluation."""
    try:
        page, page_size = get_pagination_params(request)
        paginated = PsychologyService.get_evaluation_sessions(
            evaluation_id=evaluation_id,
            page=page,
            page_size=page_size,
        )
        return jsonify({
            'sessions': therapy_sessions_schema.dump(paginated.items),
            'total': paginated.total,
            'page': paginated.page,
            'pages': paginated.pages,
            'page_size': page_size,
        }), 200
    except (ValidationError, ResourceNotFoundError) as error:
        return _service_error_response(error)


@blueprint.route('/sessions/patient/<int:patient_id>/history', methods=['GET'])
@jwt_required()
def get_patient_session_history(patient_id):
    """Get complete therapy session history for a patient."""
    try:
        page, page_size = get_pagination_params(request)
        paginated = PsychologyService.get_patient_session_history(
            patient_id=patient_id,
            page=page,
            page_size=page_size,
        )
        return jsonify({
            'sessions': therapy_sessions_schema.dump(paginated.items),
            'total': paginated.total,
            'page': paginated.page,
            'pages': paginated.pages,
            'page_size': page_size,
        }), 200
    except (ValidationError, ResourceNotFoundError) as error:
        return _service_error_response(error)


@blueprint.route('/sessions/<int:session_id>/crisis', methods=['POST'])
@jwt_required()
def mark_crisis_intervention(session_id):
    """Mark a session as having crisis intervention."""
    try:
        session = PsychologyService.mark_crisis_intervention(
            session_id=session_id,
            data=request.get_json() or {},
        )
        return jsonify(therapy_session_schema.dump(session)), 200
    except (ValidationError, ResourceNotFoundError) as error:
        return _service_error_response(error)
    except SQLAlchemyError as error:
        db.session.rollback()
        return jsonify({'msg': 'Database error', 'error': str(error)}), 500
