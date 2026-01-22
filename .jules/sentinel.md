## 2025-05-27 - IDOR in Patient Endpoints
**Vulnerability:** Broken Object Level Authorization (IDOR) in `patients.py` endpoints. Authenticated users could access any patient's data by manipulating the `patient_id`.
**Learning:** The `@jwt_required()` decorator only ensures the user is logged in, but does not verify ownership of the requested resource.
**Prevention:** Always verify that `current_user_id == resource.owner_id` for user-specific resources, or enforce Role-Based Access Control (RBAC) where only admins/professionals can access other users' data.
