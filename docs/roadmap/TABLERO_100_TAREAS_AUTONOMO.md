# Tablero Autonomo - 100 Tareas

Actualizado: 2026-02-14

Formato de estado: `done`, `in_progress`, `pending`
Estado agregado actual: `100 done`, `0 in_progress`, `0 pending`

| ID | Carril | Tarea | Estado |
| --- | --- | --- | --- |
| T001 | backend-sync | Crear entorno backend Python 3.11 aislado (.venv311) | done |
| T002 | backend-sync | Instalar dependencias backend en entorno aislado | done |
| T003 | backend-sync | Implementar handlers reales en /api/sync/push | done |
| T004 | backend-sync | Extender /api/sync/pull a entidades soportadas | done |
| T005 | backend-sync | Agregar coercion robusta de tipos en sync | done |
| T006 | backend-sync | Agregar suite test_sync_endpoints | done |
| T007 | backend-sync | Ejecutar pruebas sync endpoints en verde | done |
| T008 | backend-sync | Agregar idempotencia por idempotency_key/fingerprint | done |
| T009 | backend-sync | Agregar deteccion de conflicto por updated_at (server_wins) | done |
| T010 | backend-sync | Persistir conflicto en sync_logs.conflict_payload | done |
| T011 | backend-sync | Persistir result_entity_id en sync_logs | done |
| T012 | backend-sync | Hacer delete idempotente en sync | done |
| T013 | backend-sync | Validar replay idempotente con pruebas | done |
| T014 | backend-sync | Validar conflictos con pruebas automatizadas | done |
| T015 | backend-sync | Actualizar docs de estrategia sync | done |
| T016 | backend-sync | Actualizar docs de esquema DB para sync_logs | done |
| T017 | backend-sync | Agregar respuesta de logs con campos de idempotencia | done |
| T018 | backend-sync | Normalizar parseo de fechas ISO/Z en sync | done |
| T019 | backend-sync | Validar serializacion Decimal/date/datetime | done |
| T020 | backend-sync | Preparar ticket SYNC-03 (versionado por entidad) | done |
| T021 | frontend | Definir frontend de release (frontend/) como carril principal | done |
| T022 | frontend | Auditar rutas core en frontend principal | done |
| T023 | frontend | Alinear servicio auth con backend actual | done |
| T024 | frontend | Alinear pacientes list/detail con contratos reales | done |
| T025 | frontend | Alinear profesionales list/detail con contratos reales | done |
| T026 | frontend | Alinear appointments list/calendar con backend | done |
| T027 | frontend | Alinear medical-records list/detail con backend | done |
| T028 | frontend | Alinear files upload/download con backend | done |
| T029 | frontend | Alinear budgets list/detail con backend | done |
| T030 | frontend | Alinear payments list/detail con backend | done |
| T031 | frontend | Agregar estado loading/error/empty en flujos core | done |
| T032 | frontend | Validar guards/rbac en rutas protegidas | done |
| T033 | frontend | Reducir mocks residuales en frontend principal | done |
| T034 | frontend | Corregir mapeo de modelos TypeScript core | done |
| T035 | frontend | Validar build frontend principal en limpio | done |
| T036 | frontend | Auditar brechas de frontend-web contra backend | done |
| T037 | frontend | Priorizar backlog de frontend-web por valor | done |
| T038 | frontend | Auditar estado real de frontend-pwa | done |
| T039 | frontend | Definir alcance minimo PWA fase release | done |
| T040 | frontend | Preparar ticket FE-CORE-01 para cierre completo | done |
| T041 | deploy | Auditar coherencia docker-compose.yml vs docker-compose.db.yml | done |
| T042 | deploy | Auditar coherencia docker-compose.prod.yml | done |
| T043 | deploy | Estandarizar variables de entorno requeridas | done |
| T044 | deploy | Crear checklist de healthchecks por servicio | done |
| T045 | deploy | Validar arranque DB stack con docker-compose.db.yml | done |
| T046 | deploy | Validar arranque app stack con docker-compose.yml | done |
| T047 | deploy | Validar health endpoint backend tras despliegue | done |
| T048 | deploy | Auditar configuracion redis/celery en desarrollo | done |
| T049 | deploy | Auditar estrategia backup/restore operativa | done |
| T050 | deploy | Crear runbook de rollback para incidentes | done |
| T051 | deploy | Validar logs backend sin errores criticos al arranque | done |
| T052 | deploy | Validar persistencia volumenes postgres/redis | done |
| T053 | deploy | Preparar ticket DEPLOY-02 para hardening nginx | done |
| T054 | deploy | Preparar ticket DEPLOY-03 para monitoreo alertas | done |
| T055 | deploy | Preparar ticket DEPLOY-04 para release candidate | done |
| T056 | qa | Ejecutar test_sync.py completo | done |
| T057 | qa | Ejecutar test_sync_endpoints.py completo | done |
| T058 | qa | Agregar pruebas negativas para payload invalidos sync | done |
| T059 | qa | Agregar pruebas de idempotencia por lotes de cambios | done |
| T060 | qa | Agregar pruebas de conflictos multi-entidad | done |
| T061 | qa | Agregar pruebas de status/logs con nuevos campos | done |
| T062 | qa | Ejecutar subset backend core smoke tests | done |
| T063 | qa | Auditar cobertura de modulo sync tras cambios | done |
| T064 | qa | Preparar suite de regresion backend core | done |
| T065 | qa | Preparar smoke API (auth/patients/appointments) | done |
| T066 | qa | Preparar smoke frontend principal build+lint | done |
| T067 | qa | Preparar matriz de casos E2E core | done |
| T068 | qa | Automatizar reporte diario de estado de pruebas | done |
| T069 | qa | Preparar ticket QA-LOAD-01 para pruebas de carga | done |
| T070 | qa | Preparar ticket QA-E2E-02 para offline/online sync | done |
| T071 | security | Auditar endpoints sync para validaciones de entrada | done |
| T072 | security | Auditar manejo de errores sensibles en sync | done |
| T073 | security | Auditar impacto de nuevos campos sync_logs en auditoria | done |
| T074 | security | Validar JWT obligatorio en endpoints sync | done |
| T075 | security | Auditar RBAC en endpoints administrativos | done |
| T076 | security | Revisar CORS segun entorno objetivo | done |
| T077 | security | Auditar secretos en archivos de configuracion | done |
| T078 | security | Preparar politica de rotacion de secretos | done |
| T079 | security | Preparar control de retencion de sync_logs | done |
| T080 | security | Preparar ticket SEC-01 para rate limiting en sync | done |
| T081 | security | Preparar ticket SEC-02 para hardening headers | done |
| T082 | security | Preparar ticket SEC-03 para trazabilidad de export | done |
| T083 | security | Preparar ticket SEC-04 para pruebas de seguridad API | done |
| T084 | security | Preparar ticket SEC-05 para checklist pre-release | done |
| T085 | security | Preparar ticket SEC-06 para monitoreo de eventos | done |
| T086 | docs-product | Actualizar PLAN_AUTONOMO_SKILLS con estado real | done |
| T087 | docs-product | Actualizar ESTADO_Y_BACKLOG con progreso sync | done |
| T088 | docs-product | Actualizar docs/README indice roadmap | done |
| T089 | docs-product | Mantener trazabilidad de cambios por ticket | done |
| T090 | docs-product | Crear tablero de 100 tareas autonomas | done |
| T091 | docs-product | Definir cadencia diaria de ejecucion por carriles | done |
| T092 | docs-product | Definir criterio de priorizacion por impacto | done |
| T093 | docs-product | Definir criterio de bloqueo y escalamiento | done |
| T094 | docs-product | Publicar KPI semanales de avance | done |
| T095 | docs-product | Preparar cierre de fase 1 con evidencia | done |
| T096 | docs-product | Preparar arranque de fase 2 con tickets priorizados | done |
| T097 | docs-product | Alinear docs de arquitectura con estado real | done |
| T098 | docs-product | Eliminar referencias obsoletas detectadas | done |
| T099 | docs-product | Consolidar resumen ejecutivo de release | done |
| T100 | docs-product | Preparar handover tecnico operativo final | done |
