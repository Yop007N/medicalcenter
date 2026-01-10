# -*- coding: utf-8 -*-
"""
Patient Schema - Serialization for Patient model
"""

from marshmallow import fields
from app.extensions import ma
from app.models.patient import Patient


class PatientSchema(ma.SQLAlchemyAutoSchema):
    """Patient schema for serialization"""

    class Meta:
        model = Patient
        load_instance = True
        exclude = ('password_hash',)

    age = fields.Method('get_age')

    def get_age(self, obj):
        """Calculate and return patient age"""
        return obj.age
