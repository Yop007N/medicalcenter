# -*- coding: utf-8 -*-
"""Schema for specialty encounters."""

from marshmallow import fields

from app.extensions import ma
from app.models.specialty_encounter import SpecialtyEncounter


class SpecialtyEncounterSchema(ma.SQLAlchemyAutoSchema):
    """Serialization contract for specialty module encounters."""

    patient_name = fields.String(dump_only=True)

    class Meta:
        model = SpecialtyEncounter
        include_fk = True
        load_instance = True
