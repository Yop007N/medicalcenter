# Sprint Backlog P0/P1/P2

Actualizado: 2026-02-24

## Objetivo
Definir backlog ejecutable para cerrar brechas de producto (backend + 3 frontends + operacion) sin trabajo duplicado.

## P0 (hoy - 48h)

### P0.1 Backend: unificar errores legacy en resources restantes
- Alcance:
  - `backend/app/resources/dashboard.py`
  - `backend/app/resources/reports.py`
  - `backend/app/resources/psychopedagogy.py`
  - `backend/app/resources/users.py`
  - `backend/app/resources/logs.py`
  - `backend/app/resources/sync.py`
- Estado: `DONE`
- Criterio de cierre:
  - payload de error consistente (`msg`) y codigos HTTP coherentes.
  - pruebas focalizadas en verde.
- Evidencia:
  - resources legacy migrados a `message_response`/`domain_error_response`.
  - nuevo test de logs frontend: `backend/tests/test_logs_frontend.py`.
  - `docker compose exec -T backend pytest -q tests/test_psychopedagogy.py tests/test_dashboard.py tests/test_reports.py tests/test_users.py tests/test_sync_endpoints.py tests/test_logs_frontend.py` -> `125 passed`.

### P0.2 QA UI real profesional (Playwright)
- Alcance:
  - login profesional y navegacion de vistas principales en servidor activo.
- Estado: `DONE` (evidencia 2026-02-24)
- Criterio de cierre:
  - smoke Playwright `PASS` en `/dashboard`, `/professionals`, `/patients`, `/appointments`, `/medical-records`, `/budgets`, `/payments`, `/reports`.

### P0.3 Operacion: estabilizar endpoint activo por cambio de IP
- Alcance:
  - documentar endpoint por actor, healthchecks y recovery.
- Estado: `DONE`
- Evidencia:
  - `docs/deployment/ENDPOINTS_ACCESO_SMOKE_PLAYWRIGHT.md`

## P1 (3 - 7 dias)

### P1.1 Frontend profesional: pasar de lectura a operacion completa
- Alcance:
  - `patients`: crear/editar/ver detalle.
  - `professionals`: crear/editar/ver detalle.
  - `medical-records`: crear/editar/delete desde UI.
  - `payments`: crear/procesar/delete.
  - `reports`: filtros avanzados + export.
- Estado: `DONE` (evidencia 2026-02-24)
- Criterio de cierre:
  - acciones CRUD/operativas disponibles por vista.
  - smoke funcional por modulo.
- Evidencia:
  - `frontend-profesional/src/app/pages/patients.page.ts`: create/update/detail en UI.
  - `frontend-profesional/src/app/pages/professionals.page.ts`: create/update/detail con permisos por rol.
  - `frontend-profesional/src/app/pages/medical-records.page.ts`: create/update/delete.
  - `frontend-profesional/src/app/pages/payments.page.ts`: create/process/delete.
  - `frontend-profesional/src/app/pages/reports.page.ts`: filtros por rango + export CSV.
  - `npm run frontend-profesional:build` -> `PASS`.

### P1.2 Paciente PWA: cerrar paridad funcional prioritaria
- Alcance:
  - historia clinica completa con timeline/documentos/consents robustos.
  - UX de errores/sync offline en acciones criticas.
- Estado: `DONE` (evidencia 2026-02-24)
- Criterio de cierre:
  - flujos paciente end-to-end sin pasos manuales.
- Evidencia:
  - `frontend-paciente/src/app/pages/my-history.page.ts`: fallback por seccion, panel de conectividad, contador de cambios pendientes y accion manual de sync.
  - acciones criticas endurecidas offline (`sign/reject consent`, `download document`) con mensajes UX consistentes.
  - `npm run frontend-paciente:build` -> `PASS`.

### P1.3 Frontend principal admin/profesional: hardening de suite E2E
- Alcance:
  - ejecutar y estabilizar subconjunto critico de `frontend-admin-profesional/e2e/tests/*.spec.ts`.
