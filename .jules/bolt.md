## 2025-05-23 - Flask-Caching in Tests
**Learning:** `pytest-flask` monkeypatches the `Response` class to `JSONResponse`, which causes pickling errors when using `SimpleCache` (or any serializer) in `flask-caching` during tests. `NullCache` avoids this by disabling caching, but skips verifying the caching mechanism itself. Also, `Flask-Caching` initialization needs to respect `app.config` overrides to allow testing configuration to take effect.
**Action:** Always set `CACHE_TYPE = 'null'` in `TestConfig` when using `pytest-flask`, or use a custom serializer that handles `JSONResponse`. Ensure `create_app` uses `app.config.get('CACHE_TYPE')` instead of hardcoding 'redis'.

## 2025-05-23 - SQLite vs Postgres Date Functions
**Learning:** `func.to_char` is PostgreSQL-specific. Tests using SQLite (`sqlite:///:memory:`) will fail 500 errors on endpoints using `to_char`.
**Action:** Use dialect-specific checks (`db.engine.dialect.name == 'sqlite'`) to fallback to `func.strftime` in code, or use generic SQLAlchemy extract functions where possible.
