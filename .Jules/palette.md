## 2026-06-03 - Added ARIA labels to files list
**Learning:** Found several components using `<ion-button>` with just an `<ion-icon slot="icon-only">` inside, which lack screen reader announcements in Ionic/Angular apps. The app UI is in Spanish, so ARIA labels need to be localized appropriately.
**Action:** Always check `aria-label` when using `slot="icon-only"` inside buttons. When adding labels, use Spanish to match the rest of the application's interface.
