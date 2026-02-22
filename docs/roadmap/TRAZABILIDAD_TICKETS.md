# Trazabilidad de Tickets Tecnicos

Actualizado: 2026-02-15

## SYNC-01
Estado: `done`

Cambios:
- `backend/app/resources/sync.py`: handlers reales por entidad en `/api/sync/push`.
- `backend/app/resources/sync.py`: extension de `/api/sync/pull` a entidades soportadas.
- `backend/tests/test_sync_endpoints.py`: pruebas de endpoints sync.

Evidencia:
- `backend/.venv311/Scripts/python -m pytest backend/tests/test_sync_endpoints.py -q` -> `12 passed`.

## SYNC-02
Estado: `done`

Cambios:
- `backend/app/resources/sync.py`: idempotencia (`idempotency_key`/fingerprint).
- `backend/app/resources/sync.py`: conflictos `server_wins` por `updated_at`.
- `backend/app/models/sync_log.py`: metadata de idempotencia/conflicto.
- `docs/architecture/sync-strategy.md` y `docs/database/schema.md`: documentacion actualizada.

Evidencia:
- `backend/.venv311/Scripts/python -m pytest backend/tests/test_sync.py -q` -> `27 passed`.
- `backend/.venv311/Scripts/python -m pytest backend/tests/test_sync_endpoints.py -q` -> `12 passed`.

## SYNC-03-SPEC-01
Estado: `done`

Cambios:
- `docs/roadmap/SYNC-03_VERSIONADO_POR_ENTIDAD.md`: ticket tecnico de versionado por entidad, contrato `client_version/row_version`, plan de migracion y criterios de aceptacion.
- `docs/README.md`: enlace al ticket tecnico en indice de roadmap.

Evidencia:
- Documento creado y enlazado en indice de documentacion.

## QA-SMOKE-API-01
Estado: `done`

Cobertura de humo ejecutada:
- `backend/tests/test_auth.py`
- `backend/tests/test_patients.py`
- `backend/tests/test_appointments.py`

Evidencia:
- `backend/.venv311/Scripts/python -m pytest backend/tests/test_auth.py backend/tests/test_patients.py backend/tests/test_appointments.py -q` -> `60 passed`.

## QA-REG-CORE-01
Estado: `done`

Cambios:
- `tools/autonomy/qa_report.py`: nueva suite `backend_regression_core` integrada al reporte QA diario.
- `docs/roadmap/qa/QA-REG-CORE-01_BACKEND_REGRESSION_SUITE.md`: especificacion de alcance, ejecucion y criterios de aceptacion.

Evidencia:
- `backend/.venv311/Scripts/python -m pytest backend/tests/test_auth.py backend/tests/test_patients.py backend/tests/test_professionals.py backend/tests/test_appointments.py backend/tests/test_medical_records.py backend/tests/test_files.py backend/tests/test_budgets.py backend/tests/test_payments.py backend/tests/test_reports.py backend/tests/test_users.py backend/tests/test_backups.py -q` -> PASS.
- `backend/.venv311/Scripts/python -m tools.autonomy.cli qa-report --run-tests --python-executable backend/.venv311/Scripts/python --cwd .` -> incluye `backend_regression_core`.

## QA-E2E-CORE-01
Estado: `done`

Cambios:
- `docs/roadmap/qa/QA-E2E-CORE-01_MATRIZ_CASOS.md`: matriz E2E minima para flujos core.

Evidencia:
- Matriz publicada con precondiciones y validaciones observables por flujo.

## QA-LOAD-01-SPEC
Estado: `done`

Cambios:
- `docs/roadmap/qa/QA-LOAD-01_PRUEBAS_CARGA.md`: ticket de carga con alcance, metricas y criterios de aceptacion.

Evidencia:
- Ticket publicado para ejecucion en fase siguiente.

## QA-E2E-02-SPEC
Estado: `done`

Cambios:
- `docs/roadmap/qa/QA-E2E-02_OFFLINE_ONLINE_SYNC.md`: ticket E2E offline/online sync con casos de reconexion, idempotencia y conflictos.

Evidencia:
- Ticket publicado para ejecucion en fase siguiente.

## FE-LINT-BUILD-01
Estado: `done`

Cambios:
- Migracion a `inject()` en handlers/componentes para cumplir regla `@angular-eslint/prefer-inject`.
- Correccion de templates con regla `no-negated-async`.

Evidencia:
- `npm --prefix frontend run lint` -> `0 errors` (`1 warning` residual).
- `npm --prefix frontend run build` -> `OK` (warnings no bloqueantes).

## FE-BE-APT-01
Estado: `done`

Cambios:
- `frontend/src/app/store/appointments/appointments.effects.ts`: adaptacion de listado a formato paginado backend (`items`).
- `frontend/src/app/store/appointments/appointments.effects.ts`: cancelacion/completado por `PUT /appointments/{id}` con `status`.

Evidencia:
- `npm --prefix frontend run lint` -> `0 errors`.
- `npm --prefix frontend run build` -> `OK`.

## FE-BE-FILE-01
Estado: `done`

Cambios:
- `backend/app/resources/files.py`: `GET /api/files` con filtro opcional `patient_id`.
- `backend/app/resources/files.py`: upload acepta alias `category` y fallback por `patient_id` para resolver `medical_record_id`.
- `backend/tests/test_files.py`: pruebas nuevas para listado y compatibilidad de payload frontend.

Evidencia:
- `backend/.venv311/Scripts/python -m pytest backend/tests/test_files.py -q` -> `18 passed`.

## FE-BE-RPT-01
Estado: `done`

Cambios:
- `backend/app/resources/reports.py`: endpoints frontend-compatibles (`/medical`, `/financial`, `/quick/stats`, `/{report_type}/export`).
- `backend/app/resources/reports.py`: normalizacion de payload para `/api/reports/appointments`.
- `backend/tests/test_reports.py`: contratos frontend agregados y cobertura extendida.

Evidencia:
- `backend/.venv311/Scripts/python -m pytest backend/tests/test_reports.py -q` -> `31 passed`.

## FE-BE-PAT-01
Estado: `done`

Cambios:
- `backend/app/resources/patients.py`: soporte de busqueda `q`/`search`, serializer frontend-compatible y update robusto de `date_of_birth`/`is_active`.
- `frontend/src/app/store/patients/patients.effects.ts`: normalizacion de payload (array/paginado), defaults para UI y manejo de errores `msg/message`.
- `backend/tests/test_patients.py`: casos nuevos para defaults de payload y validaciones de update.

Evidencia:
- `backend/.venv311/Scripts/python -m pytest backend/tests/test_patients.py -q` -> `23 passed`.

## FE-BE-PRO-01
Estado: `done`

Cambios:
- `backend/app/resources/professionals.py`: serializer con alias `office_address`, soporte `office_address` en create/update, validacion `license_number` unico e `is_active`.
- `frontend/src/app/store/professionals/professionals.effects.ts`: normalizacion de payload (array/paginado), alias `address/office_address`, manejo de errores `msg/message`.
- `frontend/src/app/features/professionals/professional-form/professional-form.page.ts`: password obligatorio en alta, licencia obligatoria y compatibilidad de edicion.
- `backend/tests/test_professionals.py`: casos nuevos para alias frontend y update de estado.

