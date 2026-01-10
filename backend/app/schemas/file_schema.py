# -*- coding: utf-8 -*-
"""
File Schema - Serialization for File model
"""

from marshmallow import fields
from app.extensions import ma
from app.models.file import File


class FileSchema(ma.SQLAlchemyAutoSchema):
    """File schema for serialization"""

    class Meta:
        model = File
        load_instance = True
        include_fk = True
        exclude = ('medical_record',)  # Exclude backref to avoid circular dependency
