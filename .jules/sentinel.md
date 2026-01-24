## 2026-01-24 - Privilege Escalation in User Management
**Vulnerability:** Any authenticated user (including patients) could create, update, or delete any user (including admins) via the `/api/users` endpoints because there was no role verification, only authentication checks.
**Learning:** `jwt_required()` only establishes *who* the user is, not *what* they can do. Frameworks often separate these concerns, leading to "default open" permissions if authorization layers are missed.
**Prevention:**
1. Apply "Deny by Default" strategy: require explicit role/permission checks for all write operations.
2. Use custom decorators like `@admin_required` immediately after authentication decorators.
3. Test Authorization: Every sensitive endpoint must have tests verifying that unauthorized roles receive 403 Forbidden.
