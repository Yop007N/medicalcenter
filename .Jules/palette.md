## 2024-05-20 - Added ARIA labels to icon-only buttons
**Learning:** Found multiple instances of `ion-button`s with `icon-only` in Ionic templates missing `aria-label` attributes, affecting accessibility for screen reader users.
**Action:** When working with Ionic `ion-icon` within `ion-button` that don't have text content (often hidden on mobile views), always add an `aria-label` describing the action.
