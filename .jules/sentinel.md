## 2025-05-24 - Missing RBAC in User Management
**Vulnerability:** Privilege Escalation / Broken Access Control
**Learning:** The `users` endpoints were protected only by `jwt_required`, allowing any authenticated user (e.g., patient) to create admin users or delete other users. Role checks must be explicit.
**Prevention:** Always apply `@role_required` or `@admin_required` decorators to sensitive endpoints, or check `current_user.role` inside the function.
