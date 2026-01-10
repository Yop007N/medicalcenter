# -*- coding: utf-8 -*-
"""
Appointment Schema - Serialization for Appointment model
"""

from marshmallow import fields, validate
from app.extensions import ma
from app.models.appointment import Appointment


class AppointmentSchema(ma.SQLAlchemyAutoSchema):
    """Appointment schema for serialization"""

    class Meta:
        model = Appointment
        load_instance = True
        include_fk = True

    status = fields.Str(
        validate=validate.OneOf(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'])
    )

    # Include nested patient and professional data
    patient = fields.Nested('PatientSchema', only=['id', 'first_name', 'last_name', 'email', 'phone'])
    professional = fields.Nested('ProfessionalSchema', only=['id', 'first_name', 'last_name', 'email', 'specialty'])
