## 2025-05-15 - Broken Access Control on Patient Resources
**Vulnerability:** IDOR in Patient GET endpoints. Patients could access other patients' details by ID.
**Learning:** GET endpoints relied solely on `@jwt_required` without verifying if the user had rights to the specific resource ID.
**Prevention:** Implement resource ownership checks (e.g. `check_access(resource_id)`) in all endpoints that access specific resources by ID.
