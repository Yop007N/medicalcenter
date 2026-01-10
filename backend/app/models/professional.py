# -*- coding: utf-8 -*-
"""
Professional Model - Healthcare professional (doctor, nurse, etc.)
"""

from app.extensions import db
from app.models.user import User


class Professional(User):
    """Healthcare professional model"""

    __tablename__ = 'professionals'

    id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    license_number = db.Column(db.String(50), unique=True, nullable=False)
    specialty = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    address = db.Column(db.String(255))

    # Relationships
    appointments = db.relationship('Appointment', backref=db.backref('professional', lazy='joined'), lazy='dynamic')
    medical_records = db.relationship('MedicalRecord', backref='professional', lazy='dynamic')

    __mapper_args__ = {
        'polymorphic_identity': 'professional',
    }

    def __repr__(self):
        return f'<Professional {self.first_name} {self.last_name} - {self.specialty}>'
