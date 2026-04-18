## 2024-05-15 - Missing ARIA labels in icon-only buttons
**Learning:** Found multiple `<ion-button>` elements containing only an `<ion-icon>` with `slot="icon-only"` that are missing `aria-label` attributes. This breaks accessibility for screen reader users, who won't be able to determine the button's purpose.
**Action:** Adding `aria-label` attributes to these icon-only buttons to improve accessibility across the app.
