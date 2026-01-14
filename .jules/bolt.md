## 2024-05-23 - [SQLAlchemy Eager Loading with Dynamic Relationships]
**Learning:** You cannot use standard eager loading strategies like `joinedload` or `subqueryload` on a relationship defined with `lazy='dynamic'`, because the attribute is a query object, not a collection.
**Action:** To optimize N+1 queries for such relationships, first verify if the `dynamic` loading is truly needed (i.e., used for filtering). If not, change it to `select` (default) or `true`, and then apply eager loading options in the query.
