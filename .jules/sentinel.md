## 2025-02-19 - Missing Authorization on File Access (IDOR)
**Vulnerability:** File download and retrieval endpoints (`/api/files/<id>`) lacked authorization checks. Any authenticated user (including patients) could access any file by guessing the ID.
**Learning:** `jwt_required()` only proves identity, not permission. Resource ownership checks are inconsistent across the codebase.
**Prevention:** Always verify that `current_user` has permission to access the specific resource ID requested. Use a centralized permission checker or decorator where possible.