Evidencia:
- `backend/.venv311/Scripts/python -m pytest backend/tests/test_professionals.py -q` -> `19 passed`.
- `npm --prefix frontend run lint` -> `0 errors` (`1 warning` residual).
- `npm --prefix frontend run build` -> `OK`.

## FE-BE-BUDPAY-01
Estado: `done`

Cambios:
- `frontend/src/app/store/budgets/budgets.effects.ts`: normalizacion de payload (`array` o `items`) y defaults para `total_paid/payments_count`.
- `frontend/src/app/store/payments/payments.effects.ts`: normalizacion de payload (`array` o `items`) y alias `transaction_reference`.
- `frontend/src/app/features/payments/payment-form/payment-form.page.ts`: fallback de `transaction_reference` desde `transaction_id`.
- `backend/app/resources/budgets.py`: soporte en update para `patient_id`, `currency`, `valid_until`, `status` y validacion de fecha.
- `backend/app/resources/payments.py`: soporte para `payment_date`, alias `transaction_reference` y validacion de datetime ISO.
- `backend/tests/test_budgets.py` y `backend/tests/test_payments.py`: cobertura nueva para aliases frontend y validaciones negativas de fecha/datetime.

Evidencia:
- `npm --prefix frontend run lint` -> `0 errors` (`1 warning` residual).
- `npm --prefix frontend run build` -> `OK`.
- `backend/.venv311/Scripts/python -m pytest backend/tests/test_budgets.py backend/tests/test_payments.py -q` -> `47 passed`.

## FE-BE-MR-01
Estado: `done`

Cambios:
- `backend/app/schemas/medical_record_schema.py`: incluye `patient` y `professional` anidados para compatibilidad frontend en list/detail.
- `frontend/src/app/store/medical-records/medical-records.effects.ts`: normalizacion de payload (`array` o `items`), defaults de `record_date/files` y manejo de errores `msg/message`.
- `frontend/src/app/features/medical-records/medical-record-form/medical-record-form.page.ts`: carga de pacientes compatible con respuesta `array` o paginada.
- `backend/tests/test_medical_records.py`: cobertura nueva para payload anidado `patient/professional`.

Evidencia:
- `backend/.venv311/Scripts/python -m pytest backend/tests/test_medical_records.py -q` -> `24 passed`.
- `npm --prefix frontend run lint` -> `0 errors` (`1 warning` residual).
- `npm --prefix frontend run build` -> `OK`.

## FE-MOCK-CLEAN-01
Estado: `done`

Cambios:
- `frontend/src/app/features/patients/patient-detail/patient-detail.page.ts`: eliminacion de hardcode `professional_id: 1` en creacion de odontograma.
- `frontend/src/app/features/patients/patient-detail/patient-detail.page.ts`: resolucion de `professional_id` desde usuario autenticado o contexto de citas del paciente.

Evidencia:
- `npm --prefix frontend run lint` -> sin errores.
- `npm --prefix frontend run build` -> `OK`.

## FE-MODEL-MAP-01
Estado: `done`

Cambios:
- `frontend/src/app/store/auth/auth.effects.ts`: reemplazo de `user as any` por validacion tipada `User` al cargar auth desde storage.
- `frontend/src/app/features/patients/patient-detail/patient-detail.page.ts`: normalizacion tipada de payload de citas (`AppointmentSummary`) para evitar mapeos ambiguos.

Evidencia:
- `npm --prefix frontend run build` -> `OK` tras correcciones de tipado.

## FE-PWA-AUDIT-01
Estado: `done`

Cambios:
- `docs/roadmap/frontend/FRONTEND_PWA_AUDIT_2026-02-15.md`: auditoria de estado real de `frontend-pwa`.

Evidencia:
- Documento publicado con hallazgos de estructura/rutas/servicios y brecha con README interno.

## FE-PWA-SCOPE-01
Estado: `done`

Cambios:
- `docs/roadmap/frontend/FRONTEND_PWA_SCOPE_MINIMO_RELEASE.md`: alcance minimo PWA no bloqueante para release actual.

Evidencia:
- Documento publicado con criterios de exito y fuera de alcance.

## FE-CORE-01-SPEC
Estado: `done`

Cambios:
- `docs/roadmap/frontend/FE-CORE-01_CIERRE_FRONTEND_PRINCIPAL.md`: ticket de cierre del frontend principal con criterios y evidencia aplicada.

Evidencia:
- Ticket publicado y enlazado a cambios FE de limpieza de mocks/mapeo de modelos.

## DEPLOY-AUDIT-01
Estado: `done`

Cambios:
- `docs/deployment/COMPOSE_AUDIT.md`: auditoria de compose y checklist minimo.
- `.env.compose.example`: variables requeridas para compose root.

Evidencia:
- `docker compose -f docker-compose.yml config` -> `OK`
- `docker compose -f docker-compose.db.yml config` -> `OK`
- `docker compose -f docker-compose.prod.yml config` -> `OK` (con warnings por variables no definidas)

## DEPLOY-02-SPEC-01
Estado: `done`

Cambios:
- `docs/roadmap/deploy/DEPLOY-02_HARDENING_NGINX.md`: ticket de hardening Nginx con alcance, criterios de aceptacion, dependencias, riesgos y plan por etapas.

Evidencia:
- Ticket publicado en `docs/roadmap/deploy/DEPLOY-02_HARDENING_NGINX.md`.

## DEPLOY-03-SPEC-01
Estado: `done`

Cambios:
- `docs/roadmap/deploy/DEPLOY-03_MONITOREO_ALERTAS.md`: ticket de monitoreo/alertas con catalogo de senales, severidades y criterios de validacion.

Evidencia:
- Ticket publicado en `docs/roadmap/deploy/DEPLOY-03_MONITOREO_ALERTAS.md`.

## DEPLOY-04-SPEC-01
Estado: `done`

Cambios:
- `docs/roadmap/deploy/DEPLOY-04_RELEASE_CANDIDATE.md`: ticket de release candidate con gates de infraestructura, aplicacion, QA y documentacion.

Evidencia:
- Ticket publicado en `docs/roadmap/deploy/DEPLOY-04_RELEASE_CANDIDATE.md`.

## DOC-PHASE1-01
Estado: `done`

Cambios:
- `docs/roadmap/release/FASE1_CIERRE_EVIDENCIA.md`: cierre de fase 1 con evidencia de pruebas, QA diario, snapshot y artefactos clave.

Evidencia:
- Documento publicado con comandos y resultados verificables al 2026-02-15.

## DOC-PHASE2-01
Estado: `done`

Cambios:
- `docs/roadmap/release/FASE2_ARRANQUE_TICKETS_PRIORIZADOS.md`: plan de arranque de fase 2 con tickets y criterios de exito.

