## 2024-05-22 - Missing Build Configs
**Learning:** The project was missing critical build configurations (`tsconfig.app.json`, `tsconfig.spec.json`), making it impossible to run verification tools. This highlights the importance of checking "Developer UX" as part of the overall experience.
**Action:** Always check `package.json` scripts and verify they run before starting work. If they fail due to missing config, fix that first.

## 2024-05-22 - Skip to Main Content
**Learning:** Adding a "Skip to Main Content" link is a low-effort, high-impact accessibility win that fits perfectly into the "micro-UX" philosophy. It requires valid HTML structure (main landmark) which encourages better semantic markup.
**Action:** Check for skip links in `app.component.html` as a standard first step.

## 2024-05-22 - Partial Repository State
**Learning:** Working in an incomplete repository (missing feature modules) requires relying on static analysis and partial builds rather than full runtime verification.
**Action:** Explicitly document verification limitations when the environment is broken.
