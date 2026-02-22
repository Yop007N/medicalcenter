# Indice de Documentacion

## Vision general
- `ALCANCE_SISTEMA_GENERAL.md`: alcance real, limites y veredicto de avance
- `architecture/architecture.md`: arquitectura vigente por capa
- `architecture/sync-strategy.md`: estado y plan de sincronizacion

## Estado y roadmap
- `roadmap/ESTADO_Y_BACKLOG.md`: backlog priorizado y plan de cierre
- `roadmap/PLAN_AUTONOMO_SKILLS.md`: metodo de ejecucion autonoma por skills
- `roadmap/OPERACION_AUTONOMA_DIARIA.md`: cadencia, priorizacion, bloqueo y KPI de operacion autonoma
- `roadmap/TABLERO_100_TAREAS_AUTONOMO.md`: tablero de ejecucion en paralelo
- `roadmap/TABLERO_1000_TAREAS_AUTONOMO.md`: expansion a 1000 microtareas para paralelismo por lotes
- `roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md`: tablero semilla de continuidad (`T101-T200`)
- `roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md`: expansion de continuidad (`P1001-P2000`)
- `roadmap/SYNC-03_VERSIONADO_POR_ENTIDAD.md`: ticket tecnico de versionado distribuido para sync
- `roadmap/PARIDAD_FE_BE_AUDIT.md`: auditoria rapida de paridad frontend/backend
- `roadmap/TRAZABILIDAD_TICKETS.md`: evidencia tecnica por ticket ejecutado
- `roadmap/security/`: tickets de seguridad `SEC-01..SEC-06`
- `roadmap/deploy/`: tickets de despliegue `DEPLOY-02..DEPLOY-04`
- `roadmap/qa/`: tickets y matriz QA `QA-REG-CORE-01`, `QA-E2E-CORE-01`, `QA-LOAD-01`, `QA-E2E-02`
- `roadmap/frontend/`: auditoria PWA, alcance minimo y ticket `FE-CORE-01`
- `roadmap/release/`: cierre de fase, resumen ejecutivo y handover operativo final

## Desarrollo
- `development/setup.md`: instalacion y puesta en marcha
- `development/coding-standards.md`: estandares de codigo

## Base de datos
- `database/SETUP.md`: guia de base de datos
- `database/schema.md`: inventario actual de tablas y relaciones
- `database/init.sql`: SQL de inicializacion

## API
- `api/README.md`: referencia API disponible

## Seguridad
- `security/README.md`: indice de seguridad
- `security/SECURITY_AUDIT_2026-02-14.md`: auditoria de seguridad aplicada
- `security/SECRET_ROTATION_POLICY.md`: politica de rotacion de secretos
- `security/SYNC_LOG_RETENTION_POLICY.md`: retencion operativa de `sync_logs`

## Deploy
- `deployment/COMPOSE_AUDIT.md`: auditoria de docker compose y checklist de healthchecks
- `deployment/BACKUP_RESTORE_AUDIT.md`: auditoria operativa de estrategia backup/restore
- `deployment/ROLLBACK_RUNBOOK.md`: procedimiento de rollback ante incidentes
- `roadmap/reports/`: snapshots y reportes QA generados automaticamente por `tools/autonomy/cli.py`
- `roadmap/reports/FASE_SIGUIENTE_AUTONOMY_SNAPSHOT.json`: snapshot del tablero de continuidad
- `roadmap/reports/FASE_SIGUIENTE_AUTONOMY_DAILY_OPERATIONS.md`: cadencia y prioridades del tablero de continuidad

## Operacion recomendada
1. Revisar `ALCANCE_SISTEMA_GENERAL.md`
2. Revisar `roadmap/ESTADO_Y_BACKLOG.md`
3. Configurar entorno con `development/setup.md`
4. Validar datos con `database/SETUP.md`
5. Revisar endpoints en `api/README.md`

## Documentos archivados
- Documentacion historica movida a `docs/archive/legacy/` para evitar contradicciones con el estado actual.
