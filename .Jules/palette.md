## 2026-05-18 - [Add loading spinners to async actions]
**Learning:** In Ionic/Angular apps, adding `<ion-spinner>` inside `<ion-button>` during async actions (like login, profile updates, and booking appointments) provides essential visual feedback. Coupling this with `[attr.aria-busy]="true"` ensures the busy state is communicated effectively to screen readers.
**Action:** When working on asynchronous actions bound to UI components, ensure to combine both the visual spinner and the accessibility attribute `aria-busy` to maintain the highest standard of UI polish and accessibility.
