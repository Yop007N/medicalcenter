## 2026-01-24 - Accessible Password Toggle
**Learning:** Icon-only password toggles (eye icon) are often implemented as clickable `ion-icon` elements, which lack keyboard focus and ARIA semantics.
**Action:** Always wrap interactive icons in a `<button type="button">` with `aria-label` and `aria-pressed` attributes. Ensure focus styles are visible (e.g., `outline` on `:focus-visible`).
