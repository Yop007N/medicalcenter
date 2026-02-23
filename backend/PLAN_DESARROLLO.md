# Plan de desarrollo - Backend Medical Services

Actualizado: 2026-02-23

## Estado ejecutivo
- Backend con alto avance funcional en dominios clinicos core y especialidades.
- El cierre total de producto aun depende de sync productivo, paridad frontend y hardening operativo.

## Modulos implementados
- Auth y usuarios (`/api/auth`, `/api/users`)
- Profesionales y pacientes (`/api/professionals`, `/api/patients`)
- Turnos (`/api/appointments`)
- Historia clinica y archivos (`/api/medical-records`, `/api/files`)
- Presupuestos y pagos (`/api/budgets`, `/api/payments`)
- Dashboard y reportes (`/api/dashboard`, `/api/reports`)
- Auditoria (`/api/audit`)
- Especialidades (`/api/odontograms`, `/api/dental-treatments`, `/api/clinical-history`, `/api/psychology`, `/api/psychopedagogy`)
- Sync base (`/api/sync`)

## Brechas tecnicas actuales
1. Sincronizacion aun parcial por entidad y sin versionado distribuido completo.
2. Estrategia de storage con base local y configuracion cloud futura por completar.
3. Hardening operativo pendiente en stack productivo (monitoreo, healthchecks avanzados, runbooks cerrados).

## Plan de cierre recomendado

### Fase 1 - Contrato y consistencia (1-2 semanas)
- Congelar contrato API core.
- Unificar validaciones y catalogo de errores.
- Alinear storage local/cloud por entorno.

### Fase 2 - Sync productivo (2-4 semanas)
- Ampliar cobertura de entidades y reglas de merge.
- Implementar versionado por registro.
- Completar pruebas de integracion y conflicto.

### Fase 3 - Hardening de release (1-2 semanas)
- Validar backup/restore y rollback.
- Completar observabilidad y alertas.
- Cerrar checklist de despliegue productivo.

## Criterio de backend listo para release
- Tests backend en verde en entorno limpio.
- Endpoints core, auditoria y reportes estables.
- Sync validado para alcance funcional comprometido.
- Operacion productiva documentada y probada.

## Referencias vigentes
- Alcance general: `docs/ALCANCE_SISTEMA_GENERAL.md`
- Arquitectura: `docs/architecture/architecture.md`
- Sync: `docs/architecture/sync-strategy.md`
- API: `docs/api/README.md`
- Deploy: `docs/deployment/COMPOSE_AUDIT.md`
