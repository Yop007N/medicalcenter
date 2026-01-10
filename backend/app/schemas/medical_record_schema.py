# -*- coding: utf-8 -*-
"""
Medical Record Schema - Serialization for MedicalRecord model
"""

from marshmallow import fields
from app.extensions import ma
from app.models.medical_record import MedicalRecord


class MedicalRecordSchema(ma.SQLAlchemyAutoSchema):
    """Medical record schema for serialization"""

    class Meta:
        model = MedicalRecord
        load_instance = True
        include_fk = True

    files = fields.Nested('FileSchema', many=True, exclude=('medical_record',))
