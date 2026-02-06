## 2026-02-06 - Missing Build Configuration
**Learning:** The project was missing `tsconfig.app.json`, preventing the build from starting. This suggests a potential issue in the repo setup or a recent regression.
**Action:** Always verify the existence of build configuration files before attempting to run build commands.

## 2026-02-06 - Tooling Conflict
**Learning:** The instructions mandate using `pnpm`, but the repository contains `package-lock.json` (npm). This creates a conflict where following instructions (using pnpm) would generate a new lockfile (`pnpm-lock.yaml`), while using the existing tool (`npm`) updates the existing lockfile, which might be flagged as a boundary violation if not reverted.
**Action:** When faced with conflicting tooling instructions vs repo state, use the repo's existing tool to verify (if needed), but revert any lockfile changes before submitting to avoid noise.
