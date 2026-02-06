# -*- coding: utf-8 -*-
"""
Test security configuration
"""

import pytest
from datetime import timedelta
from app.config import Config

def test_jwt_token_expiration_defaults():
    """
    Test that the default JWT token expiration times are secure.
    Access token: 1 day (24 hours) - reduced from 365 days
    Refresh token: 30 days - reduced from 365 days
    """
    # Check that the base Config class has the improved defaults
    assert Config.JWT_ACCESS_TOKEN_EXPIRES == timedelta(days=1)
    assert Config.JWT_REFRESH_TOKEN_EXPIRES == timedelta(days=30)
