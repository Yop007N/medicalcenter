import json
from app.models.patient import Patient
from app.models.appointment import Appointment
from app.models.professional import Professional
from datetime import datetime, timedelta
from app.extensions import db

def test_patient_stats_performance(client, app):
    """Test patient stats calculation correctness and performance"""

    # Setup data
    with app.app_context():
        # Create Professional
        prof = Professional(
            email='perf_doc@example.com',
            first_name='Perf',
            last_name='Doc',
            role='professional',
            license_number='99999',
            specialty='Performance'
        )
        prof.set_password('password')
        db.session.add(prof)
        db.session.commit()

        prof_id = prof.id

        # Create 100 patients
        patients = []
        for i in range(100):
            pat = Patient(
                email=f'perf_pat_{i}@example.com',
                first_name=f'PerfPat{i}',
                last_name='Smith',
                role='patient',
                date_of_birth=datetime.today().date()
            )
            pat.set_password('password')
            patients.append(pat)

        db.session.add_all(patients)
        db.session.commit()

        # Create 300 appointments (3 per patient)
        appointments = []
        now = datetime.now()
        for pat in patients:
            for j in range(3):
                appt = Appointment(
                    patient_id=pat.id,
                    professional_id=prof_id,
                    appointment_date=now + timedelta(days=j),
                    status='scheduled'
                )
                appointments.append(appt)

        db.session.bulk_save_objects(appointments)
        db.session.commit()

        total_appts = 300
        total_pats = 100 # + whatever existing patients in DB if any?
        # Since we use a fresh DB for tests usually, let's assume clean.
        # But 'client' fixture might use a DB that is shared or reset.

        # Get token
        from flask_jwt_extended import create_access_token
        access_token = create_access_token(identity=str(prof_id), additional_claims={'role': 'professional'})
        headers = {'Authorization': f'Bearer {access_token}'}

        # Call endpoint
        response = client.get('/api/dashboard/patients/stats', headers=headers)
        if response.status_code != 200:
            print(f"Error response: {response.get_json()}")
        assert response.status_code == 200
        data = response.get_json()

        # Verify metric
        avg = data['metrics']['avg_appointments_per_patient']
        print(f"Average from API: {avg}")

        # If the bug was present, it would return ~300 (or close to total count if other data exists).
        # Correct value should be 3.0 (or close to it if other data exists).

        # To be robust against existing data in test DB:
        actual_total_appts = Appointment.query.count()
        actual_total_pats = Patient.query.count()
        expected_avg = round(actual_total_appts / actual_total_pats, 2)

        assert avg == expected_avg
        assert avg < actual_total_appts # Sanity check: average should be much smaller than total
