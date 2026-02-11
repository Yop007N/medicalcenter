## 2026-02-11 - N+1 Query Issue with Dynamic Relationships
**Learning:** The codebase defaults to `lazy='dynamic'` for relationships (e.g., `MedicalRecord.files`), which prevents eager loading using `joinedload` or `subqueryload`. This leads to N+1 query issues when serializing lists of objects with nested relationships.
**Action:** When identifying N+1 issues, check the model definition for `lazy='dynamic'`. If found, change it to `lazy='select'` (if feasible) to enable eager loading optimizations in the query.
