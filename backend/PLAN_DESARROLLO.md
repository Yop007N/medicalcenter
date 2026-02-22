# Plan de Desarrollo - Backend Medical Services

Actualizado: 2026-02-14

## Estado ejecutivo
- Backend con alto avance funcional y cobertura de dominios clinicos amplia.
- No esta cerrado al 100% como producto final por brechas en sync productivo, hardening operativo y paridad frontend.

## Modulos backend implementados
- Auth y usuarios (`/api/auth`, `/api/users`)
- Profesionales y pacientes (`/api/professionals`, `/api/patients`)
- Turnos (`/api/appointments`)
- Historia clinica base y archivos (`/api/medical-records`, `/api/files`)
- Presupuestos y pagos (`/api/budgets`, `/api/payments`)
- Dashboard y reportes (`/api/dashboard`, `/api/reports`)
- Auditoria (`/api/audit`)
- Especialidades:
  - Odontologia (`/api/odontograms`, `/api/dental-treatments`, `/api/clinical-history`)
  - Psicologia (`/api/psychology`)
  - Psicopedagogia (`/api/psychopedagogy`)
- Sync base (`/api/sync`)

## Brechas actuales de backend
1. Sincronizacion con handlers simplificados en endpoints/servicios.
2. Estrategia de storage mixta (modelo con default cloud, runtime local).
3. Endurecimiento operativo pendiente (observabilidad, restore probado, runbooks).

## Plan de cierre recomendado
### Fase 1 - Contrato y consistencia (1-2 semanas)
- Congelar contrato API core.
- Unificar convenciones de errores y validaciones.
- Cerrar inconsistencias de storage (cloud/local).

### Fase 2 - Sync real por entidad (2-4 semanas)
- Implementar handlers reales para entidades core.
- Agregar control de versiones y conflictos.
- Cubrir con tests de integracion.

### Fase 3 - Hardening de release (1-2 semanas)
- Checklist de despliegue productivo.
- Backups/restore validados.
- Monitoreo/alertas y trazabilidad completa.

## Criterio de backend "listo para release"
- Tests backend en verde en entorno limpio.
- Endpoints core + auditoria + reportes estables.
- Sync sin placeholders para entidades core.
- Runbook operativo de deploy y recuperacion documentado.

## Referencias
- Alcance general: `docs/ALCANCE_SISTEMA_GENERAL.md`
- Arquitectura: `docs/architecture/architecture.md`
- Sync: `docs/architecture/sync-strategy.md`
- Backlog: `docs/roadmap/ESTADO_Y_BACKLOG.md`
