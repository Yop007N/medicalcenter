## 2026-06-18 - Missing trackBy in Angular components
**Learning:** Found multiple instances of `*ngFor` loops in Angular components (like `audit-logs.page.ts` and `reports-home.page.ts`) missing `trackBy` functions. This causes Angular to destroy and recreate DOM nodes when items change rather than just updating them.
**Action:** Implemented trackBy functions using relevant unique IDs from the entity models to prevent unnecessary DOM re-rendering when lists get updated from backend APIs.
