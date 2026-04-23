## 2024-05-23 - Login Form Accessibility Improvement
**Learning:** Found that basic form inputs lacked standard ARIA descriptions linking validation messages to fields, and focus-visible state on primary buttons, specific to the custom forms styling used here.
**Action:** Always verify if `[attr.aria-describedby]` and `[attr.aria-invalid]` logic can be introduced cleanly in Angular using ternary statements to return `null` so attributes are not emitted when not active. Remember to add `:focus-visible` outline for keyboard navigability.
