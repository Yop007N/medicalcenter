## 2024-04-08 - Added ARIA Labels to Patient Dashboard Navigation Menus
**Learning:** Ionic's `<ion-menu-button>` component renders as an icon-only button and relies on the developer to provide an accessible name for screen readers. It's a common accessibility gap in Ionic apps to miss adding an `aria-label` to these components.
**Action:** When using `<ion-menu-button>` or other icon-only structural elements in Ionic, always remember to add a descriptive `aria-label` (e.g., `aria-label="Abrir menú de navegación"`).
