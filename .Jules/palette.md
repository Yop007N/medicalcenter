## 2026-05-17 - Improve appointment slot accessibility
**Learning:** Custom toggle chips used for selecting appointment slots need `aria-pressed` to properly convey state to screen readers.
**Action:** Always add `[attr.aria-pressed]` and `focus-visible` outline styles to toggle-like interactive elements that don't natively announce their selected state.
