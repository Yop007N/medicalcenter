# SOLID Activity Tracker

Updated: 2026-02-25

## Objetivo
Evitar trabajo duplicado y medir avance real por modulo con evidencia ejecutable.

## Como medir "terminado"
Un item se considera terminado solo cuando tiene al menos:
- `code`: cambio implementado en archivos objetivo.
- `build`: build del frontend afectado o check de arranque backend.
- `tests`: pruebas del modulo en verde.
- `e2e`: smoke del actor afectado (si aplica).
- `migrations`: estado Alembic consistente (si toca DB).

## Semaforo
- `DONE`: cumple evidencia minima.
- `IN_PROGRESS`: codigo parcial o sin evidencia completa.
- `PENDING`: aun no iniciado.
- `BLOCKED`: depende de decision o incidencia externa.

## Registro por modulo
| Modulo | Actor | Estado | Evidencia minima | Ultima actualizacion |
|---|---|---|---|---|
| frontend-profesional `appointments` | professional | DONE | build ok + CRUD operativo (create/edit/confirm/cancel) + filtros por paciente/estado | 2026-02-24 |
| frontend-profesional `budgets` | professional | DONE | build ok + CRUD (create/edit/delete/send) + filtros por paciente/estado | 2026-02-24 |
| frontend-profesional `payments` | professional | DONE | build ok + consumo API real | 2026-02-24 |
| frontend-profesional `reports` | professional | DONE | build ok + consumo API real | 2026-02-24 |
| frontend-profesional `dashboard` | professional | DONE | build ok + consumo API `dashboard/*` | 2026-02-24 |
| frontend-profesional `patients` | professional | DONE | build ok + listado/filtro API `patients` | 2026-02-24 |
| frontend-profesional `professionals` | professional | DONE | build ok + listado/filtro API `professionals` | 2026-02-24 |
| frontend-profesional `medical-records` | professional | DONE | build ok + listado/filtro API `medical-records` | 2026-02-24 |
| frontend-profesional `files` | professional | DONE | build ok + listado/filtro + upload/download/delete API `files` | 2026-02-24 |
| frontend-admin-profesional `psychology` | admin/professional | DONE | rutas activas + CRUD evaluaciones/sesiones + build ok | 2026-02-24 |
| frontend-admin-profesional `psychopedagogy` | admin/professional | DONE | rutas activas + CRUD evaluaciones/sesiones + build ok | 2026-02-24 |
| frontend-admin-profesional `files` | admin/professional | DONE | ruta/menu + listado/filtro + upload/download/delete API `files` + build ok | 2026-02-24 |
| frontend-paciente `my-history` offline UX | patient | DONE | build ok + conectividad/sync manual + fallback por seccion | 2026-02-24 |
| frontend-paciente `my-appointments` operacion | patient | DONE | solicitud de turno + filtros agenda + cancelacion turno + build ok | 2026-02-24 |
| frontend-admin-profesional `critical-smoke` | admin/professional | DONE | Playwright chromium 5/5 (`auth/dashboard/patients/appointments/api-integration`) | 2026-02-24 |
| backend `sync` productivo (version/conflict/idempotency) | backend | DONE | `sync_version` por entidad + politica de conflicto por entidad + idempotencia multi-nodo | 2026-02-24 |
| backend workflow integration tests | backend | DONE | `tests/integration/test_workflows.py` 2 passed | 2026-02-24 |
| backend access/report suites | backend | DONE | 89 passed en suite focal | 2026-02-24 |
| backend legacy error mapping (`dashboard/reports`) | backend | DONE | payload `msg` unificado con helper compartido + `test_dashboard.py` y `test_reports.py` en verde | 2026-02-24 |
| backend legacy error mapping (`psychopedagogy/users/logs/sync`) | backend | DONE | recursos normalizados con `message_response`/`domain_error_response` + pruebas focalizadas en verde | 2026-02-24 |
| DB migration state (compose) | backend/db | DONE | `alembic_version=63f140c09d89` | 2026-02-24 |
| backend `clinical_history` split services | backend | DONE | `evolutions`, `anamnesis`, `periodontal`, `documents`, `clinical-docs`, `consents`, `timeline/summary` extraidos + pruebas `test_clinical_history_*` | 2026-02-24 |
| backend `odontograms` split services | backend | DONE | `OdontogramService` + regresion `test_odontology.py` | 2026-02-24 |
| backend `psychology` split services | backend | DONE | `PsychologyService` + regresion `test_psychology.py` | 2026-02-24 |
| backend `psychopedagogy` split services | backend | DONE | `PsychopedagogyService` + regresion `test_psychopedagogy.py` | 2026-02-24 |
| backend `logs` split services | backend | DONE | `LogsService` + recurso HTTP delgado + `tests/test_logs_frontend.py` | 2026-02-24 |
| backend `sync_service` TODOs | backend | DONE | estados `pending/in_progress/completed/failed` + tests `test_sync_service.py` | 2026-02-24 |
| backend `notification_service` TODOs | backend | DONE | proveedores `log/disabled` para sms/push + tests `test_notification_service.py` | 2026-02-24 |

## Regla operativa para no duplicar
Antes de empezar un item:
1. Buscar el modulo en esta tabla.
2. Si esta `DONE`, no reabrir salvo bug/regresion con issue nueva.
3. Si esta `IN_PROGRESS`, continuar solo sobre ese alcance y actualizar evidencia.
4. Al cerrar, registrar comando exacto usado para validar.

