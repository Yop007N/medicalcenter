
import pytest
from app.models.appointment import Appointment
from sqlalchemy import inspect
from app.extensions import db

class TestAppointmentIndex:
    """Test that the Appointment model has the correct indexes"""

    def test_created_at_index_exists(self, app):
        """Test that created_at column is indexed"""
        with app.app_context():
            inspector = inspect(db.engine)
            indexes = inspector.get_indexes('appointments')

            created_at_index_found = False
            for index in indexes:
                if 'created_at' in index['column_names']:
                    created_at_index_found = True
                    break

            assert created_at_index_found, "Index on 'created_at' column in 'appointments' table not found"
