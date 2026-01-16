## 2025-01-16 - Insecure Session Management
**Vulnerability:** JWT tokens were configured with 365-day expiration times for both access and refresh tokens.
**Learning:** This allowed compromised tokens to be valid for a year, with no easy revocation mechanism.
**Prevention:** Configure short-lived access tokens (e.g., 15-60 min) and longer-lived refresh tokens (e.g., 7 days) to limit the attack window.
