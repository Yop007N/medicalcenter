## 2024-04-25 - Context-aware ARIA Labels in Data Tables
**Learning:** Table action buttons (e.g. 'Editar', 'Eliminar') in loops lack context for screen readers when they rely solely on button text, resulting in multiple generic links that users cannot distinguish.
**Action:** Always add dynamic '[attr.aria-label]' with identifying IDs or names (like '[attr.aria-label]="'Editar cita #' + appointment.id"') to table action buttons. Additionally, '[attr.aria-busy]' bindings properly announce loading states on buttons executing async tasks.
