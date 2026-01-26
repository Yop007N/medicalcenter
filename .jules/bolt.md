## 2026-01-26 - Template Calculations Anti-pattern
**Learning:** The codebase heavily utilizes method calls within Angular templates (e.g., `{{ getActiveCount() }}`), which triggers expensive re-calculations on every change detection cycle. This is particularly impactful in `Default` change detection strategy.
**Action:** Systematically refactor these into pre-calculated properties or pure pipes, and switch components to `ChangeDetectionStrategy.OnPush` where possible.
