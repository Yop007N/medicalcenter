## 2026-01-14 - Handling Broken Repos
**Learning:** When a repo is missing core feature modules, simply commenting out routes is not enough as it makes the app look intentionally broken. Pointing routes to a placeholder (like NotFound) is a better "Robust" solution that keeps the app buildable and navigable.
**Action:** When fixing broken routing, stub out missing components instead of removing the routes.
