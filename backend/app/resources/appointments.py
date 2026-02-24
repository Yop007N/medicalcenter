# -*- coding: utf-8 -*-
"""Appointment CRUD endpoints."""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.schemas.appointment_schema import AppointmentSchema
from app.services.appointment_service import AppointmentService
from app.services.exceptions import (
    AccessDeniedError,
    ConflictError,
    ResourceNotFoundError,
    ValidationError,
)
from app.utils.decorators import professional_required
from app.utils.helpers import get_pagination_params

blueprint = Blueprint("appointments", __name__, url_prefix="/api/appointments")

appointment_schema = AppointmentSchema()
appointments_schema = AppointmentSchema(many=True)


def _resolve_current_user():
    """Resolve current JWT identity to a concrete user."""
    return AppointmentService.get_current_user(get_jwt_identity())


def _service_error_response(error):
    """Map service exceptions to API responses."""
    status_map = {
        ValidationError: 400,
        AccessDeniedError: 403,
        ResourceNotFoundError: 404,
        ConflictError: 409,
    }
    status = status_map.get(type(error), 400)
    payload = {"msg": error.message}
    payload.update(error.details)
    return jsonify(payload), status


@blueprint.route("", methods=["GET"])
@jwt_required()
def list_appointments():
    """List appointments with optional filters and pagination."""
    try:
        current_user = _resolve_current_user()
        page, per_page = get_pagination_params(request)
        filters = {
            "professional_id": request.args.get("professional_id", type=int),
            "patient_id": request.args.get("patient_id", type=int),
            "status": request.args.get("status"),
            "date_from": request.args.get("date_from"),
            "date_to": request.args.get("date_to"),
        }
        pagination = AppointmentService.get_appointments(
            current_user=current_user,
            filters=filters,
            page=page,
            per_page=per_page,
        )
        return jsonify(
            {
                "items": appointments_schema.dump(pagination.items),
                "total": pagination.total,
                "page": pagination.page,
                "pages": pagination.pages,
                "per_page": per_page,
            }
        ), 200
    except (ValidationError, AccessDeniedError) as error:
        return _service_error_response(error)


@blueprint.route("/<int:appointment_id>", methods=["GET"])
@jwt_required()
def get_appointment(appointment_id):
    """Get appointment by id."""
    try:
        current_user = _resolve_current_user()
        appointment = AppointmentService.get_appointment(
            current_user=current_user,
            appointment_id=appointment_id,
        )
        return jsonify(appointment_schema.dump(appointment)), 200
    except (AccessDeniedError, ResourceNotFoundError) as error:
        return _service_error_response(error)


@blueprint.route("", methods=["POST"])
@jwt_required()
def create_appointment():
    """Create new appointment."""
    try:
        current_user = _resolve_current_user()
        data = request.get_json() or {}
        appointment = AppointmentService.create_appointment(
            current_user=current_user,
            data=data,
        )
        return jsonify(appointment_schema.dump(appointment)), 201
    except (ValidationError, AccessDeniedError, ConflictError) as error:
        return _service_error_response(error)


@blueprint.route("/<int:appointment_id>", methods=["PUT"])
@jwt_required()
def update_appointment(appointment_id):
    """Update appointment."""
    try:
        current_user = _resolve_current_user()
        data = request.get_json() or {}
        appointment = AppointmentService.update_appointment(
            current_user=current_user,
            appointment_id=appointment_id,
            data=data,
        )
        return jsonify(appointment_schema.dump(appointment)), 200
    except (ValidationError, AccessDeniedError, ResourceNotFoundError, ConflictError) as error:
        return _service_error_response(error)


@blueprint.route("/<int:appointment_id>", methods=["DELETE"])
@jwt_required()
def cancel_appointment(appointment_id):
    """Cancel appointment."""
    try:
        current_user = _resolve_current_user()
        reason = request.args.get("reason")
        AppointmentService.cancel_appointment(
            current_user=current_user,
            appointment_id=appointment_id,
            reason=reason,
        )
        return jsonify({"msg": "Appointment cancelled"}), 200
    except (AccessDeniedError, ResourceNotFoundError) as error:
        return _service_error_response(error)


@blueprint.route("/<int:appointment_id>/confirm", methods=["POST"])
@professional_required
def confirm_appointment(appointment_id):
    """Confirm appointment."""
    try:
        current_user = _resolve_current_user()
        appointment = AppointmentService.confirm_appointment(
            current_user=current_user,
            appointment_id=appointment_id,
        )
        return jsonify(appointment_schema.dump(appointment)), 200
    except (AccessDeniedError, ResourceNotFoundError) as error:
        return _service_error_response(error)


@blueprint.route("/calendar", methods=["GET"])
@jwt_required()
def get_calendar():
    """Get calendar view of appointments."""
    try:
        current_user = _resolve_current_user()
        appointments = AppointmentService.get_calendar(
            current_user=current_user,
            professional_id=request.args.get("professional_id"),
            date_from=request.args.get("date_from"),
            date_to=request.args.get("date_to"),
        )
        return jsonify(appointments_schema.dump(appointments)), 200
    except (ValidationError, AccessDeniedError) as error:
        return _service_error_response(error)
