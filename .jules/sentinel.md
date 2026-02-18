## 2026-02-18 - IDOR in Patient Endpoints
**Vulnerability:** Insecure Direct Object Reference (IDOR) in patient data endpoints.
**Learning:** `get_patient` and related endpoints checked for a valid JWT but did not verify if the authenticated user was authorized to access the requested `patient_id`.
**Prevention:** Always verify ownership or specific roles (e.g., admin, professional) when accessing resources by ID. Implemented `check_patient_access` helper function.
