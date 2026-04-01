## 2024-04-01 - Missing rate limiting on sensitive endpoints
**Vulnerability:** Missing rate limiting on the `/register` endpoint
**Learning:** Found that public `/register` endpoint had no rate limits, opening it up to enumeration or denial of service attacks.
**Prevention:** Always add rate limits using `@limiter.limit` for authentication endpoints such as `/register`.
