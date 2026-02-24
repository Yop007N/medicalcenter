# SOLID Parallel Backlog - 2026-02-24

## Estado rapido (hecho hoy)
- Frontend profesional: `appointments` migrado de vista estatica a flujo real con API (`listar`, `confirmar`, `cancelar`).
- Frontend profesional: `budgets` migrado de vista estatica a flujo real con API (`listar`, `enviar draft`).
- Frontend profesional: `dashboard` migrado a consumo API real (`overview` + `recent activity`).
- Frontend profesional: `patients` migrado a listado real con filtro por busqueda.
- Frontend profesional: `professionals` migrado a listado real con filtro por especialidad.
- Frontend profesional: `medical-records` migrado a listado real con filtro por `patient_id`.
- Frontend profesional: refactor SOLID en capa API para colecciones (`collection-response.util.ts`) y normalizacion de query params en `ApiService`.
- Backend: tests de workflow integral implementados en `backend/tests/integration/test_workflows.py`.
- BD compose: estado Alembic reconciliado (`alembic_version=63f140c09d89`) + script operativo `scripts/db/reconcile_alembic_state.sh`.
- Backend: `sync_service` sin TODOs, con transiciones persistidas en `SyncLog` y pruebas nuevas.
- Backend: `notification_service` con proveedores configurables para SMS/Push (`log`, `disabled`) y pruebas nuevas.
- Backend: `clinical_history` en progreso SOLID, con `evolutions` movido a `backend/app/services/clinical_history_service.py`.
- Backend: `clinical_history` extendido a servicio para `anamnesis`, `periodontal` y `prescriptions`.
- Backend: `clinical_history` completado en capa servicio para `documents`, `clinical-docs`, `consents`, `timeline` y `summary`.
- Backend: `odontograms` migrado a `backend/app/services/odontogram_service.py`.
- Backend: `psychology` migrado a `backend/app/services/psychology_service.py`.
- QA backend: regresion focal en verde (`57 passed`) para clinical history + odontology + psychology.

## Pendientes por frontend (actor profesional web)
- Validar E2E funcional especifico de vistas (interaccion UI) para:
  - `frontend-profesional/src/app/pages/dashboard.page.ts`
  - `frontend-profesional/src/app/pages/patients.page.ts`
  - `frontend-profesional/src/app/pages/professionals.page.ts`
  - `frontend-profesional/src/app/pages/medical-records.page.ts`

## Pendientes backend (migracion SOLID)
- Media prioridad: consolidar errores de dominio unificados en todos los resources (`ValidationError`, `ResourceNotFoundError`, `AccessDeniedError`).

## Estado migraciones de BD
- `alembic heads`: `63f140c09d89`.
- `alembic_version` en compose: `63f140c09d89`.
- Comando operativo: `npm run db:reconcile-alembic`.

## Cola paralela recomendada (siguiente ola)
1. Backend: unificar mapeo de errores de dominio en resources legacy no migrados.
2. QA: agregar pruebas de integracion UI para nuevas pantallas funcionales en `frontend-profesional`.
3. Operacion DB: ejecutar `db:reconcile-alembic` al inicio de cada despliegue de entorno nuevo.
