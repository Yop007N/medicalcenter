## 2026-02-07 - IDOR in Patient Endpoints
**Vulnerability:** IDOR vulnerability in patient data endpoints (`get_patient`, `medical-history`, etc.). Authorization was missing beyond token validation.
**Learning:** `jwt_required` only validates authentication, not authorization. Explicit role or resource ownership checks are needed for sensitive data.
**Prevention:** Implement resource ownership checks (e.g., `check_patient_access(patient_id)`) in all endpoints that access user-specific data.
