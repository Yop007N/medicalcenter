## 2024-05-22 - Broken Access Control in User Management
**Vulnerability:** User management endpoints (create/update/delete users) were accessible to any authenticated user, and public registration allowed creating 'professional' accounts.
**Learning:** Default @jwt_required() is not enough for sensitive administrative actions. Always verify roles.
**Prevention:** Use role-based decorators (@admin_required) for administrative endpoints and strictly whitelist allowed roles for public registration.
