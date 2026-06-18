## 2026-06-18 - Missing ARIA Labels on Ionic Buttons
**Learning:** Ionic `<ion-button>` elements containing only an `<ion-icon>` (often using `slot="icon-only"`) do not inherently provide accessible names for screen readers. This pattern is common in toolbars and list items across the `frontend-admin-profesional` application.
**Action:** When implementing new toolbars or action lists with icon-only buttons in Ionic, always ensure an explicit `aria-label` attribute is added to the `<ion-button>` element itself.
