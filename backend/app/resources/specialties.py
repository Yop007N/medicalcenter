# -*- coding: utf-8 -*-
"""Specialty module catalog and scoped overview endpoints."""

from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.resources.domain_errors import domain_error_response
from app.services.exceptions import (
    AccessDeniedError,
    ResourceNotFoundError,
    ValidationError,
)
from app.services.specialty_encounter_service import SpecialtyEncounterService
from app.services.specialty_module_service import SpecialtyModuleService

blueprint = Blueprint('specialties', __name__, url_prefix='/api/specialties')


@blueprint.route('/catalog', methods=['GET'])
@jwt_required()
def get_catalog():
    """Get full clinical specialty module catalog."""
    return jsonify(SpecialtyModuleService.get_catalog()), 200


@blueprint.route('/my-module', methods=['GET'])
@jwt_required()
def get_my_module():
    """Resolve module for current authenticated actor."""
    try:
        payload = SpecialtyModuleService.get_my_module(get_jwt_identity())
        return jsonify(payload), 200
    except (ValidationError, AccessDeniedError) as exc:
        return domain_error_response(exc)


@blueprint.route('/my-module/overview', methods=['GET'])
@jwt_required()
def get_my_module_overview():
    """Get operational overview for the current actor's module scope."""
    from flask import request

    try:
        payload = SpecialtyModuleService.get_my_module_overview(
            current_user_id=get_jwt_identity(),
            specialty_key=request.args.get('specialty_key'),
        )
        return jsonify(payload), 200
    except (ValidationError, AccessDeniedError) as exc:
        return domain_error_response(exc)


@blueprint.route('/history', methods=['GET'])
@jwt_required()
def get_specialty_history():
    """Return scoped clinical history for a specialty module."""
    from flask import request

    try:
        payload = SpecialtyModuleService.get_specialty_history(
            current_user_id=get_jwt_identity(),
            specialty_key=request.args.get('specialty_key'),
            patient_id=request.args.get('patient_id', type=int),
        )
        return jsonify(payload), 200
    except (ValidationError, AccessDeniedError, ResourceNotFoundError) as exc:
        return domain_error_response(exc)


@blueprint.route('/encounters', methods=['GET'])
@jwt_required()
def list_encounters():
    """List specialty encounters by actor scope."""
    from flask import request

    specialty_key = request.args.get('specialty_key')
    patient_id = request.args.get('patient_id', type=int)
    try:
        rows = SpecialtyEncounterService.list_encounters(
            current_user_id=get_jwt_identity(),
            specialty_key=specialty_key,
            patient_id=patient_id,
        )
        return jsonify([SpecialtyEncounterService.enrich_encounter_payload(item) for item in rows]), 200
    except (ValidationError, AccessDeniedError) as exc:
        return domain_error_response(exc)


@blueprint.route('/encounters/<int:encounter_id>', methods=['GET'])
@jwt_required()
def get_encounter(encounter_id):
    """Get one specialty encounter by id."""
    try:
        encounter = SpecialtyEncounterService.get_encounter(encounter_id, get_jwt_identity())
        return jsonify(SpecialtyEncounterService.enrich_encounter_payload(encounter)), 200
    except (ValidationError, AccessDeniedError, ResourceNotFoundError) as exc:
        return domain_error_response(exc)


@blueprint.route('/encounters', methods=['POST'])
@jwt_required()
def create_encounter():
    """Create specialty encounter."""
    from flask import request

    data = request.get_json() or {}
    try:
        encounter = SpecialtyEncounterService.create_encounter(get_jwt_identity(), data)
        return jsonify(SpecialtyEncounterService.enrich_encounter_payload(encounter)), 201
    except (ValidationError, AccessDeniedError, ResourceNotFoundError) as exc:
        return domain_error_response(exc)


@blueprint.route('/encounters/<int:encounter_id>', methods=['PUT'])
@jwt_required()
def update_encounter(encounter_id):
    """Update specialty encounter."""
    from flask import request

    data = request.get_json() or {}
    try:
        encounter = SpecialtyEncounterService.update_encounter(
            encounter_id=encounter_id,
            current_user_id=get_jwt_identity(),
            data=data,
        )
        return jsonify(SpecialtyEncounterService.enrich_encounter_payload(encounter)), 200
    except (ValidationError, AccessDeniedError, ResourceNotFoundError) as exc:
        return domain_error_response(exc)


@blueprint.route('/encounters/<int:encounter_id>', methods=['DELETE'])
@jwt_required()
def delete_encounter(encounter_id):
    """Delete specialty encounter."""
    try:
        SpecialtyEncounterService.delete_encounter(encounter_id, get_jwt_identity())
        return jsonify({'msg': 'Specialty encounter deleted'}), 200
    except (ValidationError, AccessDeniedError, ResourceNotFoundError) as exc:
        return domain_error_response(exc)