- Estado: `DONE` (evidencia 2026-02-24)
- Criterio de cierre:
  - suite critica verde (auth, dashboard, patients, appointments, api-integration).
- Evidencia:
  - nuevo spec: `frontend-admin-profesional/e2e/tests/critical-smoke.spec.ts`.
  - comando: `BASE_URL=http://localhost:4200 LD_LIBRARY_PATH=$HOME/.local/playwright-deps/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH npx playwright test --config=e2e/playwright.config.ts --project=chromium --no-deps e2e/tests/critical-smoke.spec.ts`.
  - resultado: `5 passed` (`auth`, `dashboard`, `patients`, `appointments`, `api-integration`).
  - smoke de integracion por actor: `python3 scripts/e2e/solid_e2e_check.py --skip-register` -> `PASS`.

### P1.4 Frontend profesional: modulo presupuestos CRUD completo
- Alcance:
  - `budgets`: crear/editar/eliminar/enviar + filtros por paciente y estado.
- Estado: `DONE` (evidencia 2026-02-24)
- Criterio de cierre:
  - operaciones principales del caso de uso de presupuesto disponibles en una sola vista.
  - build de frontend profesional en verde.
- Evidencia:
  - `frontend-profesional/src/app/pages/budgets.page.ts`: formulario create/edit, accion delete, accion send y filtros operativos.
  - `npm run frontend-profesional:build` -> `PASS`.

### P1.5 Frontend profesional: modulo citas con operacion completa
- Alcance:
  - `appointments`: crear/editar/confirmar/cancelar + filtros por paciente y estado.
- Estado: `DONE` (evidencia 2026-02-24)
- Criterio de cierre:
  - flujo de agenda operable desde una sola vista sin pasos manuales.
  - build de frontend profesional en verde.
- Evidencia:
  - `frontend-profesional/src/app/pages/appointments.page.ts`: formulario create/edit con estado, confirmacion/cancelacion y filtros operativos.
  - `npm run frontend-profesional:build` -> `PASS`.

### P1.6 Frontend profesional: modulo archivos clinicos (UC-MS-009 / RF-013)
- Alcance:
  - `files`: listar, filtrar por paciente, cargar, descargar y eliminar archivos clinicos.
- Estado: `DONE` (evidencia 2026-02-24)
- Criterio de cierre:
  - operaciones de archivo disponibles en UI profesional con integracion backend.
  - validacion tecnica en build frontend y pruebas backend de archivos.
- Evidencia:
  - nueva vista: `frontend-profesional/src/app/pages/files.page.ts`.
  - ruta/nav: `frontend-profesional/src/app/app.routes.ts`, `frontend-profesional/src/app/app.component.ts`.
  - servicio: `frontend-profesional/src/app/core/services/file.service.ts`.
  - `npm run frontend-profesional:build` -> `PASS`.
  - `docker compose exec -T backend pytest -q tests/test_files.py` -> `19 passed`.

### P1.7 Frontend profesional: modulo odontologia operativo (UC-MS-010 / RF-014)
- Alcance:
  - `odontology`: crear/listar odontogramas, actualizar dientes por FDI y operar tratamientos dentales.
- Estado: `DONE` (evidencia 2026-02-24)
- Criterio de cierre:
  - flujo odontologico usable en frontend profesional con integracion real de `/api/odontograms` y `/api/dental-treatments`.
  - build frontend y regresion backend del dominio en verde.
- Evidencia:
  - nueva vista: `frontend-profesional/src/app/pages/odontology.page.ts`.
  - servicio API: `frontend-profesional/src/app/core/services/odontology.service.ts`.
  - rutas/nav: `frontend-profesional/src/app/app.routes.ts`, `frontend-profesional/src/app/app.component.ts`.
  - `npm run frontend-profesional:build` -> `PASS`.
  - `docker compose exec -T backend pytest -q tests/test_odontology.py` -> `18 passed`.

