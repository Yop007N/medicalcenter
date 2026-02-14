# -*- coding: utf-8 -*-
"""
Performance tests for Medical Records endpoints
"""

import pytest
from sqlalchemy import event
from sqlalchemy.engine import Engine
from app.models.medical_record import MedicalRecord
from app.models.file import File
from app.extensions import db

class QueryCounter:
    def __init__(self):
        self.count = 0

    def __call__(self, conn, cursor, statement, parameters, context, executemany):
        self.count += 1

@pytest.fixture
def query_counter():
    counter = QueryCounter()
    event.listen(Engine, "before_cursor_execute", counter)
    yield counter
    event.remove(Engine, "before_cursor_execute", counter)

def test_medical_records_list_performance(client, auth_headers, sample_patient, sample_professional, query_counter):
    """Test N+1 query prevention in medical records list"""
    # Setup data
    records = []
    for i in range(10):
        record = MedicalRecord(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            chief_complaint=f'Complaint {i}',
            diagnosis=f'Diagnosis {i}'
        )
        db.session.add(record)
    db.session.commit()

    # Add files to records
    for i, record in enumerate(records):
        file = File(
            medical_record_id=record.id,
            filename=f'file_{i}.pdf',
            file_type='lab_result',
            file_size=1024,
            file_path=f'/tmp/file_{i}.pdf'
        )
        db.session.add(file)
    db.session.commit()

    # Reset counter
    query_counter.count = 0

    # Make request
    response = client.get('/api/medical-records', headers=auth_headers)

    assert response.status_code == 200
    data = response.json

    # Assert pagination structure
    assert 'items' in data
    assert 'total' in data
    assert 'page' in data
    assert 'per_page' in data
    assert len(data['items']) == 10

    # Assert query count
    # 1. Auth check (User query)
    # 2. Pagination count query
    # 3. Fetch records with eager loaded files query
    # Should be around 3-5 queries. If N+1 was present, it would be 10+ queries.

    print(f"Query count: {query_counter.count}")
    assert query_counter.count < 10

def test_medical_records_pagination(client, auth_headers, sample_patient, sample_professional):
    """Test pagination functionality"""
    # Setup 25 records
    records = []
    for i in range(25):
        record = MedicalRecord(
            patient_id=sample_patient.id,
            professional_id=sample_professional.id,
            chief_complaint=f'Complaint {i}',
            diagnosis=f'Diagnosis {i}'
        )
        db.session.add(record)
    db.session.commit()

    # Request page 1
    response = client.get('/api/medical-records?page=1&per_page=10', headers=auth_headers)
    assert response.status_code == 200
    data = response.json
    assert len(data['items']) == 10
    assert data['total'] == 25
    assert data['page'] == 1
    assert data['pages'] == 3
    assert data['per_page'] == 10

    # Request page 3
    response = client.get('/api/medical-records?page=3&per_page=10', headers=auth_headers)
    assert response.status_code == 200
    data = response.json
    assert len(data['items']) == 5
    assert data['page'] == 3
