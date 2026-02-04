## 2026-02-04 - Caching Strategy for Authenticated Endpoints
**Learning:** When adding caching to authenticated endpoints (`@jwt_required`), ensure the data is truly global or use a custom cache key that includes user identity. Also, always use `query_string=True` to prevent cache collisions if query parameters are used (even if not currently used, it's safer for future evolution).
**Action:** Always verify data scope (Global vs User-Specific) before applying simple view caching. Use `query_string=True` by default for view caching.
