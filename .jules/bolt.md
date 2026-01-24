## 2026-01-24 - Correlated Subquery Trap
**Learning:** SQLAlchemy `func.avg` without an explicit `select_from` or outer query context might return the SUM or COUNT of the subquery instead of the average, or simply behave unexpectedly on SQLite. More importantly, using a correlated subquery to calculate an average across all rows is O(N) and significantly slower than O(1) arithmetic on aggregated counts.
**Action:** Always prefer `Total / Count` arithmetic for global averages instead of `AVG(correlated_subquery)`. Verify generated SQL for "clever" SQLAlchemy constructs.

## 2026-01-24 - SQLite vs Postgres in Tests
**Learning:** `func.to_char` is Postgres-specific and causes 500 errors in SQLite-based tests (`:memory:`).
**Action:** When optimizing, verify if existing test failures are environment-specific before assuming regression. Use `sqlite` compatible date formatting or mock it in tests.
