# Palette's Journal

## 2024-05-22 - Missing ARIA labels in Ionic components
**Learning:** Ionic's `slot="icon-only"` buttons do not automatically generate accessible names from the icon name. They require explicit `aria-label` attributes for screen readers.
**Action:** Always verify `aria-label` is present when using `slot="icon-only"` or buttons containing only `ion-icon`.
