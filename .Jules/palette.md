## 2026-06-07 - Enhance login and app navigation
**Learning:** Adding explicit aria-labels for global navigation elements like "Menú principal de paciente" and "Cerrar sesion del portal" enhances accessibility where generic "close" or "menu" text might be ambiguous. Loading spinners paired with adjacent text nodes within a button need `ion-margin-start` to look clean.
**Action:** Next time I encounter async buttons in ionic, add a crescent spinner with an `ion-margin-start` on the label adjacent to the spinner. Ensure menus and global actions use descriptive ARIA attributes.
