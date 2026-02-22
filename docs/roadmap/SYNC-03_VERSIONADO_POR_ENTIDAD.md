# Ticket SYNC-03 - Versionado por Entidad

Actualizado: 2026-02-14
Estado: `ready`
Prioridad: `alta`
Carril: `backend-sync`

## Objetivo
Implementar versionado consistente por registro para sincronizacion bidireccional, reduciendo conflictos falsos y permitiendo merge auditable por entidad.

## Alcance
- Entidades fase 1: `appointments`, `medical_records`, `budgets`, `payments`, `files`.
- Estrategia de version: `row_version` incremental por registro (entero >= 1).
- Mantener compatibilidad con `updated_at` durante migracion.

## Cambios requeridos
1. Modelo y base de datos
- Agregar columna `row_version` (`Integer`, `NOT NULL`, default `1`) en entidades soportadas.
- Crear migraciones para backfill de registros existentes (`row_version=1`).
- Asegurar incremento atomico de version en update (`row_version = row_version + 1`).

2. Contrato Sync Push
- Payload esperado por cambio:
  - `entity_type`
  - `operation`
  - `entity_id`
  - `data`
  - `client_version` (opcional en create, obligatorio en update/delete)
- Regla de conflicto:
  - Si `client_version < row_version` => conflicto `server_wins`.
  - Si `client_version == row_version` => aplicar cambio y devolver `new_version`.

3. Contrato Sync Pull
- Incluir metadata de version por cambio:
  - `version` (`row_version`)
  - `updated_at`
- Mantener timestamp incremental como filtro (`since`) para compatibilidad.

4. Auditoria y trazabilidad
- Extender `sync_logs.conflict_payload` con:
  - `server_version`
  - `client_version`
  - `server_row_version`
  - `client_row_version`
- Persistir `result_entity_id` y `idempotency_key` (ya implementado) como parte obligatoria del flujo.

## Plan de implementacion
1. Agregar `row_version` en modelos + migraciones.
2. Integrar versionado en `process_sync_change` y validadores de conflicto.
3. Ajustar serializacion en `pull` para exponer `version`.
4. Extender tests de sync (positivo/negativo/reintentos).
5. Actualizar documentacion (`schema.md`, `sync-strategy.md`, `api/README.md`).

## Criterios de aceptacion
- Updates concurrentes con version desfasada generan conflicto reproducible.
- Updates con version correcta incrementan `row_version` y sincronizan.
- `pull` devuelve `version` consistente por entidad.
- Suite `test_sync.py` + `test_sync_endpoints.py` en verde.

## Riesgos y mitigacion
- Riesgo: conflictos por clientes legacy sin `client_version`.
- Mitigacion: fase de compatibilidad temporal con fallback a `updated_at` y warning en logs.

## Fuera de alcance
- Merge por campo automatizado.
- Resolucion interactiva de conflictos en UI.
