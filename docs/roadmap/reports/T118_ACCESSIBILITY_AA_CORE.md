# T118 - Revision de Accesibilidad AA en Pantallas Core

Fecha: 2026-02-15

## Alcance revisado
- Login
- Patients list
- Appointments list
- Appointments calendar

## Hallazgos y correcciones aplicadas
- Controles icon-only sin nombre accesible:
  - Se agregaron `aria-label` en botones de accion y FAB.
- Toggle de visibilidad de password en login sin navegacion por teclado:
  - Se agregaron `role=\"button\"`, `tabindex=\"0\"`, `aria-label`, `aria-pressed`, `keydown.enter` y `keydown.space`.
- Estados de error sin anuncio para lectores:
  - Se agrego `role=\"alert\"` y `aria-live=\"assertive\"` en vistas de error relevantes.
- Campo de busqueda de pacientes:
  - Se agrego `aria-label` explicito.

## Archivos modificados
- `frontend/src/app/features/auth/login/login.page.ts`
- `frontend/src/app/features/patients/patients-list/patients-list.page.ts`
- `frontend/src/app/features/appointments/appointments-list/appointments-list.page.ts`
- `frontend/src/app/features/appointments/appointments-calendar/appointments-calendar.page.ts`

## Validacion
- `npm --prefix frontend run lint` -> `All files pass linting`.
- `npm --prefix frontend run build *> docs/roadmap/reports/t118-build.log` -> build `OK`.

## Nota de entorno
- Node detectado: `v25.2.1` (non-LTS).
