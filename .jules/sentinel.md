## 2024-05-23 - IDOR in File Management
**Vulnerability:** Insecure Direct Object Reference (IDOR) allowed any authenticated user (including patients) to download, delete, or view metadata of any file by guessing its ID.
**Learning:** The application relies on `jwt_required()` for authentication but lacks consistent object-level authorization checks.
**Prevention:** Always verify that the authenticated user has permission to access the specific resource (e.g., check `medical_record.patient_id == user.id` for patients).
