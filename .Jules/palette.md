## 2024-05-03 - [Accessibility of toggle buttons]
**Learning:** In Angular, binding a boolean directly to an attribute like `[attr.aria-pressed]="condition"` will remove the attribute entirely when the condition is `false`.
**Action:** For strict W3C ARIA compliance on toggle buttons, it's preferred to explicitly toggle between `"true"` and `"false"` (e.g., `[attr.aria-pressed]="isSelected(...) ? 'true' : 'false'"`).
