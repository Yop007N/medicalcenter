# T115 - Optimizacion de Bundle Inicial (Frontend Principal)

Fecha: 2026-02-15

## Objetivo
Reducir el tamano del bundle inicial del frontend principal sin romper compilacion ni lint.

## Cambios aplicados
- `frontend/src/main.ts`
  - Se elimino `provideStoreDevtools` del arranque.
  - Se redujo el registro global de efectos a `AuthEffects` y `FilesEffects`.
  - Se mantuvo `serviceWorker` condicionado por `environment.production`.
- Rutas lazy con efectos por feature (`provideEffects(...)`):
  - `frontend/src/app/features/patients/patients.routes.ts`
  - `frontend/src/app/features/professionals/professionals.routes.ts`
  - `frontend/src/app/features/appointments/appointments.routes.ts`
  - `frontend/src/app/features/medical-records/medical-records.routes.ts`
  - `frontend/src/app/features/budgets/budgets.routes.ts`
  - `frontend/src/app/features/payments/payments.routes.ts`
  - `frontend/src/app/features/odontology/odontology.routes.ts`
  - `frontend/src/app/features/psychology/psychology.routes.ts`
  - `frontend/src/app/features/psychopedagogy/psychopedagogy.routes.ts`
  - `frontend/src/app/features/reports/reports.routes.ts`
  - `frontend/src/app/features/audit/audit.routes.ts`
- Inicializacion de servicios de shell movida al layout lazy:
  - `frontend/src/app/layouts/main-layout/main-layout.component.ts`

## Metricas (build de produccion)
- Baseline (`docs/roadmap/reports/t115-baseline-build.log`)
  - `main`: `97.88 kB`
  - `Initial total`: `1.50 MB`
  - `Estimated transfer`: `290.81 kB`
- Post (`docs/roadmap/reports/t115-post3-build.log`)
  - `main`: `36.05 kB`
  - `Initial total`: `1.48 MB`
  - `Estimated transfer`: `295.53 kB`

## Resultado
- Objetivo de `T115` cumplido en tamano bruto inicial (`1.50 MB -> 1.48 MB`).
- Se observa aumento en transferencia estimada (`290.81 kB -> 295.53 kB`) por mayor fragmentacion de chunks iniciales.

## Validacion
- `npm --prefix frontend run lint` -> `All files pass linting`.
- `npm --prefix frontend run build` -> `Application bundle generation complete`.

## Notas de entorno
- Node detectado: `v25.2.1` (non-LTS).
