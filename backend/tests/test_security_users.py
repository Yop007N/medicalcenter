
import pytest

class TestVulnerabilityUsers:
    """Test vulnerability in user endpoints"""

    def test_patient_delete_other_user(self, client, patient_auth_headers, admin_user):
        """
        VULNERABILITY CONFIRMATION:
        A patient should NOT be able to delete another user (e.g. admin).
        If this returns 200/204, the vulnerability exists.
        """
        response = client.delete(f'/api/users/{admin_user.id}', headers=patient_auth_headers)

        # We expect this to fail with 403 Forbidden now.
        assert response.status_code == 403
