## 2026-02-18 - IDOR in Patient Resources
**Vulnerability:** Insecure Direct Object Reference (IDOR) in `backend/app/resources/patients.py`.
**Learning:** `get_patient` and related endpoints lacked authorization checks beyond `jwt_required`. Inheritance of `Patient` from `User` means they share IDs, but access control was missing.
**Prevention:** Always verify `current_user_id == resource_id` or check for specific roles (admin/professional) when accessing user-specific data.