Evidencia:
- Documento publicado con priorizacion `T033-T040`.

## DOC-REF-CLEAN-01
Estado: `done`

Cambios:
- `docs/roadmap/release/REFERENCIAS_OBSOLETAS_ELIMINADAS.md`: registro de limpieza de referencias obsoletas.
- `docs/roadmap/PLAN_AUTONOMO_SKILLS.md`: remocion de conteos estaticos de avance.
- `docs/README.md`: indice actualizado con carpeta `roadmap/release/`.

Evidencia:
- Referencias de indice y plan alineadas con tablero activo.

## DOC-EXEC-SUMMARY-01
Estado: `done`

Cambios:
- `docs/roadmap/release/RESUMEN_EJECUTIVO_RELEASE.md`: consolidacion ejecutiva de release con riesgos y criterio GO/NO-GO.

Evidencia:
- Documento ejecutivo publicado para decision operativa.

## DOC-HANDOVER-01
Estado: `done`

Cambios:
- `docs/roadmap/release/HANDOVER_TECNICO_OPERATIVO_FINAL.md`: handover tecnico-operativo con comandos, referencias y reglas de cierre.

Evidencia:
- Documento de handover publicado para continuidad operacional.

## SEC-SYNC-JWT-01
Estado: `done`

Validacion:
- Endpoints sync verificados con `@jwt_required()`:
  - `/api/sync/push`
  - `/api/sync/pull`
  - `/api/sync/status`
  - `/api/sync/logs`

Evidencia:
- `rg \"@jwt_required|@blueprint.route\" backend/app/resources/sync.py -n`

## SEC-SYNC-INPUT-01
Estado: `done`

Cambios:
- `backend/app/resources/sync.py`: validacion de body JSON/objeto en `POST /api/sync/push`.
- `backend/app/resources/sync.py`: limite de lote `changes` (`MAX_SYNC_CHANGES=500`) y validacion por item (`entity_type`, `operation`, `data`).
- `backend/app/resources/sync.py`: validacion estricta de `limit` en `GET /api/sync/logs` (`1..500`, tipo entero).
- `backend/tests/test_sync_endpoints.py`: pruebas negativas para payloads invalidos, batch sobredimensionado y `limit` invalido.

Evidencia:
- `backend/.venv311/Scripts/python -m pytest backend/tests/test_sync_endpoints.py -q` -> `16 passed`.

## SEC-SYNC-ERR-01
Estado: `done`

Cambios:
- `backend/app/resources/sync.py`: respuestas de errores internos en `push` sanitizadas para cliente (`Internal sync processing error`), manteniendo detalle tecnico en `sync_logs.error_message`.
- `backend/tests/test_sync_endpoints.py`: prueba negativa para confirmar sanitizacion ante errores internos de persistencia.

Evidencia:
- `backend/.venv311/Scripts/python -m pytest backend/tests/test_sync_endpoints.py -q` -> `17 passed`.

## DOC-ARCH-01
Estado: `done`

Cambios:
- `docs/architecture/architecture.md`: estado de sync actualizado (handlers, idempotencia, conflictos, hardening de validaciones y pendiente `SYNC-03`).
- `docs/architecture/sync-strategy.md`: contrato operativo actualizado con limites/validaciones de entrada.

Evidencia:
- Documentacion alineada con estado implementado en `backend/app/resources/sync.py`.

## AUTONOMY-OPS-01
Estado: `done`

Cambios:
- `tools/autonomy/board.py`: parser/actualizador de tableros 100/1000 con cierre por macro y recalculo de agregados.
- `tools/autonomy/planner.py`: cadencia diaria por carril, priorizacion por impacto/dependencias y KPI semanales.
- `tools/autonomy/qa_report.py`: ejecucion automatizada de suites QA core y generacion de reporte markdown.
- `tools/autonomy/cli.py`: comandos `snapshot`, `qa-report` y `close-macros` para operacion autonoma token-eficiente.
- `docs/roadmap/OPERACION_AUTONOMA_DIARIA.md`: definicion formal de cadencia, priorizacion, bloqueos y KPI.

Evidencia:
- `backend/.venv311/Scripts/python -m pytest tools/autonomy/tests -q` -> pruebas unitarias del modulo de autonomia.
- `backend/.venv311/Scripts/python -m tools.autonomy.cli snapshot` -> snapshot operativo y contexto compacto.
- `backend/.venv311/Scripts/python -m tools.autonomy.cli qa-report --run-tests` -> reporte QA diario con estado de suites.

## AUTONOMY-NEXT-WAVE-01
Estado: `done`

Cambios:
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md`: nuevo tablero de continuidad (`T101-T200`).
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md`: expansion a 1000 microtareas (`P1001-P2000`).
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json`: snapshot inicial y actualizado del nuevo tablero.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`: cadencia y prioridades para la siguiente ola.

Evidencia:
- `backend/.venv311/Scripts/python -m tools.autonomy.cli snapshot --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --output-json docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json --output-md docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`
- `backend/.venv311/Scripts/python -m tools.autonomy.cli close-macros --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --macros T102` -> `1 macro` y `10 micro` cerradas.

## SEC-GOV-01
Estado: `done`

Cambios:
- `backend/app/resources/users.py`: RBAC endurecido (`admin` en list/create/delete; self/admin en get/update).
- `backend/app/resources/sync.py`: `/api/sync/logs` restringido a `admin`.
- `backend/app/config.py` y `backend/app/__init__.py`: hardening CORS por entorno y validaciones.
- `backend/app/tasks/sync_tasks.py`: retencion real de `sync_logs` terminales.
- `docker-compose.db.yml` y `.env.compose.example`: remocion de secretos hardcodeados y paso a variables.
- `docs/security/*` y `docs/roadmap/security/*`: auditoria y tickets SEC-01..SEC-06.

Evidencia:
- `backend/.venv311/Scripts/python -m pytest backend/tests/test_users.py backend/tests/test_sync_endpoints.py backend/tests/test_sync_tasks.py -q` -> `44 passed`.
- `docker compose -f docker-compose.db.yml config` -> `OK`.

## AUTONOMY-NEXT-WAVE-02
Estado: `done`

Cambios:
- `frontend/src/app/features/odontology/components/tooth-action-modal/tooth-action-modal.component.ts`: implementacion de `OnInit` en clase standalone para eliminar warning de lint por ciclo de vida.
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md`: cierre de `T101`.
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md`: cierre de 10 microtareas asociadas a `T101`.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json`: snapshot actualizado con `2/100` macros y `20/1000` micros cerradas.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`: reporte operativo regenerado.

Evidencia:
- `npm --prefix frontend run lint` -> `All files pass linting`.
- `npm --prefix frontend run build` -> build `OK` (con warnings NG8113 existentes fuera de este ticket).
- `backend/.venv311/Scripts/python -m tools.autonomy.cli close-macros --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --macros T101` -> `1 macro` y `10 micro` cerradas.
- `backend/.venv311/Scripts/python -m tools.autonomy.cli snapshot --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --output-json docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json --output-md docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`.
- `backend/.venv311/Scripts/python -m pytest tools/autonomy/tests -q` -> `8 passed`.

