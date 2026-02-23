# -*- coding: utf-8 -*-
"""
Pytest configuration and fixtures
"""

import pytest
from unittest.mock import patch
from app import create_app
from app.extensions import db
from app.models.user import User


@pytest.fixture(scope='session')
def app():
    """Create application for testing"""
    app = create_app('test')
    app.config['WTF_CSRF_ENABLED'] = False

    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()


@pytest.fixture(scope='function')
def client(app):
    """Test client"""
    return app.test_client()


@pytest.fixture(scope='function', autouse=True)
def db_session(app):
    """Database session for tests - auto cleans up after each test"""
    with app.app_context():
        yield db.session
        db.session.rollback()
        # Clean up all data after each test
        for table in reversed(db.metadata.sorted_tables):
            db.session.execute(table.delete())
        db.session.commit()


@pytest.fixture(scope='function')
def admin_user(app):
    """Create admin user for testing"""
    with app.app_context():
        user = User(
            email='admin@test.com',
            first_name='Admin',
            last_name='Test',
            role='admin',
            is_active=True
        )
        user.set_password('Admin123')
        db.session.add(user)
        db.session.commit()
        user_id = user.id
        user_email = user.email
        db.session.expunge(user)  # Detach from session

    # Create a simple object to hold user data
    class UserData:
        def __init__(self, id, email):
            self.id = id
            self.email = email

    return UserData(user_id, user_email)


@pytest.fixture(scope='function')
def patient_user(app):
    """Create patient user for testing"""
    with app.app_context():
        user = User(
            email='patient@test.com',
            first_name='Patient',
            last_name='Test',
            role='patient',
            is_active=True
        )
        user.set_password('Patient123')
        db.session.add(user)
        db.session.commit()
        user_id = user.id
        user_email = user.email
        db.session.expunge(user)

    class UserData:
        def __init__(self, id, email):
            self.id = id
            self.email = email

    return UserData(user_id, user_email)


@pytest.fixture(scope='function')
def auth_headers(client, sample_professional):
    """Get authentication headers for professional user"""
    response = client.post('/api/auth/login', json={
        'email': 'testdoc@test.com',
        'password': 'Doctor123'
    })
    token = response.json['access_token']
    return {'Authorization': f'Bearer {token}'}


@pytest.fixture(scope='function')
def admin_auth_headers(client, admin_user):
    """Get authentication headers for admin user"""
    response = client.post('/api/auth/login', json={
        'email': admin_user.email,
        'password': 'Admin123'
    })
    token = response.json['access_token']
    return {'Authorization': f'Bearer {token}'}


@pytest.fixture(scope='function')
def patient_auth_headers(client, patient_user):
    """Get authentication headers for patient user"""
    response = client.post('/api/auth/login', json={
        'email': patient_user.email,
        'password': 'Patient123'
    })
    token = response.json['access_token']
    return {'Authorization': f'Bearer {token}'}


@pytest.fixture(scope='function')
def sample_professional(app):
    """Create a professional for testing"""
    from app.models.professional import Professional

    with app.app_context():
        prof = Professional(
            email='testdoc@test.com',
            first_name='Test',
            last_name='Doctor',
            role='professional',
            license_number='TEST123',
            specialty='General Practice'
        )
        prof.set_password('Doctor123')
        db.session.add(prof)
        db.session.commit()
        prof_id = prof.id
        db.session.expunge(prof)

    class ProfData:
        def __init__(self, id):
            self.id = id

    return ProfData(prof_id)


@pytest.fixture(scope='function')
def sample_patient(app):
    """Create a patient for testing"""
    from app.models.patient import Patient

    with app.app_context():
        patient = Patient(
            email='testpatient@test.com',
            first_name='Test',
            last_name='Patient',
            role='patient'
        )
        patient.set_password('Patient123')
        db.session.add(patient)
        db.session.commit()
        patient_id = patient.id
        db.session.expunge(patient)

    class PatientData:
        def __init__(self, id):
            self.id = id

    return PatientData(patient_id)


@pytest.fixture(scope='function')
def sample_appointment(app, sample_patient, sample_professional):
    """Create an appointment for testing"""
    from app.models.appointment import Appointment
    from datetime import datetime, timedelta

    with app.app_context():
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
        apt_id = appointment.id
        db.session.expunge(appointment)

    class AptData:
        def __init__(self, id, patient_id, professional_id):
            self.id = id
            self.patient_id = patient_id
            self.professional_id = professional_id

    return AptData(apt_id, sample_patient.id, sample_professional.id)


@pytest.fixture(scope='function')
def sample_budget(app, sample_patient, sample_professional):
    """Create a budget for testing"""
    from app.models.budget import Budget
    from decimal import Decimal

    with app.app_context():
        budget = Budget(
            patient_id=sample_patient.id,
            created_by=sample_professional.id,
            title='Test Budget',
            total_amount=Decimal('1000.00'),
            status='accepted',
            description='Test budget description'
        )
        db.session.add(budget)
        db.session.commit()
        budget_id = budget.id
        db.session.expunge(budget)

    class BudgetData:
        def __init__(self, id):
            self.id = id

    return BudgetData(budget_id)


@pytest.fixture(scope='function')
def sample_payment(app, sample_budget):
    """Create a payment for testing"""
    from app.models.payment import Payment
    from decimal import Decimal
    from datetime import datetime

    with app.app_context():
        payment = Payment(
            budget_id=sample_budget.id,
            amount=Decimal('500.00'),
            payment_method='cash',
            payment_status='completed',
            payment_date=datetime.utcnow()
        )
        db.session.add(payment)
        db.session.commit()
        payment_id = payment.id
        db.session.expunge(payment)

    class PaymentData:
        def __init__(self, id):
            self.id = id

    return PaymentData(payment_id)


@pytest.fixture(scope='function')
def sample_file(app, sample_patient, sample_professional):
    """Create a file record for testing"""
    from app.models.file import File
    from app.models.medical_record import MedicalRecord
    import os

    with app.app_context():
        # First create a medical record
        medical_record = MedicalRecord(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            chief_complaint='Test complaint',
            diagnosis='Test diagnosis'
        )
        db.session.add(medical_record)
        db.session.commit()

        # Create test file path
        test_file_path = 'storage/files/test_file.txt'
        os.makedirs(os.path.dirname(test_file_path), exist_ok=True)
        with open(test_file_path, 'w') as f:
            f.write('Test file content')

        file_size = os.path.getsize(test_file_path)

        file_record = File(
            medical_record_id=medical_record.id,
            filename='test_file.txt',
            file_path=test_file_path,
            file_type='lab_result',
            mime_type='text/plain',
            file_size=file_size,
            storage_type='local'
        )
        db.session.add(file_record)
        db.session.commit()
        file_id = file_record.id
        db.session.expunge(file_record)

    class FileData:
        def __init__(self, id):
            self.id = id

    return FileData(file_id)


@pytest.fixture(scope='function', autouse=True)
def mock_redis_auth_service():
    """Mock Redis client for all tests to prevent connection errors"""
    with patch('app.services.auth_service.redis_client') as mock:
        store = {}

        def set_mock(key, value, ex=None, exat=None):
            store[key] = value

        def get_mock(key):
            return store.get(key)

        mock.set.side_effect = set_mock
        mock.get.side_effect = get_mock
        yield mock
