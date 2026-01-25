# -*- coding: utf-8 -*-
"""
Patient Pagination Tests
"""

import pytest
from app.models.patient import Patient
from app.extensions import db

class TestListPatientsPagination:
    """Test list patients pagination"""

    def test_list_patients_no_pagination_default(self, client, auth_headers, app):
        """Test listing patients without pagination params returns list (backward compat)"""
        with app.app_context():
            # Create some patients
            for i in range(5):
                patient = Patient(
                    email=f'p{i}@test.com',
                    first_name=f'Patient{i}',
                    last_name='Test',
                    role='patient'
                )
                patient.set_password('Patient123')
                db.session.add(patient)
            db.session.commit()

        response = client.get('/api/patients', headers=auth_headers)

        assert response.status_code == 200
        data = response.json
        assert isinstance(data, list)
        # Should be at least 5
        assert len(data) >= 5

    def test_list_patients_with_pagination(self, client, auth_headers, app):
        """Test listing patients with pagination params returns paginated object"""
        with app.app_context():
            # Ensure we have enough patients for pagination
            # Clean up first to have a clean state if possible, but tests run in transaction usually
            # We'll just add 25 patients
            for i in range(25):
                # Avoid duplicates if running repeatedly or sharing db
                if not Patient.query.filter_by(email=f'pag{i}@test.com').first():
                    patient = Patient(
                        email=f'pag{i}@test.com',
                        first_name=f'Pagination{i}',
                        last_name='Test',
                        role='patient'
                    )
                    patient.set_password('Patient123')
                    db.session.add(patient)
            db.session.commit()

        # Request page 1 with 10 items
        response = client.get('/api/patients?page=1&per_page=10', headers=auth_headers)

        # Before optimization, this might return a list or ignore params
        # If it ignores params, it returns a list (failure case for this test)

        assert response.status_code == 200
        data = response.json

        # We expect a dictionary now
        assert isinstance(data, dict)
        assert 'items' in data
        assert 'total' in data
        assert 'page' in data
        assert 'pages' in data
        assert 'per_page' in data

        assert data['page'] == 1
        assert data['per_page'] == 10
        assert len(data['items']) == 10

        # Request page 2
        response2 = client.get('/api/patients?page=2&per_page=10', headers=auth_headers)
        data2 = response2.json
        assert data2['page'] == 2
        assert len(data2['items']) == 10

        # Ensure items are different (simple check)
        ids1 = [p['id'] for p in data['items']]
        ids2 = [p['id'] for p in data2['items']]
        assert set(ids1).isdisjoint(set(ids2))
