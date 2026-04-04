## 2024-05-24 - Accessibility for ion-menu-button
**Learning:** Ionic's `<ion-menu-button>` component does not automatically receive an `aria-label` or accessible name when used without text content, making it confusing for screen reader users to identify its purpose.
**Action:** Always add an explicit `aria-label` (e.g., `aria-label="Abrir menú de navegación"`) to `<ion-menu-button>` components across the application to ensure proper keyboard and screen reader accessibility.
