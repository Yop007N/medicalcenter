## 2026-02-10 - IDOR in Patient Resource Access
**Vulnerability:** IDOR in `get_patient` and related endpoints allowing any authenticated user to view any patient's data.
**Learning:** `jwt_required` only verifies authentication (identity), not authorization (permission). Explicit ownership checks are mandatory for resource access.
**Prevention:** Implement resource-level authorization checks (e.g., `check_patient_access`) before returning data.
