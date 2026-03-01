# SOLID Activity Tracker

Updated: 2026-02-26

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
| compose/prod healthchecks hardening | ops/devops | DONE | healthchecks + `depends_on: service_healthy` + `docker compose ps` con todos `healthy` | 2026-02-26 |
| backend `auth/logout` token revocation | backend/security | DONE | blocklist JWT (Redis + fallback), callback `token_in_blocklist_loader`, test de token revocado | 2026-02-26 |
| frontend-profesional `e2e` suite propia | professional | DONE | Playwright config + smoke login/dashboard/patients(create)/appointments | 2026-02-26 |
| frontend-paciente `e2e` suite propia | patient | DONE | Playwright config + smoke login/dashboard/turnos disponibilidad/historia odontograma | 2026-02-26 |
| frontend-paciente disponibilidad cercana real | patient | DONE | orden y selección automática por slot más cercano + filtros por especialidad/profesional | 2026-02-26 |
| frontend-admin módulo especialidades (timeline/docs) | admin/professional | DONE | overview con `recent_specialty_encounters` y `recent_documents` filtrados por especialidad | 2026-02-26 |
| logout revocado integrado en frontend-profesional/frontend-paciente | professional/patient | DONE | ambos clientes llaman `POST /api/auth/logout` y limpian sesión en `finalize` | 2026-02-26 |
| P3 lane A1 módulos dedicados por especialidad (admin/professional) | admin/professional | IN_PROGRESS | navegación consolidada por especialidad con home dedicado + redirect legacy + factoría de rutas (pendiente sustituir `workspace` genérico) | 2026-03-01 |
| P3 lane A2 segmentación de historiales por especialidad | admin/professional | IN_PROGRESS | filtros server-side + fallback profesional por especialidad propia en `appointments/medical-records/files/budgets/payments/patients` | 2026-03-01 |
| P3 lane A3 unificación UI transversal (modales/tokens) | admin/professional | PENDING | eliminación de modales nativos + tokens únicos aplicados globalmente | 2026-02-26 |
| P3 lane A4 archivos contextuales por paciente | admin/professional | IN_PROGRESS | `/files` vacío sin selección + listado exclusivo del paciente seleccionado | 2026-02-26 |
| P3 lane B1 workspace profesional por asignación | professional | IN_PROGRESS | validación create/update de citas contra asignación real + auto-asignación solo en primer contacto sin owner | 2026-03-01 |
| P3 lane B2 alta de paciente con credenciales y asignación | professional | PENDING | create paciente -> login paciente válido -> relación con profesional | 2026-02-26 |
| P3 lane B3 módulo clínico por especialidad en web profesional | professional | PENDING | flujo clínico especializado operativo por rol/especialidad | 2026-02-26 |
| P3 lane B4 E2E profundo frontend-profesional | professional | PENDING | CRUD real en patients/appointments/records/files/budgets/payments | 2026-02-26 |
| P3 lane C1 agenda inteligente paciente por slot real | patient | IN_PROGRESS | búsqueda por especialidad/profesional + slot libre más cercano | 2026-02-26 |
| P3 lane C2 historia clínica paciente por especialidad | patient | PENDING | timeline especializado + odontograma lectura + documentos por área | 2026-02-26 |
| P3 lane C3 UX/UI paciente premium | patient | PENDING | mejora visual y de interacción mobile-first consistente | 2026-02-26 |
| P3 lane C4 E2E profundo frontend-paciente | patient | PENDING | journeys completos de turnos/historia/presupuestos/perfil | 2026-02-26 |
| P3 lane D1 asignación profesional-paciente-especialidad backend | backend | IN_PROGRESS | modelo y reglas centralizadas en servicios de acceso + filtros server-side por `specialty_key` | 2026-02-26 |
| P3 lane D2 motor disponibilidad + anti double-booking | backend | IN_PROGRESS | endpoint de slots + validación transaccional de reserva por rango horario | 2026-02-26 |
| P3 lane D3 endpoints clínicos especializados | backend | PENDING | timeline/documentos/resumen por especialidad | 2026-02-26 |
| P3 lane D4 seed clínico realista no hardcodeado | backend/db | PENDING | script reproducible de datos por especialidad/actor | 2026-02-26 |
| P3 lane E1 matriz E2E por actor/especialidad | qa/release | PENDING | evidencia automatizada consolidada por lane | 2026-02-26 |
| P3 lane E2 contract tests APIs compartidas | qa/backend/frontend | PENDING | validación de contrato en CI para evitar regresiones | 2026-02-26 |
| P3 lane E3 checklist release/rollback por lane | ops/devops | PENDING | checklist ejecutable + rollback validado por actor | 2026-02-26 |

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

