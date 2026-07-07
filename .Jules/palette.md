## 2026-07-07 - Add loading spinners for primary actions
**Learning:** Screen reader users lose context when a button's text is completely replaced by a loading spinner.
**Action:** Ensure to add `aria-label` attributes to `<ion-spinner>` elements inside buttons to communicate the loading state appropriately.
