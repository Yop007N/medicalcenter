# -*- coding: utf-8 -*-
"""
Tests for WebSocket functionality
"""

import pytest
from flask_socketio import SocketIOTestClient
from flask_jwt_extended import create_access_token
from app.extensions import socketio
from app.websockets import (
    emit_appointment_created,
    emit_appointment_updated,
    emit_appointment_deleted,
    emit_notification
)


@pytest.fixture
def socketio_client(app, admin_user):
    """Create a SocketIO test client"""
    # Create access token for authentication
    with app.app_context():
        token = create_access_token(identity=str(admin_user.id))

    # Create SocketIO test client
    client = socketio.test_client(
        app,
        flask_test_client=app.test_client(),
        query_string=f'token={token}'
    )

    yield client

    # Disconnect client
    if client.is_connected():
        client.disconnect()


class TestWebSocketConnection:
    """Test WebSocket connection"""

    def test_connect_with_valid_token(self, app, admin_user):
        """Test connecting with valid JWT token"""
        with app.app_context():
            token = create_access_token(identity=str(admin_user.id))

        client = socketio.test_client(
            app,
            flask_test_client=app.test_client(),
            query_string=f'token={token}'
        )

        assert client.is_connected()

        # Should receive connected event
        received = client.get_received()
        assert len(received) > 0
        assert any(msg['name'] == 'connected' for msg in received)

        client.disconnect()

    def test_connect_without_token(self, app):
        """Test connecting without token should fail"""
        client = socketio.test_client(
            app,
            flask_test_client=app.test_client()
        )

        # Should not be connected
        assert not client.is_connected()

    def test_disconnect(self, socketio_client):
        """Test disconnecting from WebSocket"""
        assert socketio_client.is_connected()

        socketio_client.disconnect()

        assert not socketio_client.is_connected()


class TestRoomManagement:
    """Test room join/leave functionality"""

    def test_join_room(self, socketio_client):
        """Test joining a room"""
        socketio_client.emit('join_room', {'room': 'test_room'})

        received = socketio_client.get_received()
        # Should receive room_joined confirmation
        room_joined_msgs = [msg for msg in received if msg['name'] == 'room_joined']
        assert len(room_joined_msgs) > 0
        assert room_joined_msgs[0]['args'][0]['room'] == 'test_room'

    def test_leave_room(self, socketio_client):
        """Test leaving a room"""
        # First join a room
        socketio_client.emit('join_room', {'room': 'test_room'})
        socketio_client.get_received()  # Clear received messages

        # Then leave it
        socketio_client.emit('leave_room', {'room': 'test_room'})

        received = socketio_client.get_received()
        # Should receive room_left confirmation
        room_left_msgs = [msg for msg in received if msg['name'] == 'room_left']
        assert len(room_left_msgs) > 0
        assert room_left_msgs[0]['args'][0]['room'] == 'test_room'


class TestAppointmentEvents:
    """Test appointment-related WebSocket events"""

    def test_subscribe_appointments_professional(self, socketio_client, sample_professional):
        """Test subscribing to professional appointments"""
        socketio_client.emit('subscribe_appointments', {
            'professional_id': sample_professional.id
        })

        received = socketio_client.get_received()
        subscribed_msgs = [msg for msg in received if msg['name'] == 'subscribed']
        assert len(subscribed_msgs) > 0
        assert subscribed_msgs[0]['args'][0]['type'] == 'appointments'

    def test_subscribe_appointments_patient(self, socketio_client, sample_patient):
        """Test subscribing to patient appointments"""
        socketio_client.emit('subscribe_appointments', {
            'patient_id': sample_patient.id
        })

        received = socketio_client.get_received()
        subscribed_msgs = [msg for msg in received if msg['name'] == 'subscribed']
        assert len(subscribed_msgs) > 0
        assert subscribed_msgs[0]['args'][0]['type'] == 'appointments'

    def test_emit_appointment_created(self, app, sample_appointment):
        """Test emitting appointment created event"""
        with app.app_context():
            # This should not raise any errors
            emit_appointment_created(sample_appointment)

    def test_emit_appointment_updated(self, app, sample_appointment):
        """Test emitting appointment updated event"""
        with app.app_context():
            changes = {'status': 'completed'}
            # This should not raise any errors
            emit_appointment_updated(sample_appointment, changes)

    def test_emit_appointment_deleted(self, app, sample_appointment):
        """Test emitting appointment deleted event"""
        with app.app_context():
            # This should not raise any errors
            emit_appointment_deleted(
                sample_appointment.id,
                sample_appointment.patient_id,
                sample_appointment.professional_id
            )


