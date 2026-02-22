# T117 - Performance de Calendario de Citas

Fecha: 2026-02-15

## Objetivo
Reducir costo de render y recalculo en `appointments-calendar` sin cambiar flujos funcionales.

## Cambios aplicados
- `frontend/src/app/features/appointments/appointments-calendar/appointments-calendar.page.ts`
  - `changeDetection` migrado a `OnPush`.
  - Suscripcion a store con `takeUntilDestroyed` (sin fugas de memoria).
  - Indexacion de citas por fecha (`Map<string, Appointment[]>`) para evitar filtrado O(dias*citas) en cada render.
  - Generacion de calendario optimizada con `createCalendarDay` y precomputo de:
    - `previewAppointments`
    - `extraAppointmentsCount`
  - Eliminacion de `slice()` en template por dia.
  - `currentPeriodLabel` calculado una vez por cambio de vista/navegacion (no getter recalculado en cada CD).
  - Navegacion de periodo (`prev/next/hoy`) regenerando calendario local sin recarga redundante de backend.
  - Sincronizacion de `selectedDay` con la nueva grilla al regenerar calendario.

## Impacto esperado
- Menor CPU en render de grilla mensual/semanal.
- Menos llamadas HTTP innecesarias al navegar periodos.
- Menor churn de memoria por arrays temporales en template.

## Validacion
- `npm --prefix frontend run lint` -> `All files pass linting`.
- `npm --prefix frontend run build *> docs/roadmap/reports/t117-build.log` -> build `OK`.

## Nota de entorno
- Node detectado: `v25.2.1` (non-LTS).
