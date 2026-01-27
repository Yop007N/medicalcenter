## 2025-01-27 - N+1 Query with dynamic relationships
**Learning:** `lazy='dynamic'` relationships prevent eager loading (like `joinedload`) in SQLAlchemy because they return a Query object instead of the list of related items. This can cause N+1 query issues during serialization if the relationship is accessed for a list of parent objects.
**Action:** Use `lazy='select'` (default) for relationships that need to be eager loaded frequently, or carefully evaluate if dynamic loader is really necessary (e.g., only for very large collections that are always filtered).