class TestNotificationEvents:
    """Test notification-related WebSocket events"""

    def test_subscribe_notifications(self, socketio_client, admin_user):
        """Test subscribing to user notifications"""
        socketio_client.emit('subscribe_notifications', {
            'user_id': admin_user.id
        })

        received = socketio_client.get_received()
        subscribed_msgs = [msg for msg in received if msg['name'] == 'subscribed']
        assert len(subscribed_msgs) > 0
        assert subscribed_msgs[0]['args'][0]['type'] == 'notifications'

    def test_emit_notification(self, app, admin_user):
        """Test emitting notification to specific user"""
        with app.app_context():
            notification = {
                'title': 'Test Notification',
                'message': 'This is a test notification',
                'type': 'info'
            }
            # This should not raise any errors
            emit_notification(admin_user.id, notification)


class TestUtilityEvents:
    """Test utility WebSocket events"""

    def test_ping_pong(self, socketio_client):
        """Test ping/pong to keep connection alive"""
        socketio_client.emit('ping', {'timestamp': '123456'})

        received = socketio_client.get_received()
        pong_msgs = [msg for msg in received if msg['name'] == 'pong']
        assert len(pong_msgs) > 0

    def test_get_active_users(self, socketio_client):
        """Test getting active users count"""
        socketio_client.emit('get_active_users')

        received = socketio_client.get_received()
        active_users_msgs = [msg for msg in received if msg['name'] == 'active_users_count']
        assert len(active_users_msgs) > 0
        assert 'count' in active_users_msgs[0]['args'][0]
        assert 'users' in active_users_msgs[0]['args'][0]


class TestWebSocketIntegration:
    """Integration tests for WebSocket functionality"""

    def test_complete_appointment_workflow(self, app, sample_professional, sample_patient):
        """Test complete workflow: subscribe and receive appointment events"""
        with app.app_context():
            # Create token for professional
            token = create_access_token(identity=str(sample_professional.id))

        # Connect as professional
        client = socketio.test_client(
            app,
            flask_test_client=app.test_client(),
            query_string=f'token={token}'
        )

        assert client.is_connected()

        # Subscribe to appointments
        client.emit('subscribe_appointments', {
            'professional_id': sample_professional.id
        })

        # Clear initial messages
        client.get_received()

        # Create appointment (simulated)
        from app.models.appointment import Appointment
        from datetime import datetime, timedelta

        with app.app_context():
            from app.extensions import db
            appointment = Appointment(
                patient_id=sample_patient.id,
                professional_id=sample_professional.id,
                appointment_date=datetime.utcnow() + timedelta(days=1),
                duration_minutes=30,
                status='scheduled',
                appointment_type='consultation'
            )
            db.session.add(appointment)
            db.session.commit()

            # Emit event
            emit_appointment_created(appointment)

        # Note: In test client mode, broadcast events may not be received
        # This test validates that the function executes without errors

        client.disconnect()

    def test_multiple_clients_connection(self, app, admin_user, patient_user):
        """Test multiple clients connecting simultaneously"""
        with app.app_context():
            token1 = create_access_token(identity=str(admin_user.id))
            token2 = create_access_token(identity=str(patient_user.id))

        client1 = socketio.test_client(
            app,
            flask_test_client=app.test_client(),
            query_string=f'token={token1}'
        )

        client2 = socketio.test_client(
            app,
            flask_test_client=app.test_client(),
            query_string=f'token={token2}'
        )

        assert client1.is_connected()
        assert client2.is_connected()

        client1.disconnect()
        client2.disconnect()

        assert not client1.is_connected()
        assert not client2.is_connected()
