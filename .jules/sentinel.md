## 2024-05-23 - Insecure JWT Expiration
**Vulnerability:** JWT access and refresh tokens were configured with a 365-day expiration time in `backend/app/config.py`. This meant that if a token was compromised, an attacker could maintain access for a year.
**Learning:** Default configuration values can easily be overlooked. The `Config` class defined these long expirations as defaults, which poses a risk if not explicitly overridden with tighter constraints in production.
**Prevention:** Implement automated tests that verify security configuration parameters (like token expiration) fall within acceptable safety limits. Use short-lived access tokens (e.g., 15 minutes) and implement refresh token rotation.
