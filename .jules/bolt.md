## 2026-01-29 - Fixed N+1 query in MedicalRecord serialization
**Learning:** `lazy='dynamic'` on SQLAlchemy relationships returns a query object, which is great for filtering but causes N+1 queries during serialization if the schema tries to iterate over it (like Marshmallow's `Nested(many=True)`).
**Action:** Use `lazy='selectin'` for collections that are frequently loaded in full, especially when used with serialization schemas that dump the whole collection. This changes N+1 queries into 2 queries (one for parent, one for children using IN clause).
