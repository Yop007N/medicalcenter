## 2024-06-24 - Missing aria-labels on icon-only buttons
**Learning:** Found multiple instances where `ion-button` elements containing only `ion-icon` elements are missing the `aria-label` attribute (e.g., refresh, download, and trash buttons in the files-list page and a back button). This causes poor accessibility for screen reader users.
**Action:** Always add an `aria-label` attribute to icon-only buttons to convey their meaning.
