# -*- coding: utf-8 -*-
"""
Helpers for per-record sync version tracking.
"""

from sqlalchemy import event, inspect


def register_sync_version_listener(model_class):
    """
    Ensure sync_version increases when a tracked model is updated.

    The listener ignores direct sync_version assignments to avoid
    double-increments when a service sets the value explicitly.
    """

    @event.listens_for(model_class, "before_update", propagate=True)
    def _bump_sync_version(_mapper, _connection, target):
        if not hasattr(target, "sync_version"):
            return

        state = inspect(target)
        sync_attr = state.attrs.sync_version
        if sync_attr.history.has_changes():
            return

        meaningful_change = any(
            attr.history.has_changes()
            for attr in state.attrs
            if attr.key not in {"sync_version", "updated_at"}
        )
        if not meaningful_change:
            return

        current = getattr(target, "sync_version", 1) or 1
        target.sync_version = int(current) + 1

