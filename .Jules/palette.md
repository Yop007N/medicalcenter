## 2026-02-24 - Accessibility for Dynamic Status Indicators
**Learning:** Dynamic content like connectivity status or sync progress is often missed by screen readers if it doesn't have `role="status"` or `aria-live`.
**Action:** Always wrap dynamic status indicators in a container with `role="status"` and `aria-live="polite"` so updates are announced without moving focus.
