## 2026-02-13 - IDOR in Patient Endpoints
**Vulnerability:** Patients could access other patients' profiles and medical history by manipulating the `patient_id` in the URL (Insecure Direct Object Reference).
**Learning:** `jwt_required()` only authenticates the user but does not authorize access to specific resources. Explicit checks are needed to ensure the user owns the resource or has a privileged role (professional/admin).
**Prevention:** Always verify that `current_user.id == resource.owner_id` or that the user has a privileged role before returning sensitive data. Use a helper function or decorator for consistent checks.
