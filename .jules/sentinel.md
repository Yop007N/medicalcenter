## 2026-02-18 - IDOR in Patient Resources
**Vulnerability:** Insecure Direct Object Reference (IDOR) in `backend/app/resources/patients.py`.
**Learning:** `get_patient` and related endpoints lacked authorization checks beyond `jwt_required`. Inheritance of `Patient` from `User` means they share IDs, but access control was missing.
**Prevention:** Always verify `current_user_id == resource_id` or check for specific roles (admin/professional) when accessing user-specific data.
## 2026-02-18 - CI Configuration Fix
**Vulnerability:** CI pipeline failure due to missing dependency.
**Learning:** The CI workflow attempted to run `flake8` but it was not present in the installed requirements (`requirements/test.txt`).
**Prevention:** Ensure all tools used in CI workflows are explicitly listed in the environment's requirements file.
## 2026-02-18 - Missing Dependencies in Requirements
**Vulnerability:** CI pipeline failure due to missing runtime dependencies.
**Learning:** The application imported libraries (`flask_limiter`, `flask_caching`, `flask_socketio`, `flask_migrate`) that were not listed in `requirements/base.txt`. This caused the test suite to crash on import.
**Prevention:** Regularly audit imports against requirements files. Ensure all extensions used in `app/__init__.py` or `app/extensions.py` are pinned in dependencies.
## 2026-02-18 - Database Compatibility in Dashboard
**Vulnerability:** Application crashes on SQLite (used in testing) due to PostgreSQL-specific SQL functions.
**Learning:** `func.to_char` is PostgreSQL-specific. Tests failed with 500 errors because SQLite doesn't support it.
**Prevention:** Use `db.session.get_bind().dialect.name` to detect the database engine and use compatible SQL functions (e.g., `strftime` for SQLite) or use database-agnostic SQLAlchemy constructs where possible.
