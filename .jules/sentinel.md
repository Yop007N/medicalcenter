## 2025-02-18 - Missing Authorization on User Management
**Vulnerability:** Regular users (patients) could delete, update, or create any user, including admins, because `backend/app/resources/users.py` lacked role-based authorization checks (only `jwt_required` was used).
**Learning:** `jwt_required` only verifies authentication, not authorization. RESTful resources often copy-paste generic CRUD templates without adding role checks.
**Prevention:** Always verify permissions (Authorization) in addition to identity (Authentication). Use decorators like `@admin_required` or `@role_required` on sensitive endpoints.