## Evidencia ejecutada (2026-02-26)
- `docker compose config` -> `DEV_CONFIG_OK`.
- `docker compose -f docker-compose.prod.yml config` -> `PROD_CONFIG_OK`.
- `docker compose up -d` -> arranque con gating por `service_healthy`.
- `docker compose ps` -> `postgres/redis/backend/celery/frontend-web/frontend-admin/frontend-pwa` en `healthy`.
- `docker compose exec -T backend pytest -q tests/test_auth.py tests/test_specialties.py` -> `32 passed`.
- `cd frontend-admin-profesional && npm run build` -> `PASS`.
- `cd frontend-profesional && npm run build` -> `PASS`.
- `cd frontend-paciente && npm run build` -> `PASS`.
- `cd frontend-profesional && BASE_URL=http://10.4.33.184 npm run e2e:chromium` -> `3 passed`.
- `cd frontend-paciente && BASE_URL=http://10.4.33.184:8100 npm run e2e:chromium` -> `3 passed`.

## Evidencia ejecutada (2026-03-01)
- `npm --prefix frontend-admin-profesional run build` -> `PASS`.
- `cd frontend-admin-profesional && LD_LIBRARY_PATH=/home/cfernanv/workspace/pro/empresas/medical-services/frontend-profesional/.local-libs/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH BASE_URL=http://10.4.33.184:4200 npm run e2e:critical` -> `5 passed`.
- refactor A1 aplicado:
  - `frontend-admin-profesional/src/app/features/specialties/specialty-home/specialty-routes.factory.ts`
  - `frontend-admin-profesional/src/app/features/specialties/legacy-specialty-redirect.page.ts`
  - `frontend-admin-profesional/src/app/core/constants/specialty-navigation.ts`
  - `frontend-admin-profesional/src/app/layouts/main-layout/main-layout.component.ts`
  - `frontend-admin-profesional/src/app/app.routes.ts`
  - 21 archivos `*.routes.ts` de especialidades migrados a `buildSpecialtyHomeRoutes(...)`.
- `cd frontend-admin-profesional && BASE_URL=http://10.4.33.184:4200 npm run e2e:critical` -> `5 passed`.
- `docker compose exec -T backend pytest -q tests/test_patients.py tests/test_appointments.py tests/test_professionals.py tests/test_medical_records.py` -> `92 passed`.
- `docker compose exec -T backend pytest -q tests/test_auth.py` -> `28 passed`.
- `docker compose exec -T backend pytest -q tests/test_patients.py` -> `29 passed` (incluye create paciente -> login con credenciales nuevas).
- `npm --prefix frontend-profesional run build` -> `PASS`.
- `npm --prefix frontend-admin-profesional run build` -> `PASS`.
- `npm --prefix frontend-paciente run build` -> `PASS`.
- `cd frontend-profesional && BASE_URL=http://127.0.0.1 LD_LIBRARY_PATH=$HOME/.local/playwright-deps/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH npm run e2e:chromium` -> `3 passed`.
- `cd frontend-paciente && BASE_URL=http://127.0.0.1:8100 LD_LIBRARY_PATH=$HOME/.local/playwright-deps/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH npm run e2e:chromium` -> `3 passed`.
- `cd frontend-admin-profesional && BASE_URL=http://127.0.0.1:4200 LD_LIBRARY_PATH=$HOME/.local/playwright-deps/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH npm run e2e:critical` -> `5 passed`.
- `PYTHONDONTWRITEBYTECODE=1 pytest -q -o addopts= backend/tests/test_appointments.py::TestCreateAppointment::test_create_appointment_auto_assigns_unlinked_patient_for_professional backend/tests/test_appointments.py::TestCreateAppointment::test_create_appointment_rejects_patient_owned_by_other_professional backend/tests/test_appointments.py::TestUpdateAppointment::test_update_appointment_rejects_patient_outside_professional_scope` -> `3 passed`.
- `PYTHONDONTWRITEBYTECODE=1 pytest -q -o addopts= backend/tests/test_appointments.py::TestCreateAppointment::test_create_appointment_success backend/tests/test_budgets.py::TestListBudgets::test_professional_can_list_budgets_scoped_by_own_specialty backend/tests/test_files.py::TestListFilesScope::test_professional_can_list_files_scoped_by_own_specialty backend/tests/test_payments.py::TestListPayments::test_professional_can_list_payments_scoped_by_own_specialty backend/tests/test_patients.py::TestListPatients::test_professional_list_patients_filtered_by_specialty_key backend/tests/test_medical_records.py::TestListMedicalRecords::test_list_medical_records_filter_by_specialty_key_for_admin` -> `6 passed`.
- `npm --prefix frontend-profesional run build` -> `PASS`.
- `cd frontend-profesional && BASE_URL=http://10.4.33.184 LD_LIBRARY_PATH=/home/cfernanv/workspace/pro/empresas/medical-services/frontend-profesional/.local-libs/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH npm run e2e -- e2e/tests/specialty-scope-smoke.spec.ts --project=chromium` -> `1 passed`.
