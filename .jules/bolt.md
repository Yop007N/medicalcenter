## 2025-02-10 - Complex Aggregations vs Simple Counts
**Learning:** `SQLAlchemy` queries using `func.avg` with correlated subqueries can be fragile, performing full table scans (O(N)) and potentially returning incorrect results (sums instead of averages) if the correlation isn't perfect. They also often break cross-database compatibility (PostgreSQL vs SQLite) in tests.
**Action:** For dashboard ratios like "Average X per Y", prefer two simple O(1) count queries (`Total X / Total Y`) over complex single-query aggregations. This is faster, more readable, and less error-prone.
