## 2026-02-14 - [Fixed N+1 Query in Medical Records]
**Learning:** `lazy='dynamic'` on SQLAlchemy relationships prevents eager loading strategies like `joinedload` or `subqueryload`. It returns a query object instead of a list.
**Action:** Use `lazy='select'` (default) for relationships that need to be eager loaded, unless the collection is massive and always needs filtering. If filtering is needed occasionally, just query the related model directly or use dynamic loader only when necessary (but not as default if eager loading is main use case).