## AUTONOMY-NEXT-WAVE-03
Estado: `done`

Cambios:
- `frontend/src/app/features/patients/patient-form/patient-form.page.ts`: eliminacion de `any` en serializacion de form con payload tipado (`PatientFormPayload`) y helper `compactPayload`.
- `frontend/src/app/features/professionals/professional-form/professional-form.page.ts`: eliminacion de `any` en serializacion de form y fallback legacy `address` con tipo explicito (`ProfessionalWithLegacyAddress`).
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md`: cierre de `T103`.
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md`: cierre de 10 microtareas asociadas a `T103`.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json`: snapshot actualizado con `3/100` macros y `30/1000` micros cerradas.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`: reporte operativo regenerado.

Evidencia:
- `rg --line-number "\\bany\\b" frontend/src/app/features/patients/patient-form/patient-form.page.ts frontend/src/app/features/professionals/professional-form/professional-form.page.ts` -> sin coincidencias.
- `npm --prefix frontend run lint` -> `All files pass linting`.
- `npm --prefix frontend run build` -> build `OK` (con warnings NG8113 existentes fuera de este ticket).
- `backend/.venv311/Scripts/python -m tools.autonomy.cli close-macros --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --macros T103` -> `1 macro` y `10 micro` cerradas.
- `backend/.venv311/Scripts/python -m tools.autonomy.cli snapshot --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --output-json docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json --output-md docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`.

## AUTONOMY-NEXT-WAVE-04
Estado: `done`

Cambios:
- `frontend/src/app/store/pagination.adapter.ts`: nuevo adaptador compartido `toItemsArray` para respuestas array/paginadas.
- `frontend/src/app/store/appointments/appointments.effects.ts`: migracion a `CollectionResponse` + `toItemsArray`.
- `frontend/src/app/store/patients/patients.effects.ts`: migracion a `CollectionResponse` + `toItemsArray`.
- `frontend/src/app/store/professionals/professionals.effects.ts`: migracion a `CollectionResponse` + `toItemsArray`.
- `frontend/src/app/store/budgets/budgets.effects.ts`: migracion a `CollectionResponse` + `toItemsArray`.
- `frontend/src/app/store/payments/payments.effects.ts`: migracion a `CollectionResponse` + `toItemsArray`.
- `frontend/src/app/store/medical-records/medical-records.effects.ts`: migracion a `CollectionResponse` + `toItemsArray`.
- `frontend/src/app/store/odontology/odontology.effects.ts`: carga de tratamientos dentales alineada al adaptador compartido.
- `frontend/src/app/store/audit/audit.effects.ts`: extraccion de `items` consolidada con `toItemsArray`.
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md`: cierre de `T104`.
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md`: cierre de 10 microtareas asociadas a `T104`.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json`: snapshot actualizado con `4/100` macros y `40/1000` micros cerradas.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`: reporte operativo regenerado.

Evidencia:
- `rg --line-number "Array\\.isArray\\(response\\) \\? response : \\(response\\.items \\|\\| \\[\\]\\)|response\\?\\.items \\|\\| \\[\\]" frontend/src/app/store -g "*.effects.ts"` -> sin coincidencias.
- `npm --prefix frontend run lint` -> `All files pass linting`.
- `npm --prefix frontend run build` -> build `OK` (con warnings NG8113 existentes fuera de este ticket).
- `backend/.venv311/Scripts/python -m tools.autonomy.cli close-macros --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --macros T104` -> `1 macro` y `10 micro` cerradas.
- `backend/.venv311/Scripts/python -m tools.autonomy.cli snapshot --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --output-json docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json --output-md docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`.
- `backend/.venv311/Scripts/python -m pytest tools/autonomy/tests -q` -> `8 passed`.

## AUTONOMY-NEXT-WAVE-05
Estado: `done`

Cambios:
- `frontend/src/app/store/error.adapter.ts`: helper comun `getApiErrorMessage` para normalizar extraccion de mensajes (`msg`, `message`, string plano y fallback).
- `frontend/src/app/store/appointments/appointments.effects.ts`: unificacion de catchError a `getApiErrorMessage`.
- `frontend/src/app/store/patients/patients.effects.ts`: unificacion de catchError a `getApiErrorMessage`.
- `frontend/src/app/store/professionals/professionals.effects.ts`: unificacion de catchError a `getApiErrorMessage`.
- `frontend/src/app/store/budgets/budgets.effects.ts`: unificacion de catchError a `getApiErrorMessage`.
- `frontend/src/app/store/payments/payments.effects.ts`: unificacion de catchError a `getApiErrorMessage`.
- `frontend/src/app/store/medical-records/medical-records.effects.ts`: unificacion de catchError a `getApiErrorMessage`.
- `frontend/src/app/store/files/files.effects.ts`: unificacion de catchError a `getApiErrorMessage`.
- `frontend/src/app/store/odontology/odontology.effects.ts`: unificacion de catchError a `getApiErrorMessage`.
- `frontend/src/app/store/audit/audit.effects.ts`: unificacion de catchError a `getApiErrorMessage`.
- `frontend/src/app/store/psychology/psychology.effects.ts`: unificacion de catchError a `getApiErrorMessage`.
- `frontend/src/app/store/psychopedagogy/psychopedagogy.effects.ts`: unificacion de catchError a `getApiErrorMessage`.
- `frontend/src/app/store/reports/reports.effects.ts`: unificacion de catchError a `getApiErrorMessage`.
- `frontend/src/app/store/auth/auth.effects.ts`: log y acciones de fallo de login/register alineadas al helper comun.
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md`: cierre de `T105`.
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md`: cierre de 10 microtareas asociadas a `T105`.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json`: snapshot actualizado con `5/100` macros y `50/1000` micros cerradas.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`: reporte operativo regenerado.

Evidencia:
- `rg --line-number "error\\.error\\?\\.(msg|message)" frontend/src/app/store -g "*.effects.ts"` -> sin coincidencias.
- `npm --prefix frontend run lint` -> `All files pass linting`.
- `npm --prefix frontend run build` -> build `OK` (con warnings NG8113 existentes fuera de este ticket).
- `backend/.venv311/Scripts/python -m tools.autonomy.cli close-macros --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --macros T105` -> `1 macro` y `10 micro` cerradas.
- `backend/.venv311/Scripts/python -m tools.autonomy.cli snapshot --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --output-json docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json --output-md docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`.
- `backend/.venv311/Scripts/python -m pytest tools/autonomy/tests -q` -> `8 passed`.

## AUTONOMY-NEXT-WAVE-06
Estado: `done`

Cambios:
- `backend/tests/test_patients.py`: nuevo caso `test_patient_crud_end_to_end` para validar flujo encadenado create -> get/list -> update -> delete -> not found sobre `/api/patients`.
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md`: cierre de `T106`.
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md`: cierre de 10 microtareas asociadas a `T106`.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json`: snapshot actualizado con `6/100` macros y `60/1000` micros cerradas.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`: reporte operativo regenerado.

