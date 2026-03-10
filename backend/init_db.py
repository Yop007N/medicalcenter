# -*- coding: utf-8 -*-
"""
Database initialization script
Creates all tables and optionally seeds initial data
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from app import create_app
from app.extensions import db
from app.models import User, Professional, Patient


def init_database():
    """Initialize database with tables"""
    app = create_app('development')

    with app.app_context():
        print("Creating database tables...")
        db.create_all()
        print("Tables created successfully!")

        # Check if admin user exists
        admin = User.query.filter_by(email='admin@medical.com').first()

        if not admin:
            print("\nCreating default admin user...")
            admin = User(
                email='admin@medical.com',
                first_name='Admin',
                last_name='User',
                role='admin',
                is_active=True
            )
            admin.set_password(os.getenv('INIT_ADMIN_PASSWORD', 'admin123'))
            db.session.add(admin)

            # Create a sample professional
            print("Creating sample professional...")
            professional = Professional(
                email='doctor@medical.com',
                first_name='Dr. John',
                last_name='Doe',
                role='professional',
                license_number='MED-12345',
                specialty='General Medicine',
                phone='+54911234567',
                is_active=True
            )
            professional.set_password(os.getenv('INIT_PROFESSIONAL_PASSWORD', 'doctor123'))
            db.session.add(professional)

            # Create a sample patient
            print("Creating sample patient...")
            patient = Patient(
                email='patient@medical.com',
                first_name='Jane',
                last_name='Smith',
                role='patient',
                phone='+54911234568',
                blood_type='O+',
                is_active=True
            )
            patient.set_password(os.getenv('INIT_PATIENT_PASSWORD', 'patient123'))
            db.session.add(patient)

            db.session.commit()
            print("\nDefault users created!")
            print("\n" + "="*50)
            print("LOGIN CREDENTIALS:")
            print("="*50)
            print("\nAdmin:")
            print("  Email: admin@medical.com")
            print("  Password: [set via INIT_ADMIN_PASSWORD env var]")
            print("\nProfessional (Doctor):")
            print("  Email: doctor@medical.com")
            print("  Password: [set via INIT_PROFESSIONAL_PASSWORD env var]")
            print("\nPatient:")
            print("  Email: patient@medical.com")
            print("  Password: [set via INIT_PATIENT_PASSWORD env var]")
            print("="*50)
        else:
            print("\nDatabase already initialized with default users.")

        print("\nDatabase initialization complete!")


if __name__ == '__main__':
    init_database()
