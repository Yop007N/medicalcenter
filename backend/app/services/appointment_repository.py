# -*- coding: utf-8 -*-
"""Data access layer for appointments."""

from app.extensions import db
from app.models.appointment import Appointment


class AppointmentRepository:
    """Persistence operations for Appointment model."""

    ACTIVE_CONFLICT_STATUSES = ("scheduled", "confirmed")

    @staticmethod
    def list_paginated(filters, page, per_page):
        """Return paginated appointments using normalized filters."""
        query = Appointment.query

        professional_id = filters.get("professional_id")
        if professional_id:
            query = query.filter_by(professional_id=int(professional_id))

        patient_id = filters.get("patient_id")
        if patient_id:
            query = query.filter_by(patient_id=int(patient_id))

        status = filters.get("status")
        if status:
            query = query.filter_by(status=status)

        date_from = filters.get("date_from")
        if date_from:
            query = query.filter(Appointment.appointment_date >= date_from)

        date_to = filters.get("date_to")
        if date_to:
            query = query.filter(Appointment.appointment_date <= date_to)

        return query.order_by(Appointment.appointment_date).paginate(
            page=page,
            per_page=per_page,
            error_out=False,
        )

    @staticmethod
    def list_by_date_range(professional_id, start_date, end_date, patient_id=None):
        """Return appointments in date window."""
        query = Appointment.query.filter(
            Appointment.professional_id == professional_id,
            Appointment.appointment_date >= start_date,
            Appointment.appointment_date <= end_date,
        )

        if patient_id:
            query = query.filter(Appointment.patient_id == patient_id)

        return query.order_by(Appointment.appointment_date).all()

    @staticmethod
    def get_by_id(appointment_id):
        """Get appointment by identifier."""
        return Appointment.query.get(appointment_id)

    @classmethod
    def find_conflict(cls, professional_id, appointment_date, exclude_id=None):
        """Detect active slot conflict for a professional."""
        # Optimization: Use with_entities to fetch only ID, avoiding joined loads
        query = Appointment.query.with_entities(Appointment.id).filter(
            Appointment.professional_id == professional_id,
            Appointment.appointment_date == appointment_date,
            Appointment.status.in_(cls.ACTIVE_CONFLICT_STATUSES),
        )
        if exclude_id is not None:
            query = query.filter(Appointment.id != exclude_id)
        return query.first()

    @staticmethod
    def create(appointment):
        """Persist a new appointment instance."""
        db.session.add(appointment)
        db.session.commit()
        return appointment

    @staticmethod
    def commit():
        """Persist current transactional changes."""
        db.session.commit()