Evidencia:
- `backend/.venv311/Scripts/python -m pytest backend/tests/test_patients.py -q` -> `24 passed`.
- `backend/.venv311/Scripts/python -m tools.autonomy.cli close-macros --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --macros T106` -> `1 macro` y `10 micro` cerradas.
- `backend/.venv311/Scripts/python -m tools.autonomy.cli snapshot --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --output-json docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json --output-md docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`.
- `backend/.venv311/Scripts/python -m pytest tools/autonomy/tests -q` -> `8 passed`.

## AUTONOMY-NEXT-WAVE-07
Estado: `done`

Cambios:
- `backend/tests/test_professionals.py`: nuevo caso `test_professional_crud_end_to_end` para validar flujo encadenado create -> get/list -> update -> delete -> not found sobre `/api/professionals`.
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md`: cierre de `T107`.
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md`: cierre de 10 microtareas asociadas a `T107`.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json`: snapshot actualizado con `7/100` macros y `70/1000` micros cerradas.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`: reporte operativo regenerado.

Evidencia:
- `backend/.venv311/Scripts/python -m pytest backend/tests/test_professionals.py -q` -> `20 passed`.
- `backend/.venv311/Scripts/python -m tools.autonomy.cli close-macros --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --macros T107` -> `1 macro` y `10 micro` cerradas.
- `backend/.venv311/Scripts/python -m tools.autonomy.cli snapshot --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --output-json docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json --output-md docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`.
- `backend/.venv311/Scripts/python -m pytest tools/autonomy/tests -q` -> `8 passed`.

## AUTONOMY-NEXT-WAVE-08
Estado: `done`

Cambios:
- `backend/tests/test_appointments.py`: nuevo caso `test_appointments_list_calendar_detail_flow` para validar flujo encadenado create -> list con rango de fechas (escenario calendario) -> detail -> update -> cancel sobre `/api/appointments`.
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md`: cierre de `T108`.
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md`: cierre de 10 microtareas asociadas a `T108`.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json`: snapshot actualizado con `8/100` macros y `80/1000` micros cerradas.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`: reporte operativo regenerado.

Evidencia:
- `backend/.venv311/Scripts/python -m pytest backend/tests/test_appointments.py -q` -> `18 passed`.
- `backend/.venv311/Scripts/python -m tools.autonomy.cli close-macros --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --macros T108` -> `1 macro` y `10 micro` cerradas.
- `backend/.venv311/Scripts/python -m tools.autonomy.cli snapshot --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --output-json docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json --output-md docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`.
- `backend/.venv311/Scripts/python -m pytest tools/autonomy/tests -q` -> `8 passed`.

## AUTONOMY-NEXT-WAVE-09
Estado: `done`

Cambios:
- `backend/tests/test_files.py`: nuevo caso `test_medical_record_and_file_workflow_end_to_end` para validar flujo encadenado medical-records + files (`create record -> detail -> upload -> list/get/download file -> delete file -> delete record`).
- `backend/app/resources/files.py`: normalizacion de ruta absoluta en upload para evitar inconsistencias de resolucion en `download`/`delete` cuando el archivo se guarda via endpoint.
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md`: cierre de `T109`.
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md`: cierre de 10 microtareas asociadas a `T109`.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json`: snapshot actualizado con `9/100` macros y `90/1000` micros cerradas.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`: reporte operativo regenerado.

Evidencia:
- `backend/.venv311/Scripts/python -m pytest backend/tests/test_files.py -q` -> `19 passed`.
- `backend/.venv311/Scripts/python -m pytest backend/tests/test_medical_records.py backend/tests/test_files.py -q` -> `43 passed`.
- `backend/.venv311/Scripts/python -m pytest tools/autonomy/tests -q` -> `8 passed`.
- `backend/.venv311/Scripts/python -m tools.autonomy.cli close-macros --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --macros T109` -> `1 macro` y `10 micro` cerradas.
- `backend/.venv311/Scripts/python -m tools.autonomy.cli snapshot --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --output-json docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json --output-md docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`.

## AUTONOMY-NEXT-WAVE-10
Estado: `done`

Cambios:
- `backend/tests/test_reports.py`: nuevo caso `test_budgets_payments_reports_end_to_end` para validar flujo encadenado budgets + payments + reports (`create/send/accept budget -> create/process payment -> validar reportes financieros`).
- `backend/app/services/report_service.py`: robustez en serializacion de `daily_revenue` para soportar filas con fecha `date/datetime` o `str` (evita `500` en `/api/reports/financial/revenue` cuando hay pagos reales).
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md`: cierre de `T110`.
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md`: cierre de 10 microtareas asociadas a `T110`.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json`: snapshot actualizado con `10/100` macros y `100/1000` micros cerradas.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`: reporte operativo regenerado.

Evidencia:
- `backend/.venv311/Scripts/python -m pytest backend/tests/test_budgets.py backend/tests/test_payments.py backend/tests/test_reports.py -q` -> `79 passed`.
- `backend/.venv311/Scripts/python -m pytest tools/autonomy/tests -q` -> `8 passed`.
- `backend/.venv311/Scripts/python -m tools.autonomy.cli close-macros --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --macros T110` -> `1 macro` y `10 micro` cerradas.
- `backend/.venv311/Scripts/python -m tools.autonomy.cli snapshot --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --output-json docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json --output-md docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`.

## AUTONOMY-NEXT-WAVE-11
Estado: `done`

Cambios:
- `docs/roadmap/reports/NG8113_AUDIT_PLAN.md`: auditoria consolidada de warnings `NG8113` y plan de limpieza por lotes para `T112`, `T113`, `T114` con distribucion exacta de archivos y volumen por lote.
- `docs/roadmap/reports/ng8113-audit-build.log`: salida completa de build usada como evidencia primaria de warnings.
- `docs/roadmap/reports/ng8113-audit.json`: inventario estructurado (`component`, `symbol`, `file`, `line`) de warnings `NG8113`.
- `docs/roadmap/reports/ng8113-audit.csv`: export tabular del inventario para seguimiento operativo.
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md`: cierre de `T111`.
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md`: cierre de 10 microtareas asociadas a `T111`.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json`: snapshot actualizado con `11/100` macros y `110/1000` micros cerradas.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`: reporte operativo regenerado.

Evidencia:
- `npm --prefix frontend run build *> frontend/ng8113-audit.log` -> build `OK` con `57` warnings `NG8113` detectados.
- Parseo de log a artefactos (`json`/`csv`) con consolidado: `57 warnings`, `21 archivos`, top import no usado `IonList (12)`.
- `node -v` -> `v25.2.1` (non-LTS, riesgo documentado en plan).
- `backend/.venv311/Scripts/python -m tools.autonomy.cli close-macros --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --macros T111` -> `1 macro` y `10 micro` cerradas.
- `backend/.venv311/Scripts/python -m tools.autonomy.cli snapshot --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --output-json docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json --output-md docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`.
- `backend/.venv311/Scripts/python -m pytest tools/autonomy/tests -q` -> `8 passed`.

