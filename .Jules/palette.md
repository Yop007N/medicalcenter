## 2026-06-16 - Added aria-busy to loading buttons
**Learning:** In Angular, when buttons have dynamic text that changes during loading (e.g. 'Submit' to 'Submitting...'), screen readers might announce the change confusingly. Adding `[attr.aria-busy]` tells the assistive tech that the element is processing.
**Action:** Use `[attr.aria-busy]="isLoading ? true : null"` on buttons that trigger async actions to improve screen reader experience, as boolean attributes in Angular should evaluate to `null` to be removed from the DOM when false.
