## 2026-05-19 - Missing trackBy in Angular components
**Learning:** Found an `*ngFor` loop rendering large lists in `AuditLogsPage` without using a `trackBy` function, which causes Angular to recreate the DOM elements every time the list is updated, especially during infinite scroll.
**Action:** Always add a `trackBy` function for `*ngFor` directives over objects/arrays when rendering lists to ensure Angular optimally tracks and renders list items rather than tearing them down on every new loaded page.
