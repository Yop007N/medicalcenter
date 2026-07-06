## 2024-05-18 - Missing Authentication and DoS Risk in Diagnostic Logs API
**Vulnerability:** The `/api/logs/frontend` endpoints in `backend/app/resources/logs.py` lacked authentication and had `@limiter.exempt` applied. This allowed unauthorized users to read diagnostic logs (potential information disclosure) and could be abused to flood the server logs (DoS).
**Learning:** Even diagnostic or frontend log ingestion endpoints need proper security controls. All endpoints, especially those dealing with file access or ingestion, should be secured by default.
**Prevention:** Apply rate limiting to log ingestion (`@limiter.limit("10 per minute")`) and require authentication and appropriate roles (e.g., `@jwt_required()` and `@admin_required`) for sensitive read/clear operations.
