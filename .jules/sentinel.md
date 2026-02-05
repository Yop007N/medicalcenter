## 2025-02-05 - IDOR in Patient Endpoints
**Vulnerability:** Insecure Direct Object Reference (IDOR) in patient data retrieval endpoints (`get_patient`, `get_patient_medical_history`, etc.).
**Learning:** While `update_patient` had proper authorization checks, all `GET` endpoints lacked checks, allowing any authenticated user to dump sensitive patient data by iterating IDs.
**Prevention:** Always verify that `current_user_id == requested_resource_id` (or user is admin/pro) in ALL endpoints, especially GET requests which are often overlooked compared to state-changing requests. Use a centralized decorator or helper.
