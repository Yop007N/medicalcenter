## 2026-02-07 - Global Loading Indicator
**Learning:** Even simple UX improvements like a global loading bar require significant scaffolding (Service, Interceptor, Component) in Angular, but the impact is high for user feedback on async operations.
**Action:** Always check for existing services or interceptors before creating new ones to avoid duplication. Also, verify `tsconfig` files are present to ensure a successful build.
