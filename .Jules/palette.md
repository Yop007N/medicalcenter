# Palette's Journal

## 2024-05-22 - Missing Async Feedback Pattern
**Learning:** The application lacks a global mechanism for indicating asynchronous operations.
**Action:** Implemented a global loading overlay using a functional HTTP interceptor. To keep changes minimal and lightweight, the overlay logic was integrated directly into `AppComponent` rather than creating a separate shared module/component, utilizing Angular 17+ standalone capabilities and direct service injection.
