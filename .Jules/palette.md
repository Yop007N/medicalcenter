## 2024-03-20 - Missing ARIA labels on icon-only buttons
**Learning:** Found multiple instances of `<ion-button>` containing only an `<ion-icon>` without `aria-label` attributes. This is a common accessibility issue in Ionic apps.
**Action:** Add `aria-label` to all icon-only buttons to improve screen reader accessibility.
