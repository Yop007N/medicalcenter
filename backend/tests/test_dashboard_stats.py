
import unittest
from app import create_app
from app.extensions import db
from app.models.patient import Patient
from app.models.appointment import Appointment
from app.models.professional import Professional
from datetime import datetime

class TestDashboardStats(unittest.TestCase):
    def setUp(self):
        self.app = create_app('test')
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()

        # Create user for auth
        self.client = self.app.test_client()

        # Create professional (needed for appointment)
        self.prof = Professional(
            email='prof@test.com',
            first_name='Prof',
            last_name='Test',
            password_hash='hash',
            role='professional',
            user_type='professional',
            license_number='123'
        )
        db.session.add(self.prof)
        db.session.commit()

        # Get token
        # We need to mock jwt or login.
        # Since we use create_app('test'), we can manually create a token if needed,
        # or just mock the view function logic in a separate test if we want to test logic only.
        # But integration test is better.

        # Actually, let's just test the query logic first to confirm the bug in isolation
        # as I did in the reproduction script, but now as a formal test.

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_avg_appointments_logic(self):
        """
        Test that the average appointments per patient calculation is correct.
        Scenario:
        - 2 Patients
        - P1 has 2 appointments
        - P2 has 4 appointments
        - Total appointments: 6
        - Expected Average: 3.0
        """
        # Create Patients
        p1 = Patient(email='p1@test.com', first_name='P1', last_name='T', role='patient', user_type='patient', password_hash='x')
        p2 = Patient(email='p2@test.com', first_name='P2', last_name='T', role='patient', user_type='patient', password_hash='x')
        db.session.add_all([p1, p2])
        db.session.commit()

        # Create Appointments
        # P1: 2 apps
        for _ in range(2):
            db.session.add(Appointment(patient_id=p1.id, professional_id=self.prof.id, appointment_date=datetime.now()))

        # P2: 4 apps
        for _ in range(4):
            db.session.add(Appointment(patient_id=p2.id, professional_id=self.prof.id, appointment_date=datetime.now()))

        db.session.commit()

        # Replicate the logic from dashboard.py
        from sqlalchemy import func

        # Current implementation in dashboard.py
        subquery = db.session.query(func.count(Appointment.id))\
            .filter(Appointment.patient_id == Patient.id)\
            .correlate(Patient)\
            .scalar_subquery()

        avg_appointments_buggy = db.session.query(
            func.avg(func.coalesce(subquery, 0))
        ).scalar() or 0

        # The buggy implementation returns the Total (6.0) instead of Average (3.0)
        # assert avg_appointments_buggy == 6.0

        print(f"Buggy Result: {avg_appointments_buggy}")

        # Optimized implementation
        total_appointments = db.session.query(func.count(Appointment.id)).scalar() or 0
        total_patients = db.session.query(func.count(Patient.id)).scalar() or 0

        avg_appointments_opt = total_appointments / total_patients if total_patients > 0 else 0

        print(f"Optimized Result: {avg_appointments_opt}")

        self.assertEqual(avg_appointments_opt, 3.0, "Optimized calculation should be correct")

        # This assertion proves the bug exists
        self.assertNotEqual(avg_appointments_buggy, 3.0, "Current implementation is incorrect")

    def test_get_patient_stats_endpoint(self):
        """Test the actual endpoint returns the optimized value"""
        # Create Data
        p1 = Patient(email='p3@test.com', first_name='P3', last_name='T', role='patient', user_type='patient', password_hash='x')
        p2 = Patient(email='p4@test.com', first_name='P4', last_name='T', role='patient', user_type='patient', password_hash='x')
        db.session.add_all([p1, p2])
        db.session.commit()

        # Create Appointments
        # P1: 1 apps
        db.session.add(Appointment(patient_id=p1.id, professional_id=self.prof.id, appointment_date=datetime.now()))
        # P2: 3 apps
        for _ in range(3):
            db.session.add(Appointment(patient_id=p2.id, professional_id=self.prof.id, appointment_date=datetime.now()))
        db.session.commit()

        # Total Patients: 2. Total Appointments: 4. Avg: 2.0.

        # We need to authenticate to access the endpoint
        # Create a password for the professional and login
        # In setUp we set password_hash='hash', which might not work with check_password_hash.
        # We should set a known password hash.

        from werkzeug.security import generate_password_hash
        self.prof.password_hash = generate_password_hash('password')
        db.session.commit()

        # Login
        login_resp = self.client.post('/api/auth/login', json={
            'email': 'prof@test.com',
            'password': 'password'
        })

        if login_resp.status_code != 200:
            print(f"Login failed: {login_resp.data}")

        self.assertEqual(login_resp.status_code, 200)
        access_token = login_resp.json['access_token']
        headers = {'Authorization': f'Bearer {access_token}'}

        response = self.client.get('/api/dashboard/patients/stats', headers=headers)
        if response.status_code != 200:
            print(f"Error response: {response.data}")
        self.assertEqual(response.status_code, 200)

        import json
        data = json.loads(response.data)

        avg = data['metrics']['avg_appointments_per_patient']
        print(f"Endpoint returned avg: {avg}")

        self.assertEqual(avg, 2.0)

if __name__ == '__main__':
    unittest.main()
