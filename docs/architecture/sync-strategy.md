# Synchronization Strategy (Estado actual y plan)

Actualizado: 2026-02-14

## Objetivo
Definir claramente que parte de la sincronizacion ya esta implementada y que parte sigue en roadmap.

## Estado actual implementado
### Endpoints disponibles
- `POST /api/sync/push`
- `GET /api/sync/pull`
- `GET /api/sync/status`
- `GET /api/sync/logs`

### Comportamiento actual
- `push`:
  - recibe cambios desde cliente
  - valida body JSON/objeto y estructura minima por cambio (`entity_type`, `operation`, `data`)
  - limita lotes a `500` cambios por request
  - registra `sync_logs`
  - procesa cambios con handlers por entidad soportada (`appointment`, `medical_record`, `budget`, `payment`, `file`)
  - aplica idempotencia por `idempotency_key` (o fingerprint derivado del payload)
  - detecta conflictos de actualizacion por `updated_at` y responde `server_wins`
  - devuelve mapeo `local_id -> server_id`
- `pull`:
  - devuelve cambios por timestamp para entidades soportadas
- `status/logs`:
  - exponen contadores y ultimos logs
  - `logs` valida `limit` entero en rango `1..500`
  - respuestas de errores internos en `push` se sanitizan para cliente, manteniendo detalle tecnico en `sync_logs`

### Tareas Celery relacionadas
- Existen tareas y utilidades de sync en `backend/app/tasks/sync_tasks.py`
- Hay validaciones y estructura de sync incremental/full
- Parte de la logica aun se encuentra en modo base/placeholder para escenarios reales multi-entidad

## Lo que NO esta cerrado aun
- Resolucion de conflictos granular por campo (hoy se aplica regla por `updated_at`)
- Versionado consistente por registro para merge server/client en todas las entidades
- Idempotencia distribuida multi-nodo (hoy se basa en `sync_logs`)
- Reconciliacion completa de archivos en escenarios distribuidos
- Cobertura E2E de sync offline/online en frontends

## Estrategia recomendada por fases
### Fase 1 - Consolidar contrato
- Definir contrato unico de payload (create/update/delete, metadata de version)
- Unificar respuesta de conflictos
- Instrumentar errores y metricas de sync

### Fase 2 - Handlers por entidad
- Reemplazar `process_sync_change` simplificado por handlers reales
- Cubrir al menos: patients, appointments, medical_records, files, budgets, payments

### Fase 3 - Conflictos e idempotencia
- Implementar control de version (`updated_at` o `version`)
- Resolver conflicto con politica explicita y auditable
- Reintentos idempotentes

### Fase 4 - Validacion end-to-end
- Tests de sincronizacion offline/online
- Escenarios de conflicto concurrente
- Pruebas de carga para lotes grandes

## Criterios de salida a produccion
- Sync bidireccional multi-entidad validado
- Reintentos seguros y sin duplicados
- Trazabilidad completa en `sync_logs` + auditoria
- Reporte de metricas de exito/error por ventana de tiempo