## AUTONOMY-NEXT-WAVE-12
Estado: `done`

Cambios:
- `frontend/src/app/features/patients/patients-list/patients-list.page.ts`: remocion de imports Ionic no usados del lote 1 (`IonList`, `IonItem`, `IonLabel`, `IonAvatar`, `IonItemSliding`, `IonItemOptions`, `IonItemOption`, `IonBadge`, `IonChip`, `IonText`).
- `frontend/src/app/features/patients/patient-form/patient-form.page.ts`: remocion de `IonList` no usado.
- `frontend/src/app/features/auth/login/login.page.ts`: remocion de `IonItem` e `IonText` no usados.
- `frontend/src/app/features/appointments/appointment-detail/appointment-detail.page.ts`: remocion de `IonList` no usado.
- `frontend/src/app/features/audit/audit-logs/audit-logs.page.ts`: remocion de `IonNote` no usado.
- `frontend/src/app/features/professionals/professional-form/professional-form.page.ts`: remocion de `IonList` no usado.
- `docs/roadmap/reports/ng8113-lote1-build.log`: build post-limpieza lote 1.
- `docs/roadmap/reports/ng8113-post-t112.json`: inventario post-lote 1.
- `docs/roadmap/reports/ng8113-post-t112.csv`: export tabular post-lote 1.
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md`: cierre de `T112`.
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md`: cierre de 10 microtareas asociadas a `T112`.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json`: snapshot actualizado con `12/100` macros y `120/1000` micros cerradas.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`: reporte operativo regenerado.

Evidencia:
- `npm --prefix frontend run build *> docs/roadmap/reports/ng8113-lote1-build.log` -> build `OK`.
- Consolidado post-lote 1: `TOTAL_WARNINGS=41` y `LOT1_REMAINING=0` (reduccion neta de `16` warnings vs baseline `57`).
- `backend/.venv311/Scripts/python -m tools.autonomy.cli close-macros --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --macros T112` -> `1 macro` y `10 micro` cerradas.
- `backend/.venv311/Scripts/python -m tools.autonomy.cli snapshot --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --output-json docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json --output-md docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`.
- `backend/.venv311/Scripts/python -m pytest tools/autonomy/tests -q` -> `8 passed`.

## AUTONOMY-NEXT-WAVE-13
Estado: `done`

Cambios:
- `frontend/src/app/features/budgets/budgets-list/budgets-list.page.ts`: remocion de imports Ionic no usados del lote 2 (`IonList`, `IonItem`, `IonSpinner`, `IonText`, `IonSearchbar`, `IonChip`, `IonBadge`).
- `frontend/src/app/features/budgets/budget-form/budget-form.page.ts`: remocion de imports no usados (`IonLabel`, `IonList`, `IonCardHeader`, `IonCardTitle`).
- `frontend/src/app/features/budgets/budget-detail/budget-detail.page.ts`: remocion de imports no usados (`IonNote`, `IonProgressBar`).
- `frontend/src/app/features/payments/payment-detail/payment-detail.page.ts`: remocion de imports no usados (`IonList`, `IonItem`, `IonLabel`).
- `frontend/src/app/features/payments/payment-form/payment-form.page.ts`: remocion de imports no usados (`IonLabel`, `IonList`).
- `frontend/src/app/features/medical-records/medical-record-form/medical-record-form.page.ts`: remocion de imports no usados (`IonList`, `IonItemDivider`, `IonLabel`).
- `docs/roadmap/reports/ng8113-lote2-build.log`: build post-limpieza lote 2.
- `docs/roadmap/reports/ng8113-post-t113.json`: inventario post-lote 2.
- `docs/roadmap/reports/ng8113-post-t113.csv`: export tabular post-lote 2.
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md`: cierre de `T113`.
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md`: cierre de 10 microtareas asociadas a `T113`.

Evidencia:
- `npm --prefix frontend run build *> docs/roadmap/reports/ng8113-lote2-build.log` -> build `OK`.
- Consolidado post-lote 2: `TOTAL_WARNINGS=20` y `LOT2_REMAINING=0`.
- `docs/roadmap/reports/ng8113-post-t113.json` y `docs/roadmap/reports/ng8113-post-t113.csv` actualizados.

## AUTONOMY-NEXT-WAVE-14
Estado: `done`

Cambios:
- `frontend/src/app/features/odontology/clinical-history/clinical-history.page.ts`: remocion de `IonSpinner` no usado.
- `frontend/src/app/features/odontology/clinical-history/tabs/clinical-docs-tab/clinical-docs-tab.component.ts`: remocion de `IonList` no usado.
- `frontend/src/app/features/odontology/clinical-history/tabs/documents-tab/documents-tab.component.ts`: remocion de imports no usados (`IonCardHeader`, `IonCardTitle`).
- `frontend/src/app/features/odontology/clinical-history/tabs/evolutions-tab/evolutions-tab.component.ts`: remocion de imports no usados (`IonBadge`, `IonCardTitle`).
- `frontend/src/app/features/odontology/clinical-history/tabs/history-tab/history-tab.component.ts`: remocion de imports no usados (`IonCardTitle`, `IonText`).
- `frontend/src/app/features/odontology/clinical-history/tabs/odontogram-tab/odontogram-tab.component.ts`: remocion de imports no usados (`IonCardHeader`, `IonCardTitle`).
- `frontend/src/app/features/odontology/clinical-history/tabs/periodontogram-tab/periodontogram-tab.component.ts`: remocion de imports no usados (`IonInput`, `IonItem`, `IonLabel`, `IonSelect`, `IonSelectOption`).
- `frontend/src/app/features/odontology/clinical-history/tabs/prescriptions-tab/prescriptions-tab.component.ts`: remocion de imports no usados (`IonCardTitle`, `IonList`).
- `frontend/src/app/features/odontology/treatment-detail/treatment-detail.page.ts`: remocion de imports no usados (`IonList`, `IonItem`, `IonLabel`).
- `docs/roadmap/reports/ng8113-lote3-build.log`: build post-limpieza lote 3.
- `docs/roadmap/reports/ng8113-post-t114.json`: inventario final sin warnings NG8113.
- `docs/roadmap/reports/ng8113-post-t114.csv`: export tabular final.
- `docs/roadmap/reports/NG8113_AUDIT_PLAN.md`: estado de ejecucion actualizado (`57 -> 41 -> 20 -> 0`).
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md`: cierre de `T114`.
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md`: cierre de 10 microtareas asociadas a `T114`.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json`: snapshot actualizado con `14/100` macros y `140/1000` micros cerradas.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`: reporte operativo regenerado.

