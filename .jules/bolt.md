## 2026-01-16 - Broken Test Environment
**Learning:** The frontend test suite is currently broken due to compilation errors in `auth` related specs and dependency conflicts with `ng2-charts`. This prevents running any tests, including new ones.
**Action:** Prioritize fixing the test environment and `package.json` dependencies before attempting complex refactors that require regression testing. Use `npm install --legacy-peer-deps` to install dependencies for now.
