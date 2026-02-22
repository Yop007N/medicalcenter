# -*- coding: utf-8 -*-
"""
Sync Log Model - Tracks cloud-local synchronization operations
"""

from datetime import datetime
from app.extensions import db


class SyncLog(db.Model):
    """Sync log model for tracking cloud-local data synchronization"""

    __tablename__ = 'sync_logs'

    id = db.Column(db.Integer, primary_key=True)

    # Sync details
    entity_type = db.Column(db.String(50), nullable=False)  # appointment, patient, etc.
    entity_id = db.Column(db.Integer, nullable=False)
    operation = db.Column(db.String(20), nullable=False)  # create, update, delete
    direction = db.Column(db.String(20), nullable=False)  # cloud_to_local, local_to_cloud
    idempotency_key = db.Column(db.String(128), index=True)
    external_entity_ref = db.Column(db.String(128))  # e.g. local-123 from client
    result_entity_id = db.Column(db.Integer)  # ID generated/affected on server side

    # Status
    status = db.Column(
        db.String(20),
        default='pending'
    )  # pending, in_progress, completed, failed
    error_message = db.Column(db.Text)
    conflict_payload = db.Column(db.JSON)
    retry_count = db.Column(db.Integer, default=0)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    completed_at = db.Column(db.DateTime)

    def __repr__(self):
        return f'<SyncLog {self.id} - {self.entity_type}:{self.entity_id}>'
