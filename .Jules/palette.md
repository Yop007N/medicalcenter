
## 2024-05-24 - Add ARIA label to ion-menu-button
**Learning:** The `<ion-menu-button>` component is an icon-only button that lacks a default ARIA label in Ionic/Angular. This causes accessibility issues for screen reader users as they can't determine the button's purpose.
**Action:** Always manually add `aria-label="Abrir menú de navegación"` to `<ion-menu-button>` instances throughout the app to ensure proper accessibility.
