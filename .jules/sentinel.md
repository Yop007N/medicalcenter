## 2026-01-20 - IDOR in File Download
**Vulnerability:** Found an Insecure Direct Object Reference (IDOR) in `backend/app/resources/files.py` where authenticated users (patients) could download any medical file by guessing the `file_id`, bypassing ownership checks.
**Learning:** The `@jwt_required()` decorator only ensures a user is logged in, but does not verify they own the data. In a healthcare app, this distinction is critical.
**Prevention:** Implement a `check_access` helper function for all resource endpoints that validates `current_user` against the resource's owner (`patient_id` or similar) before returning data.
