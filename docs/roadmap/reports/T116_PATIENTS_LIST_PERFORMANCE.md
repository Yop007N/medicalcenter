# T116 - Performance de Lista de Pacientes

Fecha: 2026-02-15

## Objetivo
Mejorar rendimiento de renderizado y busqueda en `patients-list`.

## Cambios aplicados
- `frontend/src/app/features/patients/patients-list/patients-list.page.ts`
  - `changeDetection` migrado a `OnPush`.
  - Eliminadas funciones costosas invocadas desde template:
    - `getInitials`
    - `getActiveCount`
    - `getInactiveCount`
  - Precomputo de datos de vista por paciente:
    - `initials`
    - `searchIndex` (nombre/apellido/email en lowercase)
  - Cache de contadores:
    - `activeCount`
    - `inactiveCount`
  - Filtro optimizado reutilizando `searchIndex` precomputado.
  - `ionRefresh` ligado al fin real de la carga HTTP (sin timeout fijo).
  - `skeletonCards` constante para evitar crear arrays en cada render.

## Impacto esperado
- Menos trabajo de change detection en cada ciclo.
- Menos recomputo durante busquedas incrementales.
- Mejor respuesta visual en refresco manual.

## Validacion
- `npm --prefix frontend run lint` -> `All files pass linting`.
- `npm --prefix frontend run build *> docs/roadmap/reports/t116-build.log` -> build `OK`.

## Nota de entorno
- Node detectado: `v25.2.1` (non-LTS).
