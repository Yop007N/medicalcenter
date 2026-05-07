## $(date +%Y-%m-%d) - Added ARIA labels to ion-menu-button elements in frontend-paciente
**Learning:** Ionic's default `<ion-menu-button>` component has an implicit English screen reader announcement which may not be appropriate for localized applications.
**Action:** When adding or auditing `<ion-menu-button>` components in localized applications (like this Spanish application), explicitly define the `aria-label` attribute (e.g. `aria-label="Abrir menu principal"`) to provide proper screen reader context for non-English users.
