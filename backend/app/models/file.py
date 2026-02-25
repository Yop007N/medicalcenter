# -*- coding: utf-8 -*-
"""
File Model - Medical files and documents (lab results, images, etc.)
"""

from datetime import datetime
from app.extensions import db
from app.models.sync_versioning import register_sync_version_listener


class File(db.Model):
    """File model for medical documents and images"""

    __tablename__ = 'files'

    id = db.Column(db.Integer, primary_key=True)
    medical_record_id = db.Column(db.Integer, db.ForeignKey('medical_records.id'), nullable=False)

    # File information
    filename = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(50))  # lab_result, xray, mri, prescription, etc.
    mime_type = db.Column(db.String(100))
    file_size = db.Column(db.Integer)  # Size in bytes

    # Storage location
    storage_type = db.Column(db.String(20), default='cloud')  # cloud, local
    file_path = db.Column(db.String(500))  # S3 key or local path
    thumbnail_path = db.Column(db.String(500))

    # Metadata
    description = db.Column(db.Text)
    uploaded_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    sync_version = db.Column(db.Integer, default=1, nullable=False)

    def __repr__(self):
        return f'<File {self.filename}>'


register_sync_version_listener(File)
