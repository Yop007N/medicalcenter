## 2026-05-17 - Add dynamic ARIA labels to Angular templates
**Learning:** When adding dynamic ARIA labels to buttons containing item-specific information in Angular, you must use the `[attr.aria-label]` syntax rather than a simple `aria-label` binding, as ARIA attributes are not standard DOM properties but rather HTML attributes.
**Action:** Use `[attr.aria-label]="'Action ' + item.name"` pattern for dynamically labeled buttons in lists.
