# Indice de documentacion vigente

Actualizado: 2026-02-23

## Fuente de verdad
- Esta carpeta contiene la documentacion operativa vigente del proyecto.
- Si hay diferencia entre documentacion y codigo, prevalece el codigo.
- Documentos de planificacion interna y ejecucion asistida por IA se mantienen fuera del repositorio versionado.
- `docs/roadmap/` no forma parte de la documentacion operativa activa.

## Vision y arquitectura
- `ALCANCE_SISTEMA_GENERAL.md`: alcance funcional y tecnico consolidado.
- `architecture/architecture.md`: arquitectura actual por capa.
- `architecture/sync-strategy.md`: estado real de sincronizacion y estrategia de cierre.
- `requirements/REQUISITOS_FUNCIONALES_CASOS_USO.md`: requisitos funcionales mapeados a casos de uso reales (UML + Mermaid).
- `exports/REQUISITOS_FUNCIONALES_CASOS_USO.pdf`: version PDF del documento funcional.

## Frontends
- `../frontend/README.md`: cliente principal (Angular 20 + Ionic 8).
- `../frontend-web/README.md`: cliente web profesional (Angular 17).
- `../frontend-pwa/README.md`: cliente PWA base (Angular 17 + Ionic 7).

## Desarrollo
- `development/setup.md`: setup local recomendado.
- `development/coding-standards.md`: normas de codificacion.
- `backend/PLAN_DESARROLLO.md` (en raiz `backend/`): plan tecnico de cierre backend.

## Base de datos
- `database/SETUP.md`: levantamiento y validacion de DB local.
- `database/schema.md`: inventario de tablas y relaciones.
- `database/init.sql`: inicializacion para entorno local.

## API
- `api/README.md`: modulos de endpoints y notas operativas.

## Seguridad
- `security/README.md`: indice de controles y politicas activas.
- `security/SECURITY_AUDIT_2026-02-14.md`: auditoria aplicada.
- `security/SECRET_ROTATION_POLICY.md`: politica de secretos.
- `security/SYNC_LOG_RETENTION_POLICY.md`: retencion de `sync_logs`.

## Deploy y operacion
- `deployment/COMPOSE_AUDIT.md`: hallazgos y acciones sobre compose.
- `deployment/BACKUP_RESTORE_AUDIT.md`: estrategia de backup/restore.
- `deployment/ROLLBACK_RUNBOOK.md`: runbook de rollback.

## Archivo historico
- `archive/legacy/`: documentos historicos que se conservan solo como referencia.
