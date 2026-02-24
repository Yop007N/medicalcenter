# -*- coding: utf-8 -*-
"""Unit tests for app.services.notification_service."""

from app.services.notification_service import NotificationService


def test_send_sms_log_provider_returns_true(monkeypatch):
    monkeypatch.setenv('NOTIFICATION_SMS_PROVIDER', 'log')
    assert NotificationService.send_sms('+5491112345678', 'Test SMS')


def test_send_sms_with_invalid_payload_returns_false(monkeypatch):
    monkeypatch.setenv('NOTIFICATION_SMS_PROVIDER', 'log')
    assert not NotificationService.send_sms('', 'Test SMS')
    assert not NotificationService.send_sms('+5491112345678', '')


def test_send_sms_unknown_provider_returns_false(monkeypatch):
    monkeypatch.setenv('NOTIFICATION_SMS_PROVIDER', 'twilio')
    assert not NotificationService.send_sms('+5491112345678', 'Test SMS')


def test_send_push_log_provider_returns_true(monkeypatch):
    monkeypatch.setenv('NOTIFICATION_PUSH_PROVIDER', 'log')
    assert NotificationService.send_push_notification(100, 'Hola', 'Mensaje push')


def test_send_push_unknown_provider_returns_false(monkeypatch):
    monkeypatch.setenv('NOTIFICATION_PUSH_PROVIDER', 'firebase')
    assert not NotificationService.send_push_notification(100, 'Hola', 'Mensaje push')