### P1.8 Frontend admin/profesional: salud mental operativa (UC-MS-011 / RF-015)
- Alcance:
  - `psychology` y `psychopedagogy`: quitar placeholders de rutas y habilitar operacion real de evaluaciones + sesiones.
  - alinear contratos frontend con endpoints backend (`evaluations/patient|professional`, `evaluations/{id}/sessions`).
- Estado: `DONE` (evidencia 2026-02-24)
- Criterio de cierre:
  - rutas de salud mental funcionales para admin/professional.
  - CRUD operativo en UI para evaluaciones y sesiones en ambos modulos.
  - build de frontend admin/profesional en verde.
- Evidencia:
  - `frontend-admin-profesional/src/app/features/psychology/psychology-home/psychology-home.page.ts`
  - `frontend-admin-profesional/src/app/features/psychopedagogy/psychopedagogy-home/psychopedagogy-home.page.ts`
  - `frontend-admin-profesional/src/app/core/services/psychology-api.service.ts`
  - `frontend-admin-profesional/src/app/core/services/psychopedagogy-api.service.ts`
  - `frontend-admin-profesional/src/app/core/api/api-endpoints.ts`
  - `cd frontend-admin-profesional && npm run build` -> `PASS`.

### P1.9 Frontend paciente PWA: turnos con operacion de cancelacion
- Alcance:
  - `my-appointments`: filtros operativos (`all/upcoming/completed/cancelled`) + cancelacion de turno con motivo.
  - ajuste de cliente API para DELETE con query params.
- Estado: `DONE` (evidencia 2026-02-24)
- Criterio de cierre:
  - paciente puede gestionar agenda con filtros y cancelar turnos propios en UI.
  - build PWA en verde.
- Evidencia:
  - `frontend-paciente/src/app/pages/my-appointments.page.ts`
  - `frontend-paciente/src/app/core/services/patient-api.service.ts`
  - `frontend-paciente/src/app/core/services/api-client.service.ts`
  - `frontend-paciente/src/app/core/services/api-endpoints.ts`
  - `cd frontend-paciente && npm run build` -> `PASS`.

## P2 (1 - 2 semanas)

### P2.1 Sync productivo
- Alcance:
  - versionado por registro.
  - conflicto por entidad (no solo timestamp).
  - idempotencia multi-nodo.
- Estado: `DONE` (evidencia 2026-02-24)
- Referencia:
  - `docs/architecture/sync-strategy.md`
- Evidencia:
  - migracion: `backend/migrations/versions/f0e1d2c3b4a5_add_sync_versioning_and_multi_node_idempotency.py`.
  - modelos con `sync_version`: `appointment`, `medical_record`, `budget`, `payment`, `file`.
  - `sync_logs` extendido con `result_entity_version` + indice unico `idempotency_key/direction`.
  - `backend/app/resources/sync.py` actualizado con:
    - conflicto por entidad via politicas `ENTITY_CONFLICT_POLICIES`,
    - deteccion por `sync_version` (y fallback timestamp segun politica),
    - reserva de idempotency key + replay seguro ante concurrencia.
  - pruebas: `docker compose exec -T backend pytest -q tests/test_sync_endpoints.py tests/test_sync_service.py tests/test_sync_tasks.py` -> `25 passed`.
  - migracion aplicada en runtime: `docker compose exec -T backend alembic upgrade head` y `alembic current` -> `f0e1d2c3b4a5`.

### P2.2 Hardening operativo release
- Alcance:
  - healthchecks avanzados compose/prod.
  - observabilidad y alertas.
  - backup/restore y rollback validados periodicamente.
- Estado: `PENDING`
- Referencias:
  - `docs/deployment/COMPOSE_AUDIT.md`
  - `docs/deployment/ROLLBACK_RUNBOOK.md`
  - `docs/deployment/BACKUP_RESTORE_AUDIT.md`

## Ejecucion inmediata (siguiente foco)
1. Ejecutar QA E2E funcional integral (profesional + paciente) incluyendo modulo `files`.
2. Iniciar `P2.2` (operacion release): healthchecks avanzados, alertas y validacion periodica de rollback/restore.
