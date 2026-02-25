# Indice de documentacion vigente

Actualizado: 2026-02-25

## Regla de vigencia
- Esta carpeta (`docs/`) contiene la documentacion activa del proyecto.
- Si hay diferencia entre documentacion y codigo, prevalece el codigo.
- `docs/archive/legacy/` es historico y no se usa como fuente operativa.

## Fuente de verdad funcional
- `development/UC_RF_VERIFICATION_2026-02-24.md`: matriz de casos de uso/requisitos (UC-MS-001..UC-MS-017) verificados.
- `development/SPRINT_BACKLOG_P0_P1_P2_2026-02-24.md`: estado de ejecucion por prioridad (P0/P1/P2).
- `development/solid_activity_tracker.md`: evidencia de build/tests/E2E por modulo.

## Vision y arquitectura
- `ALCANCE_SISTEMA_GENERAL.md`: alcance consolidado y estado real por capa.
- `architecture/architecture.md`: arquitectura actual backend + 3 frontends + despliegue.
- `architecture/operational-flow.md`: flujo operativo por actor y fronteras de acceso.
- `architecture/sync-strategy.md`: estado real de sincronizacion y brechas pendientes.
- `requirements/REQUISITOS_FUNCIONALES_CASOS_USO.md`: requisitos funcionales y casos de uso.
- `exports/REQUISITOS_FUNCIONALES_CASOS_USO.pdf`: version PDF.
- `exports/FLUJO_OPERATIVO_DEL_SISTEMA.pdf`: version PDF.

## Frontends
- `../frontend-admin-profesional/README.md`: frontend Angular para actor `admin`.
- `../frontend-profesional/README.md`: frontend Angular para actor `professional`.
- `../frontend-paciente/README.md`: frontend Ionic PWA para actor `patient`.

## Desarrollo
- `development/setup.md`: setup local recomendado.
- `development/coding-standards.md`: normas de codificacion.
- `backend/PLAN_DESARROLLO.md` (en `backend/`): plan tecnico backend.

## Base de datos
- `database/SETUP.md`: levantamiento y validacion DB local.
- `database/schema.md`: inventario de tablas y relaciones.
- `database/init.sql`: inicializacion local.

## API
- `api/README.md`: modulos de endpoints y notas operativas.

## Seguridad
- `security/README.md`: indice de controles y politicas activas.
- `security/SECURITY_AUDIT_2026-02-14.md`: auditoria aplicada.
- `security/SECRET_ROTATION_POLICY.md`: rotacion de secretos.
- `security/SYNC_LOG_RETENTION_POLICY.md`: retencion de `sync_logs`.

## Deploy y operacion
- `deployment/COMPOSE_AUDIT.md`: auditoria de compose y brechas operativas.
- `deployment/BACKUP_RESTORE_AUDIT.md`: estrategia de backup/restore.
- `deployment/ROLLBACK_RUNBOOK.md`: runbook de rollback.
- `deployment/ENDPOINTS_ACCESO_SMOKE_PLAYWRIGHT.md`: endpoints por actor, credenciales demo y smoke.
