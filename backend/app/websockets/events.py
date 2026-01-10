# -*- coding: utf-8 -*-
"""
WebSocket event handlers for real-time communication
"""

from flask import request
from flask_socketio import emit, join_room, leave_room, rooms
from flask_jwt_extended import decode_token
from app.extensions import socketio
from app.models.user import User
import logging

logger = logging.getLogger(__name__)


# Dictionary to store user sessions {user_id: sid}
active_connections = {}


@socketio.on('connect')
def handle_connect():
    """
    Handle client connection
    Authenticate user via JWT token
    """
    try:
        # Get token from query params or headers
        token = request.args.get('token')

        if not token:
            logger.warning(f"Connection attempt without token from {request.sid}")
            return False  # Reject connection

        # Decode and validate JWT
        try:
            decoded = decode_token(token)
            user_id = decoded['sub']
        except Exception as e:
            logger.error(f"Invalid token: {str(e)}")
            return False

        # Store connection
        active_connections[int(user_id)] = request.sid

        # Join user-specific room
        join_room(f"user_{user_id}")

        logger.info(f"User {user_id} connected with session {request.sid}")

        # Send connection confirmation
        emit('connected', {
            'message': 'Successfully connected to real-time server',
            'user_id': user_id,
            'session_id': request.sid
        })

        return True

    except Exception as e:
        logger.error(f"Connection error: {str(e)}")
        return False


@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    try:
        # Find and remove user from active connections
        user_id = None
        for uid, sid in list(active_connections.items()):
            if sid == request.sid:
                user_id = uid
                del active_connections[uid]
                break

        if user_id:
            logger.info(f"User {user_id} disconnected")
            leave_room(f"user_{user_id}")
        else:
            logger.info(f"Unknown session {request.sid} disconnected")

    except Exception as e:
        logger.error(f"Disconnect error: {str(e)}")


@socketio.on('join_room')
def handle_join_room(data):
    """
    Join a specific room (e.g., appointment updates, notifications)

    Args:
        data: {'room': 'room_name'}
    """
    try:
        room = data.get('room')
        if room:
            join_room(room)
            logger.info(f"Session {request.sid} joined room {room}")
            emit('room_joined', {'room': room, 'message': f'Joined room {room}'})
        else:
            emit('error', {'message': 'Room name required'})
    except Exception as e:
        logger.error(f"Join room error: {str(e)}")
        emit('error', {'message': str(e)})


@socketio.on('leave_room')
def handle_leave_room(data):
    """
    Leave a specific room

    Args:
        data: {'room': 'room_name'}
    """
    try:
        room = data.get('room')
        if room:
            leave_room(room)
            logger.info(f"Session {request.sid} left room {room}")
            emit('room_left', {'room': room, 'message': f'Left room {room}'})
        else:
            emit('error', {'message': 'Room name required'})
    except Exception as e:
        logger.error(f"Leave room error: {str(e)}")
        emit('error', {'message': str(e)})


# =============== APPOINTMENT EVENTS ===============

@socketio.on('subscribe_appointments')
def handle_subscribe_appointments(data):
    """
    Subscribe to appointment updates

    Args:
        data: {'professional_id': int} or {'patient_id': int}
    """
    try:
        professional_id = data.get('professional_id')
        patient_id = data.get('patient_id')

        if professional_id:
            room = f"appointments_professional_{professional_id}"
            join_room(room)
            emit('subscribed', {
                'type': 'appointments',
                'room': room,
                'message': 'Subscribed to professional appointment updates'
            })
        elif patient_id:
            room = f"appointments_patient_{patient_id}"
            join_room(room)
            emit('subscribed', {
                'type': 'appointments',
                'room': room,
                'message': 'Subscribed to patient appointment updates'
            })
        else:
            emit('error', {'message': 'professional_id or patient_id required'})

    except Exception as e:
        logger.error(f"Subscribe appointments error: {str(e)}")
        emit('error', {'message': str(e)})


def emit_appointment_created(appointment):
    """
    Broadcast new appointment creation

    Args:
        appointment: Appointment model instance
    """
    try:
        data = {
            'event': 'appointment_created',
            'appointment': {
                'id': appointment.id,
                'patient_id': appointment.patient_id,
                'professional_id': appointment.professional_id,
                'appointment_date': appointment.appointment_date.isoformat(),
                'status': appointment.status,
                'appointment_type': appointment.appointment_type
            }
        }

        # Emit to professional room
        socketio.emit('appointment_created', data,
                     room=f"appointments_professional_{appointment.professional_id}")

        # Emit to patient room
        socketio.emit('appointment_created', data,
                     room=f"appointments_patient_{appointment.patient_id}")

        logger.info(f"Broadcasted appointment_created for appointment {appointment.id}")

    except Exception as e:
        logger.error(f"Error emitting appointment_created: {str(e)}")


