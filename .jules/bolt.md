## 2026-01-31 - Avoiding Function Calls in Angular Templates
**Learning:** Function calls in Angular templates (e.g., `{{ getActiveCount() }}`) are executed on every change detection cycle, which can be frequent. In this codebase, the `PatientsListPage` was recalculating stats on every cycle.
**Action:** Pre-calculate values into properties (e.g., `activeCount`) whenever the source data changes. Use `ChangeDetectionStrategy.OnPush` to further reduce unnecessary checks.

## 2026-01-31 - OnPush and Async Subscriptions
**Learning:** When using `ChangeDetectionStrategy.OnPush`, manual subscriptions (e.g., `http.get().subscribe()`) do not automatically trigger change detection if the callback is invoked asynchronously (like after HTTP response), even if running in NgZone, unless `AsyncPipe` is used or `markForCheck()` is called explicitly.
**Action:** When migrating to OnPush, always ensure async data updates are followed by `this.cdr.markForCheck()` or use `AsyncPipe` in the template.
