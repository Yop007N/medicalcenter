# -*- coding: utf-8 -*-
"""
Tests for security configuration
"""

import pytest
from datetime import timedelta
from app.config import Config, DevelopmentConfig, ProductionConfig

class TestSecurityConfig:
    """Tests for security configuration settings"""

    def test_jwt_access_token_expiration_security(self):
        """Test that access token expiration is secure (<= 60 minutes)"""
        # We check the base Config as it sets the default
        expires = Config.JWT_ACCESS_TOKEN_EXPIRES
        assert isinstance(expires, timedelta)
        # Should be short-lived (e.g., <= 60 minutes)
        assert expires.total_seconds() <= 60 * 60, "Access token expiration is too long (> 60 minutes)"

    def test_jwt_refresh_token_expiration_security(self):
        """Test that refresh token expiration is reasonable (<= 30 days)"""
        expires = Config.JWT_REFRESH_TOKEN_EXPIRES
        assert isinstance(expires, timedelta)
        # Should be reasonable (e.g., <= 30 days)
        assert expires.total_seconds() <= 30 * 24 * 60 * 60, "Refresh token expiration is too long (> 30 days)"
