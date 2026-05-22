## 2026-05-22 - Missing ARIA Labels on Icon-Only ion-buttons
**Learning:** Ionic `<ion-button>` elements containing only an `<ion-icon>` frequently lack accessible names in this application. Assistive technologies cannot determine the purpose of these buttons without an `aria-label`.
**Action:** When working on Ionic templates, always check buttons containing only icons (e.g., `slot="icon-only"`) and ensure they have a descriptive `aria-label` localized appropriately (in this app's case, Spanish).
