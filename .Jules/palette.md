## 2024-05-15 - Added aria-label to rich text buttons
**Learning:** Found several icon-only buttons (`ion-button`) in custom rich-text editor components (e.g. `prescriptions-tab.component.ts`) that lacked aria-labels for screen readers.
**Action:** Always verify custom toolbar icon-only buttons in new UI components have appropriate `aria-label` attributes.
