## 2026-02-15 - Fail-Closed Logic in Authorization
**Vulnerability:** IDOR in medical records allowing unauthorized access + potential fail-open logic where deleted users could bypass checks.
**Learning:** Checking `current_user.role` assumes `current_user` exists. If a user is deleted but has a valid token, `current_user` is None. Security checks must fail closed (abort if user not found).
**Prevention:** Always check `if not current_user:` before checking role-based permissions.
