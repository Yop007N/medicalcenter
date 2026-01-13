## 2025-10-26 - [Missing RBAC in User Management]
**Vulnerability:** IDOR and Missing Authorization in /api/users endpoints allowed any authenticated user (e.g. patients) to list, delete, and modify other users, including admins.
**Learning:** Frameworks like Flask-JWT-Extended provide authentication but not authorization out of the box. Explicit role checks are mandatory.
**Prevention:** Implement and use role-based decorators (@admin_required) and enforce resource ownership checks for GET/PUT operations.
