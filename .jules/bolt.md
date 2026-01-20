## 2024-05-23 - N+1 Query on Nested Schemas with Dynamic Loading
**Learning:** Marshmallow schemas accessing relationships defined with `lazy='dynamic'` in SQLAlchemy models trigger a separate query for each item during serialization, causing N+1 issues. `subqueryload` cannot be applied to dynamic relationships directly.
**Action:** Change `lazy='dynamic'` to `lazy='select'` (default) when eager loading is needed for serialization, and use `subqueryload` in the query options. Ensure no other code relies on the relationship returning a Query object.
