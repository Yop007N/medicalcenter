## 2026-06-19 - Add aria-live and aria-busy to login button
**Learning:** Buttons that change text to indicate a loading state (e.g., 'Iniciando sesion...') need `aria-live='polite'` and `[attr.aria-busy]` for screen readers to properly announce the state change without losing focus context.
**Action:** Always add `aria-live` and `aria-busy` to async submit buttons that use text replacement for loading states.
