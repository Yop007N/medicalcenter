## 2024-03-20 - Missing ARIA label on FAB Buttons
**Learning:** Ionic FAB buttons (`<ion-fab-button>`) that contain only an icon often miss ARIA labels, rendering them inaccessible to screen readers. This pattern was observed in `professionals-list.page.ts`, while similar lists (appointments, patients) correctly handled it.
**Action:** Always add an `aria-label` property explaining the action (e.g., `aria-label="Crear nuevo profesional"`) when creating icon-only FABs.
