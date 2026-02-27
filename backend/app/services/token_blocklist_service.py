# -*- coding: utf-8 -*-
"""
JWT token blocklist service.

Uses Redis when available and falls back to an in-memory store for test/dev
resilience.
"""

from __future__ import annotations

import threading
import time
from typing import Dict

from app.extensions import redis_client


class TokenBlocklistService:
    """Manage revoked JWT identifiers (JTI)."""

    _in_memory_blocklist: Dict[str, float] = {}
    _lock = threading.Lock()
    _redis_prefix = "jwt:blocklist:"

    @classmethod
    def revoke(cls, jti: str, expires_at_epoch: int | None) -> None:
        """Revoke token by JTI until its expiration timestamp."""
        if not jti:
            return

        now = int(time.time())
        ttl = max(int((expires_at_epoch or now) - now), 1)
        redis_key = f"{cls._redis_prefix}{jti}"

        try:
            redis_client.setex(redis_key, ttl, "1")
            return
        except Exception:
            # Fallback for tests/dev when Redis is not reachable.
            pass

        with cls._lock:
            cls._in_memory_blocklist[jti] = float(now + ttl)
            cls._prune_expired_locked(now)

    @classmethod
    def is_revoked(cls, jti: str) -> bool:
        """Check if token JTI has been revoked."""
        if not jti:
            return False

        redis_key = f"{cls._redis_prefix}{jti}"
        try:
            return bool(redis_client.exists(redis_key))
        except Exception:
            # Fall through to in-memory fallback.
            pass

        now = int(time.time())
        with cls._lock:
            cls._prune_expired_locked(now)
            expires_at = cls._in_memory_blocklist.get(jti)
            return bool(expires_at and expires_at > now)

    @classmethod
    def reset_for_tests(cls) -> None:
        """Reset in-memory fallback store (test helper)."""
        with cls._lock:
            cls._in_memory_blocklist.clear()

    @classmethod
    def _prune_expired_locked(cls, now_epoch: int) -> None:
        expired_jtis = [jti for jti, exp in cls._in_memory_blocklist.items() if exp <= now_epoch]
        for jti in expired_jtis:
            cls._in_memory_blocklist.pop(jti, None)
