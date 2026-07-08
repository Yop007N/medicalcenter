## 2024-05-18 - Missing aria labels in budget and payments module
**Learning:** Icon-only buttons often miss `aria-label` attributes, severely impacting screen reader users. I noticed this specific pattern in the budgets and payments modules' navigation and detail components, where CRUD actions were completely inaccessible via screen readers.
**Action:** Always add descriptive `aria-label` attributes to `<ion-button>` elements containing only `<ion-icon>` slots. A good reusable pattern is pairing `aria-label` with `[routerLink]` or action click handlers on icon-only buttons.
