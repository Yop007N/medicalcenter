# -*- coding: utf-8 -*-
"""
WebSockets module for real-time communication
"""

from app.websockets.events import (
    emit_appointment_created,
    emit_appointment_updated,
    emit_appointment_deleted,
    emit_notification,
    broadcast_notification
)

__all__ = [
    'emit_appointment_created',
    'emit_appointment_updated',
    'emit_appointment_deleted',
    'emit_notification',
    'broadcast_notification'
]
