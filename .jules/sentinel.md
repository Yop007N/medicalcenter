## 2026-02-20 - CSV Injection
**Vulnerability:** User-controlled input was exported directly to CSV files without sanitization.
**Learning:** Even internal reporting tools can be vectors for attacks (CSV Injection / Formula Injection).
**Prevention:** Sanitize fields starting with `=`, `+`, `-`, `@` by prepending a single quote `'` before exporting to CSV.