def emit_appointment_updated(appointment, changes=None):
    """
    Broadcast appointment update

    Args:
        appointment: Appointment model instance
        changes: Dict with changed fields
    """
    try:
        data = {
            'event': 'appointment_updated',
            'appointment': {
                'id': appointment.id,
                'patient_id': appointment.patient_id,
                'professional_id': appointment.professional_id,
                'appointment_date': appointment.appointment_date.isoformat(),
                'status': appointment.status,
                'appointment_type': appointment.appointment_type
            },
            'changes': changes or {}
        }

        # Emit to professional room
        socketio.emit('appointment_updated', data,
                     room=f"appointments_professional_{appointment.professional_id}")

        # Emit to patient room
        socketio.emit('appointment_updated', data,
                     room=f"appointments_patient_{appointment.patient_id}")

        logger.info(f"Broadcasted appointment_updated for appointment {appointment.id}")

    except Exception as e:
        logger.error(f"Error emitting appointment_updated: {str(e)}")


def emit_appointment_deleted(appointment_id, patient_id, professional_id):
    """
    Broadcast appointment deletion

    Args:
        appointment_id: ID of deleted appointment
        patient_id: Patient ID
        professional_id: Professional ID
    """
    try:
        data = {
            'event': 'appointment_deleted',
            'appointment_id': appointment_id
        }

        # Emit to professional room
        socketio.emit('appointment_deleted', data,
                     room=f"appointments_professional_{professional_id}")

        # Emit to patient room
        socketio.emit('appointment_deleted', data,
                     room=f"appointments_patient_{patient_id}")

        logger.info(f"Broadcasted appointment_deleted for appointment {appointment_id}")

    except Exception as e:
        logger.error(f"Error emitting appointment_deleted: {str(e)}")


# =============== NOTIFICATION EVENTS ===============

@socketio.on('subscribe_notifications')
def handle_subscribe_notifications(data):
    """
    Subscribe to user notifications

    Args:
        data: {'user_id': int}
    """
    try:
        user_id = data.get('user_id')

        if user_id:
            room = f"notifications_user_{user_id}"
            join_room(room)
            emit('subscribed', {
                'type': 'notifications',
                'room': room,
                'message': 'Subscribed to notifications'
            })
        else:
            emit('error', {'message': 'user_id required'})

    except Exception as e:
        logger.error(f"Subscribe notifications error: {str(e)}")
        emit('error', {'message': str(e)})


def emit_notification(user_id, notification):
    """
    Send notification to specific user

    Args:
        user_id: User ID to send notification to
        notification: Notification data dict
    """
    try:
        data = {
            'event': 'notification',
            'notification': notification
        }

        # Emit to user-specific room
        socketio.emit('notification', data, room=f"user_{user_id}")

        # Also emit to notifications room
        socketio.emit('notification', data, room=f"notifications_user_{user_id}")

        logger.info(f"Sent notification to user {user_id}")

    except Exception as e:
        logger.error(f"Error emitting notification: {str(e)}")


def broadcast_notification(notification):
    """
    Broadcast notification to all connected clients

    Args:
        notification: Notification data dict
    """
    try:
        data = {
            'event': 'broadcast_notification',
            'notification': notification
        }

        socketio.emit('broadcast_notification', data, broadcast=True)

        logger.info("Broadcasted notification to all clients")

    except Exception as e:
        logger.error(f"Error broadcasting notification: {str(e)}")


# =============== UTILITY EVENTS ===============

@socketio.on('ping')
def handle_ping(data):
    """Handle ping from client to keep connection alive"""
    emit('pong', {'timestamp': data.get('timestamp') if data else None})


@socketio.on('get_active_users')
def handle_get_active_users():
    """Get count of active users (admin only)"""
    try:
        emit('active_users_count', {
            'count': len(active_connections),
            'users': list(active_connections.keys())
        })
    except Exception as e:
        logger.error(f"Error getting active users: {str(e)}")
        emit('error', {'message': str(e)})


# Export functions for use in other modules
__all__ = [
    'emit_appointment_created',
    'emit_appointment_updated',
    'emit_appointment_deleted',
    'emit_notification',
    'broadcast_notification'
]
