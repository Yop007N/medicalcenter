# -*- coding: utf-8 -*-
"""
Professional Schema - Serialization for Professional model
"""

from marshmallow import fields
from app.extensions import ma
from app.models.professional import Professional


class ProfessionalSchema(ma.SQLAlchemyAutoSchema):
    """Professional schema for serialization"""

    class Meta:
        model = Professional
        load_instance = True
        exclude = ('password_hash',)

    license_number = fields.Str(required=True)
    specialty = fields.Str()
