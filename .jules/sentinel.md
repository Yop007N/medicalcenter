# Sentinel's Journal

## 2026-02-22 - Missing Access Control in User Management
**Vulnerability:** The User management endpoints (`/api/users`) were protected only by authentication (`@jwt_required`), allowing any authenticated user (e.g., a patient) to list, create, update, and DELETE any other user, including admins. This is a Critical vulnerability combining IDOR and Missing Function Level Access Control.
**Learning:** The application relied on `UserService` which lacked authorization checks, and the Resource layer (`users.py`) did not implement role-based checks. The decorators (`admin_required`) existed but were not applied.
**Prevention:** Always apply role-based access control (RBAC) at the Resource/Controller level using decorators. Never assume `jwt_required` implies authorization for administrative actions. Ensure `delete` and `create` operations on sensitive resources are strictly limited to elevated roles.