## Evidencia ejecutada (2026-02-24)
- `npm run frontend-profesional:build` -> OK.
- `npm run frontend-paciente:build` -> OK.
- `cd frontend-admin-profesional && BASE_URL=http://localhost:4200 LD_LIBRARY_PATH=$HOME/.local/playwright-deps/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH npx playwright test --config=e2e/playwright.config.ts --project=chromium --no-deps e2e/tests/critical-smoke.spec.ts` -> 5 passed.
- `docker compose exec -T backend pytest -q tests/test_sync_endpoints.py tests/test_sync_service.py tests/test_sync_tasks.py` -> 25 passed.
- `docker compose exec -T backend alembic upgrade head && docker compose exec -T backend alembic current` -> `f0e1d2c3b4a5 (head)`.
- `docker compose exec -T backend pytest -q tests/integration/test_workflows.py` -> 2 passed.
- `python3 scripts/e2e/solid_e2e_check.py --skip-register ...` -> PASS para admin/professional/patient.
- `npm run db:reconcile-alembic` -> `alembic_version=63f140c09d89`.
- `docker compose exec -T backend pytest -q tests/test_sync_service.py tests/test_notification_service.py tests/test_sync_tasks.py` -> 11 passed.
- `docker compose exec -T backend pytest -q tests/test_clinical_history_evolutions.py tests/test_clinical_history_access.py tests/test_sync_service.py tests/test_notification_service.py` -> 18 passed.
- `python3 scripts/e2e/solid_e2e_check.py --backend-url ... --skip-register` -> PASS.
- `python3 scripts/e2e/solid_e2e_check.py --backend-url http://127.0.0.1:5000 --frontend-admin-url http://127.0.0.1:4200 --frontend-profesional-url http://127.0.0.1 --frontend-paciente-url http://127.0.0.1:8100 --skip-register` -> PASS.
- `docker compose exec -T backend pytest -q tests/test_clinical_history_evolutions.py tests/test_clinical_history_access.py tests/test_clinical_history_subdomains.py tests/test_odontology.py tests/test_psychology.py` -> 51 passed.
- `docker compose exec -T backend pytest -q tests/test_clinical_history_evolutions.py tests/test_clinical_history_subdomains.py tests/test_clinical_history_documents_timeline.py tests/test_clinical_history_access.py tests/test_odontology.py tests/test_psychology.py` -> 57 passed.
- `docker compose exec -T backend pytest -q tests/test_dashboard.py tests/test_reports.py` -> 60 passed.
- `docker compose exec -T backend pytest -q tests/test_users.py tests/test_sync_endpoints.py tests/test_logs_frontend.py` -> 49 passed.
- `docker compose exec -T backend pytest -q tests/test_psychopedagogy.py tests/test_dashboard.py tests/test_reports.py tests/test_users.py tests/test_sync_endpoints.py tests/test_logs_frontend.py` -> 125 passed.
- `docker compose exec -T backend pytest -q tests/test_psychopedagogy.py tests/test_psychology.py tests/test_sync_endpoints.py` -> 54 passed.
- `docker compose exec -T backend pytest -q tests/test_logs_frontend.py` -> 7 passed.
- `npm run frontend-profesional:build` (post CRUD budgets + appointments) -> OK.
- `docker compose exec -T backend pytest -q tests/test_files.py` -> 19 passed.
- `npm run frontend-profesional:build` (post modulo `files`) -> OK.
- `cd frontend-admin-profesional && npm run build` (post modulos psychology/psychopedagogy) -> OK.
- `cd frontend-paciente && npm run build` (post operacion `my-appointments`) -> OK.
- `npm run frontend-profesional:build` (post ajuste `optimization.fonts=false` para build offline) -> OK.
- `npm run frontend-admin-profesional:build` (post modulo `files` + build offline sin inlining de Google Fonts) -> OK.
- `npm run frontend-paciente:build` (post solicitud de turnos por paciente) -> OK.

## Evidencia ejecutada (2026-02-25)
- `hostname -I` -> IP activa validada: `10.4.33.184`.
- `curl -sS -i http://10.4.33.184:5000/health` -> 200 (`database=healthy`, `redis=healthy`).
- `curl -sS -i http://10.4.33.184:4200/auth/login` -> 200.
- `curl -sS -i http://10.4.33.184/auth/login` -> 200.
- `curl -sS -i http://10.4.33.184:8100/auth/login` -> 200.
- `curl -sS -i -X POST http://10.4.33.184:4200/api/auth/login ...` -> 200 (`admin`).
- `curl -sS -i -X POST http://10.4.33.184/api/auth/login ...` -> 200 (`professional`).
- `curl -sS -i -X POST http://10.4.33.184:8100/api/auth/login ...` -> 200 (`patient`).
- `python3 scripts/e2e/solid_e2e_check.py --backend-url http://10.4.33.184:5000 --frontend-admin-url http://10.4.33.184:4200 --frontend-profesional-url http://10.4.33.184 --frontend-paciente-url http://10.4.33.184:8100 --skip-register` -> `E2E summary: PASS`.
- `docker run --rm --network host ... node /work/scripts/professional_ui_smoke.mjs` (BASE_URL `http://10.4.33.184`) -> `PASS` en `/dashboard,/professionals,/patients,/appointments,/medical-records,/budgets,/payments,/reports`.
- `cd frontend-admin-profesional && BASE_URL=http://10.4.33.184:4200 ... npx playwright test --config=e2e/playwright.config.ts --project=chromium --no-deps e2e/tests/critical-smoke.spec.ts` -> `5 passed`.
- `docker run --rm --network host ... node patient_ui_smoke.mjs` (BASE_URL `http://10.4.33.184:8100`) -> `PASS` en `/dashboard,/my-appointments,/my-budgets,/my-history,/my-profile`.
