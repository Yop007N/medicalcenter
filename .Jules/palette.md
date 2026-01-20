## 2024-05-22 - [Custom Modal Accessibility]
**Learning:** Custom modal components often lack basic ARIA attributes, making them invisible or confusing to screen reader users. The `role="alertdialog"` is crucial for error/warning/success modals, while `role="dialog"` fits info modals.
**Action:** Always check custom overlay components for `role`, `aria-modal`, `aria-labelledby`, and `aria-describedby`. Ensure decorative SVGs are hidden with `aria-hidden="true"`.
