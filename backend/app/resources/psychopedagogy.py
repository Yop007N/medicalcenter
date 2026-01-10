# -*- coding: utf-8 -*-
"""
Psychopedagogy endpoints - Psychopedagogical evaluations and intervention sessions
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.extensions import db
from app.models.psychopedagogy import PsychopedagogicalEvaluation, InterventionSession
from app.models.patient import Patient
from app.models.professional import Professional
from app.schemas.psychopedagogy_schema import (
    psychopedagogical_evaluation_schema,
    psychopedagogical_evaluations_schema,
    intervention_session_schema,
    intervention_sessions_schema
)
from app.utils.helpers import get_pagination_params, validate_required_fields
from app.utils.constants import DEFAULT_PAGE, DEFAULT_PAGE_SIZE

blueprint = Blueprint('psychopedagogy', __name__, url_prefix='/api/psychopedagogy')


# ==================== Psychopedagogical Evaluations ====================

@blueprint.route('/evaluations', methods=['POST'])
@jwt_required()
def create_evaluation():
    """Create a new psychopedagogical evaluation
    ---
    tags:
      - Psychopedagogy
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - patient_id
            - professional_id
            - reason
            - recommendations
            - evaluation_date
          properties:
            patient_id:
              type: integer
            professional_id:
              type: integer
            medical_record_id:
              type: integer
            school_name:
              type: string
            grade:
              type: string
            reason:
              type: string
            recommendations:
              type: string
            evaluation_date:
              type: string
              format: date
    responses:
      201:
        description: Evaluation created successfully
      400:
        description: Validation error
      404:
        description: Patient or professional not found
    """
    data = request.get_json() or {}

    # Validate required fields
    required = ['patient_id', 'reason', 'recommendations', 'evaluation_date']
    is_valid, missing_fields = validate_required_fields(data, required)
    if not is_valid:
        return jsonify({
            'msg': 'Missing required fields',
            'missing_fields': missing_fields
        }), 400

    # Verify patient exists
    patient = Patient.query.get(data['patient_id'])
    if not patient:
        return jsonify({'msg': 'Patient not found'}), 404

    # Set professional_id from JWT
    data['professional_id'] = get_jwt_identity()

    try:
        # Validate and deserialize
        evaluation_data = psychopedagogical_evaluation_schema.load(data)

        # Create evaluation
        evaluation = PsychopedagogicalEvaluation(**evaluation_data)
        db.session.add(evaluation)
        db.session.commit()

        return jsonify(psychopedagogical_evaluation_schema.dump(evaluation)), 201

    except ValidationError as err:
        return jsonify({'msg': 'Validation error', 'errors': err.messages}), 400
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'msg': 'Database error', 'error': str(e)}), 500


@blueprint.route('/evaluations/<int:evaluation_id>', methods=['GET'])
@jwt_required()
def get_evaluation(evaluation_id):
    """Get a specific psychopedagogical evaluation
    ---
    tags:
      - Psychopedagogy
    security:
      - Bearer: []
    parameters:
      - name: evaluation_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Evaluation retrieved successfully
      404:
        description: Evaluation not found
    """
    evaluation = PsychopedagogicalEvaluation.query.get(evaluation_id)
    if not evaluation:
        return jsonify({'msg': 'Evaluation not found'}), 404

    return jsonify(psychopedagogical_evaluation_schema.dump(evaluation)), 200


@blueprint.route('/evaluations/<int:evaluation_id>', methods=['PUT'])
@jwt_required()
def update_evaluation(evaluation_id):
    """Update a psychopedagogical evaluation
    ---
    tags:
      - Psychopedagogy
    security:
      - Bearer: []
    parameters:
      - name: evaluation_id
        in: path
        type: integer
        required: true
      - in: body
        name: body
        schema:
          type: object
    responses:
      200:
        description: Evaluation updated successfully
      400:
        description: Validation error
      404:
        description: Evaluation not found
    """
    evaluation = PsychopedagogicalEvaluation.query.get(evaluation_id)
    if not evaluation:
        return jsonify({'msg': 'Evaluation not found'}), 404

    data = request.get_json() or {}

    try:
        # Validate data
        validated_data = psychopedagogical_evaluation_schema.load(data, partial=True)

        # Update fields
        for key, value in validated_data.items():
            setattr(evaluation, key, value)

        db.session.commit()

        return jsonify(psychopedagogical_evaluation_schema.dump(evaluation)), 200

    except ValidationError as err:
        return jsonify({'msg': 'Validation error', 'errors': err.messages}), 400
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'msg': 'Database error', 'error': str(e)}), 500


@blueprint.route('/evaluations/<int:evaluation_id>', methods=['DELETE'])
@jwt_required()
def delete_evaluation(evaluation_id):
    """Delete a psychopedagogical evaluation
    ---
    tags:
      - Psychopedagogy
    security:
      - Bearer: []
    parameters:
      - name: evaluation_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Evaluation deleted successfully
      404:
        description: Evaluation not found
    """
    evaluation = PsychopedagogicalEvaluation.query.get(evaluation_id)
    if not evaluation:
        return jsonify({'msg': 'Evaluation not found'}), 404

    try:
        db.session.delete(evaluation)
        db.session.commit()
        return jsonify({'msg': 'Evaluation deleted successfully'}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'msg': 'Database error', 'error': str(e)}), 500


@blueprint.route('/evaluations/patient/<int:patient_id>', methods=['GET'])
@jwt_required()
def get_patient_evaluations(patient_id):
    """Get all evaluations for a patient
    ---
    tags:
      - Psychopedagogy
    security:
      - Bearer: []
    parameters:
      - name: patient_id
        in: path
        type: integer
        required: true
      - name: page
        in: query
        type: integer
      - name: page_size
        in: query
        type: integer
      - name: status
        in: query
        type: string
    responses:
      200:
        description: Evaluations retrieved successfully
      404:
        description: Patient not found
    """
    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({'msg': 'Patient not found'}), 404

    page, page_size = get_pagination_params(request)
    status = request.args.get('status')

    query = PsychopedagogicalEvaluation.query.filter_by(patient_id=patient_id)

    if status:
        query = query.filter_by(status=status)

    query = query.order_by(PsychopedagogicalEvaluation.evaluation_date.desc())

    paginated = query.paginate(page=page, per_page=page_size, error_out=False)

    return jsonify({
        'evaluations': psychopedagogical_evaluations_schema.dump(paginated.items),
        'total': paginated.total,
        'page': paginated.page,
        'pages': paginated.pages,
        'page_size': page_size
    }), 200


@blueprint.route('/evaluations/professional/<int:professional_id>', methods=['GET'])
@jwt_required()
def get_professional_evaluations(professional_id):
    """Get all evaluations by a professional
    ---
    tags:
      - Psychopedagogy
    security:
      - Bearer: []
    parameters:
      - name: professional_id
        in: path
        type: integer
        required: true
      - name: page
        in: query
        type: integer
      - name: page_size
        in: query
        type: integer
    responses:
      200:
        description: Evaluations retrieved successfully
      404:
        description: Professional not found
    """
    professional = Professional.query.get(professional_id)
    if not professional:
        return jsonify({'msg': 'Professional not found'}), 404

    page, page_size = get_pagination_params(request)

    query = PsychopedagogicalEvaluation.query.filter_by(professional_id=professional_id)
    query = query.order_by(PsychopedagogicalEvaluation.evaluation_date.desc())

    paginated = query.paginate(page=page, per_page=page_size, error_out=False)

    return jsonify({
        'evaluations': psychopedagogical_evaluations_schema.dump(paginated.items),
        'total': paginated.total,
        'page': paginated.page,
        'pages': paginated.pages,
        'page_size': page_size
    }), 200


# ==================== Intervention Sessions ====================

@blueprint.route('/sessions', methods=['POST'])
@jwt_required()
def create_session():
    """Create a new intervention session
    ---
    tags:
      - Psychopedagogy
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - evaluation_id
            - patient_id
            - professional_id
            - session_date
            - focus_area
          properties:
            evaluation_id:
              type: integer
            patient_id:
              type: integer
            professional_id:
              type: integer
            session_date:
              type: string
              format: date
            focus_area:
              type: string
    responses:
      201:
        description: Session created successfully
      400:
        description: Validation error
      404:
        description: Evaluation, patient, or professional not found
    """
    data = request.get_json() or {}

    required = ['evaluation_id', 'patient_id', 'session_date', 'focus_area']
    is_valid, missing_fields = validate_required_fields(data, required)
    if not is_valid:
        return jsonify({
            'msg': 'Missing required fields',
            'missing_fields': missing_fields
        }), 400

    # Verify evaluation exists
    evaluation = PsychopedagogicalEvaluation.query.get(data['evaluation_id'])
    if not evaluation:
        return jsonify({'msg': 'Evaluation not found'}), 404

    # Verify patient exists
    patient = Patient.query.get(data['patient_id'])
    if not patient:
        return jsonify({'msg': 'Patient not found'}), 404

    # Set professional_id from JWT
    data['professional_id'] = get_jwt_identity()

    try:
        session_data = intervention_session_schema.load(data)

        # Auto-increment session number if not provided
        if 'session_number' not in session_data:
            last_session = InterventionSession.query.filter_by(
                evaluation_id=data['evaluation_id']
            ).order_by(InterventionSession.session_number.desc()).first()
            session_data['session_number'] = (last_session.session_number + 1) if last_session else 1

        session = InterventionSession(**session_data)
        db.session.add(session)
        db.session.commit()

        return jsonify(intervention_session_schema.dump(session)), 201

    except ValidationError as err:
        return jsonify({'msg': 'Validation error', 'errors': err.messages}), 400
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'msg': 'Database error', 'error': str(e)}), 500


@blueprint.route('/sessions/<int:session_id>', methods=['GET'])
@jwt_required()
def get_session(session_id):
    """Get a specific intervention session
    ---
    tags:
      - Psychopedagogy
    security:
      - Bearer: []
    parameters:
      - name: session_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Session retrieved successfully
      404:
        description: Session not found
    """
    session = InterventionSession.query.get(session_id)
    if not session:
        return jsonify({'msg': 'Session not found'}), 404

    return jsonify(intervention_session_schema.dump(session)), 200


@blueprint.route('/sessions/<int:session_id>', methods=['PUT'])
@jwt_required()
def update_session(session_id):
    """Update an intervention session
    ---
    tags:
      - Psychopedagogy
    security:
      - Bearer: []
    parameters:
      - name: session_id
        in: path
        type: integer
        required: true
      - in: body
        name: body
        schema:
          type: object
    responses:
      200:
        description: Session updated successfully
      400:
        description: Validation error
      404:
        description: Session not found
    """
    session = InterventionSession.query.get(session_id)
    if not session:
        return jsonify({'msg': 'Session not found'}), 404

    data = request.get_json() or {}

    try:
        validated_data = intervention_session_schema.load(data, partial=True)

        for key, value in validated_data.items():
            setattr(session, key, value)

        db.session.commit()

        return jsonify(intervention_session_schema.dump(session)), 200

    except ValidationError as err:
        return jsonify({'msg': 'Validation error', 'errors': err.messages}), 400
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'msg': 'Database error', 'error': str(e)}), 500


@blueprint.route('/sessions/<int:session_id>', methods=['DELETE'])
@jwt_required()
def delete_session(session_id):
    """Delete an intervention session
    ---
    tags:
      - Psychopedagogy
    security:
      - Bearer: []
    parameters:
      - name: session_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Session deleted successfully
      404:
        description: Session not found
    """
    session = InterventionSession.query.get(session_id)
    if not session:
        return jsonify({'msg': 'Session not found'}), 404

    try:
        db.session.delete(session)
        db.session.commit()
        return jsonify({'msg': 'Session deleted successfully'}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'msg': 'Database error', 'error': str(e)}), 500


@blueprint.route('/evaluations/<int:evaluation_id>/sessions', methods=['GET'])
@jwt_required()
def get_evaluation_sessions(evaluation_id):
    """Get all sessions for an evaluation
    ---
    tags:
      - Psychopedagogy
    security:
      - Bearer: []
    parameters:
      - name: evaluation_id
        in: path
        type: integer
        required: true
      - name: page
        in: query
        type: integer
      - name: page_size
        in: query
        type: integer
    responses:
      200:
        description: Sessions retrieved successfully
      404:
        description: Evaluation not found
    """
    evaluation = PsychopedagogicalEvaluation.query.get(evaluation_id)
    if not evaluation:
        return jsonify({'msg': 'Evaluation not found'}), 404

    page, page_size = get_pagination_params(request)

    query = InterventionSession.query.filter_by(evaluation_id=evaluation_id)
    query = query.order_by(InterventionSession.session_number.asc())

    paginated = query.paginate(page=page, per_page=page_size, error_out=False)

    return jsonify({
        'sessions': intervention_sessions_schema.dump(paginated.items),
        'total': paginated.total,
        'page': paginated.page,
        'pages': paginated.pages,
        'page_size': page_size
    }), 200


@blueprint.route('/sessions/patient/<int:patient_id>/history', methods=['GET'])
@jwt_required()
def get_patient_session_history(patient_id):
    """Get complete intervention session history for a patient
    ---
    tags:
      - Psychopedagogy
    security:
      - Bearer: []
    parameters:
      - name: patient_id
        in: path
        type: integer
        required: true
      - name: page
        in: query
        type: integer
      - name: page_size
        in: query
        type: integer
    responses:
      200:
        description: Session history retrieved successfully
      404:
        description: Patient not found
    """
    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({'msg': 'Patient not found'}), 404

    page, page_size = get_pagination_params(request)

    query = InterventionSession.query.filter_by(patient_id=patient_id)
    query = query.order_by(InterventionSession.session_date.desc())

    paginated = query.paginate(page=page, per_page=page_size, error_out=False)

    return jsonify({
        'sessions': intervention_sessions_schema.dump(paginated.items),
        'total': paginated.total,
        'page': paginated.page,
        'pages': paginated.pages,
        'page_size': page_size
    }), 200
