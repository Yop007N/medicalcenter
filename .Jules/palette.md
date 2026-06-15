## 2026-06-15 - ARIA Labels for Icon-Only Buttons
**Learning:** Ionic icon-only buttons (`ion-button` containing only `ion-icon`) frequently lack accessible names. Adding `aria-label` attributes to these buttons is necessary for screen reader support, and the labels should ideally match the application's domain language (Spanish in this case).
**Action:** Always verify that action buttons consisting purely of icons have an appropriate `aria-label` attribute, especially in document management or list view components.
