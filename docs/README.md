# Indice de Documentacion Vigente

Actualizado: 2026-03-01

## Regla de vigencia
- `docs/` contiene solo documentacion operativa vigente.
- `docs/archive/legacy/` contiene historico y no se usa para decisiones nuevas.
- Si existe diferencia entre codigo y documentacion, prevalece el codigo.

## Fuente de verdad funcional
- `docs/development/solid_activity_tracker.md`
- `docs/development/SPRINT_BACKLOG_P3_PARALLEL_2026-02-26.md`
- `docs/development/UC_RF_VERIFICATION_2026-02-24.md`
- `docs/development/README.md`

## Arquitectura y alcance
- `docs/ALCANCE_SISTEMA_GENERAL.md`
- `docs/architecture/architecture.md`
- `docs/architecture/operational-flow.md`
- `docs/architecture/sync-strategy.md`
- `docs/requirements/REQUISITOS_FUNCIONALES_CASOS_USO.md`

## Deploy y operacion
- `docs/deployment/ENDPOINTS_ACCESO_SMOKE_PLAYWRIGHT.md`
- `docs/deployment/COMPOSE_AUDIT.md`
- `docs/deployment/BACKUP_RESTORE_AUDIT.md`
- `docs/deployment/ROLLBACK_RUNBOOK.md`

## Seguridad
- `docs/security/README.md`
- `docs/security/SECURITY_AUDIT_2026-02-14.md`
- `docs/security/SECRET_ROTATION_POLICY.md`
- `docs/security/SYNC_LOG_RETENTION_POLICY.md`

## Base de datos y API
- `docs/database/SETUP.md`
- `docs/database/schema.md`
- `docs/api/README.md`

## Frontends
- `frontend-admin-profesional/README.md` (admin/professional principal)
- `frontend-profesional/README.md` (workspace profesional web)
- `frontend-paciente/README.md` (PWA paciente)

## Limpieza aplicada en esta iteracion
- backlog historico movido a `docs/archive/legacy/development/`.
- reportes de ejecucion por ola excluidos del repositorio (`docs/development/wave_reports/`).
- artefactos de tests/E2E excluidos via `.gitignore`.
