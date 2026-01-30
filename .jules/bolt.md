## 2025-01-30 - SQLite vs PostgreSQL Compatibility
**Learning:** The codebase uses PostgreSQL-specific functions like `to_char` which are not supported in SQLite. This causes tests to fail when running locally with SQLite.
**Action:** When working with date formatting in queries, check the dialect or use `func.strftime` for SQLite and `func.to_char` for PostgreSQL.
