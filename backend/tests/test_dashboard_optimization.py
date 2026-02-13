import pytest
import json
from datetime import datetime
from app.models.patient import Patient
from app.models.appointment import Appointment
from app.models.professional import Professional
from app.models.user import User

def test_average_appointments_calculation_fix(client, auth_headers, app):
    """
    Test that average appointments per patient is calculated correctly (Total Appointments / Total Patients).
    Previous implementation had a bug where it returned Total Appointments.
    """
    with app.app_context():
        from app.extensions import db

        # We need to be careful with deleting data as other tests might rely on it if not properly isolated.
        # But db_session fixture should handle rollback.
        # However, here we want to ensure specific counts.

        # Delete existing appointments and patients to start clean
        db.session.query(Appointment).delete()
        db.session.query(Patient).delete()
        # We need to keep the professional used for auth, so we don't delete everything blindly.
        # The auth_headers fixture creates a professional. We should find it or create new ones.

        # Let's count current patients to subtract later or just rely on the math.
        # Ideally, we add our own data and calculate expected result based on total.

        initial_patients = db.session.query(Patient).count()
        initial_appointments = db.session.query(Appointment).count()

        # Create 2 NEW Patients
        p1 = Patient(
            email='p1_opt@example.com',
            password_hash='hash',
            first_name='P1',
            last_name='Opt',
            role='patient',
            is_active=True
        )
        p2 = Patient(
            email='p2_opt@example.com',
            password_hash='hash',
            first_name='P2',
            last_name='Opt',
            role='patient',
            is_active=True
        )
        db.session.add(p1)
        db.session.add(p2)
        db.session.commit()

        # Create 4 appointments for P1
        # We need a professional ID. We can use one if exists or create one.
        prof = db.session.query(Professional).first()
        if not prof:
             prof = Professional(
                email='doc_opt@example.com',
                password_hash='hash',
                first_name='Doc',
                last_name='Opt',
                role='professional',
                license_number='DOC123',
                specialty='General'
            )
             db.session.add(prof)
             db.session.commit()

        for i in range(4):
            appt = Appointment(
                patient_id=p1.id,
                professional_id=prof.id,
                appointment_date=datetime.utcnow(),
                status='scheduled'
            )
            db.session.add(appt)
        db.session.commit()

        # Update totals
        total_patients = initial_patients + 2
        total_appointments = initial_appointments + 4

        expected_avg = total_appointments / total_patients if total_patients > 0 else 0

    response = client.get('/api/dashboard/patients/stats', headers=auth_headers)
    if response.status_code != 200:
        print(f"Error Response: {response.data}")
    assert response.status_code == 200
    data = json.loads(response.data)

    avg = data['metrics']['avg_appointments_per_patient']

    # We use round to avoid float precision issues, though exact match is expected for simple division
    assert abs(avg - expected_avg) < 0.01, f"Expected average {expected_avg}, got {avg}. Totals: {total_appointments}/{total_patients}"
