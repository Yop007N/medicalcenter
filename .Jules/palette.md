## 2026-02-04 - Global Focus Visibility
**Learning:** Many "reset" stylesheets remove the default outline, making keyboard navigation impossible. Explicitly restoring it with `:focus-visible` is critical for accessibility without annoying mouse users.
**Action:** Always check `styles.scss` for `:focus-visible` definitions in new projects.
