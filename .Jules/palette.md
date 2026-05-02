## 2026-05-02 - Add ARIA Labels to Mobile Icon-Only Buttons
**Learning:** Ionic `<ion-button>` components used with `class="hide-desktop"` for mobile views often contain only `<ion-icon>` elements without text, leading to accessibility issues for screen readers.
**Action:** When designing responsive layouts with Ionic, ensure that any icon-only button designed for mobile views has an `aria-label` attribute that clearly describes its action to screen readers.
