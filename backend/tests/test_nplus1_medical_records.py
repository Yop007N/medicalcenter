
import pytest
from app.extensions import db
from app.models.medical_record import MedicalRecord
from sqlalchemy import event

class TestMedicalRecordNPlus1:
    def test_list_medical_records_nplus1(self, client, auth_headers, sample_patient, sample_professional):
        """Test N+1 query problem in list medical records"""

        # Create 5 medical records
        with client.application.app_context():
            for i in range(5):
                record = MedicalRecord(
                    patient_id=sample_patient.id,
                    professional_id=sample_professional.id,
                    chief_complaint=f'Complaint {i}',
                    diagnosis=f'Diagnosis {i}'
                )
                db.session.add(record)
            db.session.commit()

        # Capture queries
        queries = []
        def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
            queries.append(statement)

        event.listen(db.engine, "before_cursor_execute", before_cursor_execute)

        try:
            # Make request
            response = client.get('/api/medical-records', headers=auth_headers)
            assert response.status_code == 200

            # Count queries related to files
            # The N+1 problem causes a query for files for each record
            # "SELECT ... FROM files WHERE files.medical_record_id = ..."
            file_queries = [q for q in queries if 'files' in str(q) and 'medical_record_id' in str(q)]

            print(f"\nTotal queries: {len(queries)}")
            print(f"File queries: {len(file_queries)}")

            # If N+1 exists, we expect 5 file queries (one for each record)
            # If optimized, we expect 1 query (joined or subquery) or 0 if joined in main query

            # Assert that N+1 problem is resolved
            # With subqueryload, we expect 1 additional query for files, or 0 if joined differently.
            # Definitely less than 5.
            assert len(file_queries) < 5, f"Expected fewer than 5 queries, got {len(file_queries)}. N+1 problem persists."
            # Ideally it should be 1
            assert len(file_queries) <= 1, f"Expected 1 or 0 file queries, got {len(file_queries)}"

        finally:
            event.remove(db.engine, "before_cursor_execute", before_cursor_execute)
