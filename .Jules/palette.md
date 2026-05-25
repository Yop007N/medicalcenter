## 2024-05-25 - Added Loading Spinner to Save Profile Button
**Learning:** Patients were unsure if clicking "Save" triggered the async backend request successfully since there was no loading indicator besides a text change. Using `<ion-spinner name="crescent">` offers standard, visible feedback during these state transitions in Ionic Angular apps.
**Action:** Always check form submit buttons for loading indicators (like `<ion-spinner>`) alongside their disabled state when implementing async actions.