Evidencia:
- `npm --prefix frontend run build *> docs/roadmap/reports/ng8113-lote3-build.log` -> build `OK`.
- Consolidado final: `TOTAL_WARNINGS=0` y `LOT3_REMAINING=0`.
- `npm --prefix frontend run lint` -> `All files pass linting`.
- `backend/.venv311/Scripts/python -m tools.autonomy.cli close-macros --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --macros T113 T114` -> `2 macros` y `20 micro` cerradas.
- `backend/.venv311/Scripts/python -m tools.autonomy.cli snapshot --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --output-json docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json --output-md docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`.
- `backend/.venv311/Scripts/python -m pytest tools/autonomy/tests -q` -> `8 passed`.

## AUTONOMY-NEXT-WAVE-15
Estado: `done`

Cambios:
- `frontend/src/main.ts`: reduccion de carga inicial eliminando `provideStoreDevtools` del arranque y limitando efectos globales a `AuthEffects` y `FilesEffects`.
- `frontend/src/app/layouts/main-layout/main-layout.component.ts`: inicializacion de servicios de shell (PWA/connectivity/push) en layout lazy.
- `frontend/src/app/features/patients/patients.routes.ts`: `provideEffects(PatientsEffects)` en ruta lazy.
- `frontend/src/app/features/professionals/professionals.routes.ts`: `provideEffects(ProfessionalsEffects)` en ruta lazy.
- `frontend/src/app/features/appointments/appointments.routes.ts`: `provideEffects(AppointmentsEffects)` en ruta lazy.
- `frontend/src/app/features/medical-records/medical-records.routes.ts`: `provideEffects(MedicalRecordsEffects)` en ruta lazy.
- `frontend/src/app/features/budgets/budgets.routes.ts`: `provideEffects(BudgetsEffects)` en ruta lazy.
- `frontend/src/app/features/payments/payments.routes.ts`: `provideEffects(PaymentsEffects)` en ruta lazy.
- `frontend/src/app/features/odontology/odontology.routes.ts`: `provideEffects(OdontologyEffects)` en ruta lazy.
- `frontend/src/app/features/psychology/psychology.routes.ts`: `provideEffects(PsychologyEffects)` en ruta lazy.
- `frontend/src/app/features/psychopedagogy/psychopedagogy.routes.ts`: `provideEffects(PsychopedagogyEffects)` en ruta lazy.
- `frontend/src/app/features/reports/reports.routes.ts`: `provideEffects(ReportsEffects)` en ruta lazy.
- `frontend/src/app/features/audit/audit.routes.ts`: `provideEffects(AuditEffects)` en ruta lazy.
- `docs/roadmap/reports/T115_BUNDLE_OPTIMIZATION.md`: reporte de baseline vs post-optimización.
- `docs/roadmap/reports/ng8113-post-t114.json`: artefacto de cierre generado para mantener evidencia consistente.
- `docs/roadmap/reports/ng8113-post-t114.csv`: cabecera consolidada de artefacto final.
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md`: cierre de `T115`.
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md`: cierre de 10 microtareas asociadas a `T115`.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json`: snapshot actualizado con `15/100` macros y `150/1000` micros cerradas.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`: reporte operativo regenerado.

Evidencia:
- `npm --prefix frontend run lint` -> `All files pass linting`.
- `npm --prefix frontend run build *> docs/roadmap/reports/t115-baseline-build.log` -> baseline (`main 97.88 kB`, `Initial total 1.50 MB`).
- `npm --prefix frontend run build *> docs/roadmap/reports/t115-post3-build.log` -> post (`main 36.05 kB`, `Initial total 1.48 MB`).
- `backend/.venv311/Scripts/python -m tools.autonomy.cli close-macros --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --macros T115` -> `1 macro` y `10 micro` cerradas.
- `backend/.venv311/Scripts/python -m tools.autonomy.cli snapshot --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --output-json docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json --output-md docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`.
- `backend/.venv311/Scripts/python -m pytest tools/autonomy/tests -q` -> `8 passed`.

## AUTONOMY-NEXT-WAVE-16
Estado: `done`

Cambios:
- `frontend/src/app/features/patients/patients-list/patients-list.page.ts`: optimizacion de render y filtro (`OnPush`, precomputo de `initials/searchIndex`, contadores cacheados `activeCount/inactiveCount`, `skeletonCards` estable y `ionRefresh` sincronizado con fin real de carga).
- `docs/roadmap/reports/T116_PATIENTS_LIST_PERFORMANCE.md`: reporte tecnico de optimizacion de `T116`.
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md`: cierre de `T116`.
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md`: cierre de 10 microtareas asociadas a `T116`.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json`: snapshot actualizado con `16/100` macros y `160/1000` micros cerradas.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`: reporte operativo regenerado.

Evidencia:
- `npm --prefix frontend run lint` -> `All files pass linting`.
- `npm --prefix frontend run build *> docs/roadmap/reports/t116-build.log` -> build `OK`.
- `backend/.venv311/Scripts/python -m tools.autonomy.cli close-macros --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --macros T116` -> `1 macro` y `10 micro` cerradas.
- `backend/.venv311/Scripts/python -m tools.autonomy.cli snapshot --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --output-json docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json --output-md docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`.
- `backend/.venv311/Scripts/python -m pytest tools/autonomy/tests -q` -> `8 passed`.

## AUTONOMY-NEXT-WAVE-17
Estado: `done`

Cambios:
- `frontend/src/app/features/appointments/appointments-calendar/appointments-calendar.page.ts`: optimizacion de performance del calendario (`OnPush`, index por fecha de citas, precomputo de indicadores por dia, suscripcion con `takeUntilDestroyed`, recalculo de periodo sin getter dinamico y navegacion local sin recargas redundantes).
- `docs/roadmap/reports/T117_APPOINTMENTS_CALENDAR_PERFORMANCE.md`: reporte tecnico de optimizacion de `T117`.
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md`: cierre de `T117`.
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md`: cierre de 10 microtareas asociadas a `T117`.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json`: snapshot actualizado con `17/100` macros y `170/1000` micros cerradas.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`: reporte operativo regenerado.

Evidencia:
- `npm --prefix frontend run lint` -> `All files pass linting`.
- `npm --prefix frontend run build *> docs/roadmap/reports/t117-build.log` -> build `OK`.
- `backend/.venv311/Scripts/python -m tools.autonomy.cli close-macros --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --macros T117` -> `1 macro` y `10 micro` cerradas.
- `backend/.venv311/Scripts/python -m tools.autonomy.cli snapshot --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --output-json docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json --output-md docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`.
- `backend/.venv311/Scripts/python -m pytest tools/autonomy/tests -q` -> `8 passed`.

## AUTONOMY-NEXT-WAVE-18
Estado: `done`

