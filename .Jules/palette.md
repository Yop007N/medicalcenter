## 2026-01-21 - Handling Broken Repositories
**Learning:** When a repository is missing core files or features, implementing a "Page Not Found" (404) component is a high-value micro-UX improvement that provides immediate value (handling broken links) without requiring the rest of the app to work.
**Action:** Always check if a 404 page exists. If not, and the repo state is fragile, add it as a standalone component to improve the fallback experience.
