# -*- coding: utf-8 -*-
"""
User Schema - Serialization and validation for User model
"""

from marshmallow import fields, validate
from app.extensions import ma
from app.models.user import User


class UserSchema(ma.SQLAlchemyAutoSchema):
    """User schema for serialization"""

    class Meta:
        model = User
        load_instance = True
        exclude = ('password_hash',)

    email = fields.Email(required=True)
    first_name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    last_name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    role = fields.Str(required=True, validate=validate.OneOf(['admin', 'professional', 'patient']))
