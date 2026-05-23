## 2024-05-23 - Accessibility Review
**Learning:** Found multiple instances where icon-only buttons (`slot="icon-only"`) are missing `aria-label` attributes. This presents a critical accessibility issue for screen readers. In `frontend-admin-profesional/src/app/features/files/files-list/files-list.page.ts`, there are 'back' and 'refresh' buttons lacking proper context.
**Action:** Always add `aria-label` to buttons that only contain an `<ion-icon>` and no visible text to improve keyboard and screen reader accessibility.
