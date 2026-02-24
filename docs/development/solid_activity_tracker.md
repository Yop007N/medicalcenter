# SOLID Activity Tracker

Updated: 2026-02-24

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
| frontend-profesional `appointments` | professional | DONE | build ok + smoke auth proxy + acciones confirmar/cancelar | 2026-02-24 |
| frontend-profesional `budgets` | professional | DONE | build ok + smoke auth proxy + accion send | 2026-02-24 |
| frontend-profesional `payments` | professional | DONE | build ok + consumo API real | 2026-02-24 |
| frontend-profesional `reports` | professional | DONE | build ok + consumo API real | 2026-02-24 |
| frontend-profesional `dashboard` | professional | DONE | build ok + consumo API `dashboard/*` | 2026-02-24 |
| frontend-profesional `patients` | professional | DONE | build ok + listado/filtro API `patients` | 2026-02-24 |
| frontend-profesional `professionals` | professional | DONE | build ok + listado/filtro API `professionals` | 2026-02-24 |
| frontend-profesional `medical-records` | professional | DONE | build ok + listado/filtro API `medical-records` | 2026-02-24 |
| backend workflow integration tests | backend | DONE | `tests/integration/test_workflows.py` 2 passed | 2026-02-24 |
| backend access/report suites | backend | DONE | 89 passed en suite focal | 2026-02-24 |
| DB migration state (compose) | backend/db | DONE | `alembic_version=63f140c09d89` | 2026-02-24 |
| backend `clinical_history` split services | backend | IN_PROGRESS | `evolutions` extraido a `EvolutionService` + tests `test_clinical_history_evolutions.py` | 2026-02-24 |
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
- `docker compose exec -T backend pytest -q tests/integration/test_workflows.py` -> 2 passed.
- `python3 scripts/e2e/solid_e2e_check.py --skip-register ...` -> PASS para admin/professional/patient.
- `npm run db:reconcile-alembic` -> `alembic_version=63f140c09d89`.
- `docker compose exec -T backend pytest -q tests/test_sync_service.py tests/test_notification_service.py tests/test_sync_tasks.py` -> 11 passed.
- `docker compose exec -T backend pytest -q tests/test_clinical_history_evolutions.py tests/test_clinical_history_access.py tests/test_sync_service.py tests/test_notification_service.py` -> 18 passed.
- `python3 scripts/e2e/solid_e2e_check.py --backend-url ... --skip-register` -> PASS.
