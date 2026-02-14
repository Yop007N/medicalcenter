## 2026-02-14 - IDOR in Patient Endpoints
**Vulnerability:** Patient getter endpoints (e.g., `get_patient`) lacked ownership checks, allowing any authenticated user to access any patient's data.
**Learning:** `jwt_required()` only authenticates the user but does not authorize access to specific resources.
**Prevention:** Always implement resource ownership checks (`current_user_id == resource_owner_id`) in addition to authentication.
