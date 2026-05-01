## 2024-05-01 - Initial Setup

## 2024-05-01 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Found several `ion-button` elements that only contained an `ion-icon` but lacked an `aria-label`. This makes it difficult for screen reader users to understand the purpose of the buttons (e.g. Go Back, Refresh, Download, Delete). Additionally, the `ion-icon` elements sometimes lacked the `slot="icon-only"` attribute which is recommended by Ionic for correct styling.
**Action:** Always add an `aria-label` to `ion-button` elements that do not contain visible text. Ensure the inner `ion-icon` has the `slot="icon-only"` attribute.
