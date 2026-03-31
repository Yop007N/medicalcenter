## 2026-03-31 - [Ionic List Actions Accessibility]
**Learning:** Generic buttons within repeated items in a list (like "Descargar" or "Rechazar" in `my-history` or "Cancelar" in `my-appointments`) provide no context to screen readers, making it hard for users to know *which* item they are acting upon.
**Action:** Always add an `[attr.aria-label]` (e.g. `[attr.aria-label]="'Cancelar turno con ' + professional.name"`) to provide descriptive accessible names to buttons repeating the same text.
