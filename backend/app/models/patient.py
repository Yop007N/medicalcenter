# -*- coding: utf-8 -*-
"""
Patient Model - Patient user type
"""

from datetime import datetime
from app.extensions import db
from app.models.user import User


class Patient(User):
    """Patient model"""

    __tablename__ = 'patients'

    id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    date_of_birth = db.Column(db.Date)
    phone = db.Column(db.String(20))
    address = db.Column(db.String(255))
    emergency_contact = db.Column(db.String(100))
    emergency_phone = db.Column(db.String(20))
    blood_type = db.Column(db.String(5))
    allergies = db.Column(db.Text)
    medical_history = db.Column(db.Text)

    # Relationships
    appointments = db.relationship('Appointment', backref=db.backref('patient', lazy='joined'), lazy='dynamic')
    medical_records = db.relationship('MedicalRecord', backref='patient', lazy='dynamic')
    budgets = db.relationship('Budget', backref='patient', lazy='dynamic')

    __mapper_args__ = {
        'polymorphic_identity': 'patient',
    }

    @property
    def age(self):
        """Calculate patient age"""
        if self.date_of_birth:
            today = datetime.today()
            return today.year - self.date_of_birth.year - (
                (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
            )
        return None

    def __repr__(self):
        return f'<Patient {self.first_name} {self.last_name}>'