Cambios:
- `frontend/src/app/features/auth/login/login.page.ts`: accesibilidad de toggle de password (teclado + atributos ARIA).
- `frontend/src/app/features/patients/patients-list/patients-list.page.ts`: `aria-label` en menu/search/FAB y alerta accesible en estado de error.
- `frontend/src/app/features/appointments/appointments-list/appointments-list.page.ts`: `aria-label` en controles icon-only/FAB y alerta accesible en estado de error.
- `frontend/src/app/features/appointments/appointments-calendar/appointments-calendar.page.ts`: `aria-label` en navegacion de periodo/FAB y alerta accesible en estado de error.
- `docs/roadmap/reports/T118_ACCESSIBILITY_AA_CORE.md`: reporte de revision AA y acciones aplicadas.
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md`: cierre de `T118`.
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md`: cierre de 10 microtareas asociadas a `T118`.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json`: snapshot actualizado con `18/100` macros y `180/1000` micros cerradas.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`: reporte operativo regenerado.

Evidencia:
- `npm --prefix frontend run lint` -> `All files pass linting`.
- `npm --prefix frontend run build *> docs/roadmap/reports/t118-build.log` -> build `OK`.
- `backend/.venv311/Scripts/python -m tools.autonomy.cli close-macros --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --macros T118` -> `1 macro` y `10 micro` cerradas.
- `backend/.venv311/Scripts/python -m tools.autonomy.cli snapshot --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --output-json docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json --output-md docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`.
- `backend/.venv311/Scripts/python -m pytest tools/autonomy/tests -q` -> `8 passed`.

## AUTONOMY-NEXT-WAVE-19
Estado: `done`

Cambios:
- `frontend/src/app/store/auth/auth.effects.ts`: correccion de textos con encoding corrupto en comentario/mensaje de notificacion.
- `frontend/src/app/store/psychology/psychology.effects.ts`: normalizacion de mensajes de notificacion con mojibake.
- `frontend/src/app/store/psychopedagogy/psychopedagogy.effects.ts`: normalizacion de mensajes de notificacion con mojibake.
- `docs/roadmap/reports/T119_TEXT_ENCODING_CLEANUP.md`: reporte de correccion de encoding en UI.
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md`: cierre de `T119`.
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md`: cierre de 10 microtareas asociadas a `T119`.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json`: snapshot actualizado con `19/100` macros y `190/1000` micros cerradas.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`: reporte operativo regenerado.

Evidencia:
- `rg --line-number "Ã|Â|â€¢|â" frontend/src/app -g "*.ts"` -> sin coincidencias.
- `npm --prefix frontend run lint` -> `All files pass linting`.
- `npm --prefix frontend run build *> docs/roadmap/reports/t119-build.log` -> build `OK`.
- `backend/.venv311/Scripts/python -m tools.autonomy.cli close-macros --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --macros T119` -> `1 macro` y `10 micro` cerradas.
- `backend/.venv311/Scripts/python -m tools.autonomy.cli snapshot --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --output-json docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json --output-md docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`.
- `backend/.venv311/Scripts/python -m pytest tools/autonomy/tests -q` -> `8 passed`.

## AUTONOMY-NEXT-WAVE-20
Estado: `done`

Cambios:
- `docs/roadmap/frontend/T120_SMOKE_CHECKLIST_FRONTEND_PRINCIPAL.md`: checklist manual de smoke para frontend principal (precondiciones, flujos core admin/professional, criterios GO/NO-GO).
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md`: cierre de `T120`.
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md`: cierre de 10 microtareas asociadas a `T120`.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json`: snapshot actualizado con `20/100` macros y `200/1000` micros cerradas.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`: reporte operativo regenerado.

Evidencia:
- Documento checklist publicado en `docs/roadmap/frontend/T120_SMOKE_CHECKLIST_FRONTEND_PRINCIPAL.md`.
- `backend/.venv311/Scripts/python -m tools.autonomy.cli close-macros --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --macros T120` -> `1 macro` y `10 micro` cerradas.
- `backend/.venv311/Scripts/python -m tools.autonomy.cli snapshot --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --output-json docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json --output-md docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`.
- `backend/.venv311/Scripts/python -m pytest tools/autonomy/tests -q` -> `8 passed`.

## AUTONOMY-NEXT-WAVE-21
Estado: `done`

Cambios:
- `docs/roadmap/frontend/T121_AUDITORIA_PARIDAD_RUTAS_FRONTEND_WEB.md`: auditoria de paridad de rutas entre `frontend` y `frontend-web`, con matriz de cobertura y brechas para `T122-T130`.
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md`: cierre de `T121`.
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md`: cierre de 10 microtareas asociadas a `T121`.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json`: snapshot actualizado con `21/100` macros y `210/1000` micros cerradas.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`: reporte operativo regenerado.

Evidencia:
- Auditoria construida desde `frontend/src/app/app.routes.ts` y `frontend-web/src/app/app.routes.ts`.
- `backend/.venv311/Scripts/python -m tools.autonomy.cli close-macros --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --macros T121` -> `1 macro` y `10 micro` cerradas.
- `backend/.venv311/Scripts/python -m tools.autonomy.cli snapshot --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --output-json docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json --output-md docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`.
- `backend/.venv311/Scripts/python -m pytest tools/autonomy/tests -q` -> `8 passed`.

## AUTONOMY-NEXT-WAVE-22
Estado: `done`

Cambios:
- `frontend-web/src/app/pages/auth-login.page.ts`: reemplazo de placeholder por login real (`ReactiveForms`, submit a backend, validaciones, manejo de error y redirect por `returnUrl`).
- `frontend-web/src/app/app.routes.ts`: rutas privadas protegidas con `AuthGuard` (`dashboard`, `professionals`, `patients`, `appointments`, `medical-records`, `budgets`).
- `frontend-web/src/app/app.config.ts`: activacion de `tokenInterceptor` en `provideHttpClient`.
- `frontend-web/src/app/core/auth/token.interceptor.ts`: omision de header bearer en `auth/login` y `auth/refresh`.
- `frontend-web/src/app/app.component.ts`: estado auth reactivo y accion `logout`.
- `frontend-web/src/app/app.component.html`: topbar condicionada por sesion (login publico, nav privada, boton salir).
- `frontend-web/src/app/app.component.scss`: estilos de bloque de usuario autenticado.
- `docs/roadmap/reports/T122_FRONTEND_WEB_AUTH_REAL.md`: reporte tecnico de cierre `T122`.
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md`: cierre de `T122`.
- `docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md`: cierre de 10 microtareas asociadas a `T122`.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json`: snapshot actualizado con `22/100` macros y `220/1000` micros cerradas.
- `docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`: reporte operativo regenerado.

Evidencia:
- `npm --prefix frontend-web run lint` -> sin target `lint` configurado en este proyecto.
- `npm --prefix frontend-web run build *> docs/roadmap/reports/t122-build.log` -> build `OK`.
- `backend/.venv311/Scripts/python -m tools.autonomy.cli close-macros --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --macros T122` -> `1 macro` y `10 micro` cerradas.
- `backend/.venv311/Scripts/python -m tools.autonomy.cli snapshot --board100 docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md --board1000 docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md --output-json docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json --output-md docs/roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`.
- `backend/.venv311/Scripts/python -m pytest tools/autonomy/tests -q` -> `8 passed`.
