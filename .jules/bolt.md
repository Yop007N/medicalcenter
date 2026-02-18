# Bolt's Journal

## 2026-02-18 - Correlated Subquery Trap
**Learning:** A seemingly innocent query calculating "average appointments per patient" using a correlated subquery was incorrectly implemented (missing `.select_from(Patient)`), leading it to return the total number of appointments instead. Even if correct, it would have been O(N).
**Action:** Always verify complex SQLAlchemy queries by inspecting generated SQL or checking results against known small datasets. Prefer simple aggregations (Total A / Total B) over complex subqueries for averages when possible.
