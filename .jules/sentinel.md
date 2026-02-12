## 2026-02-12 - [Critical IDOR in Patient Resource]
**Vulnerability:** Unprotected direct object references in `backend/app/resources/patients.py` allowed any authenticated user (e.g., patient) to access other patients' sensitive data (medical history, etc.) by guessing their ID.
**Learning:** The application lacked centralized authorization checks for accessing patient-specific resources. Individual resource endpoints assumed authentication implied authorization.
**Prevention:** Implemented a centralized `_check_access(patient_id)` helper function in the resource module. Enforced authorization checks explicitly before accessing the database record. Future endpoints dealing with user-specific data must implement similar checks.
