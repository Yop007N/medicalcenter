# Synchronization Strategy (estado real)

Actualizado: 2026-03-01

## Objetivo
Documentar el estado implementado de sync, su cobertura efectiva y brechas reales de release.

## Implementado

### Endpoints
- `POST /api/sync/push`
- `GET /api/sync/pull`
- `GET /api/sync/status`
- `GET /api/sync/logs` (`admin`)

### `push`
- Validacion estructural de `changes`.
- Limite de lote: `MAX_SYNC_CHANGES=500`.
- Registro de eventos en `sync_logs`.
- Idempotencia por `idempotency_key` o fingerprint.
- Reserva temprana de `idempotency_key` para concurrencia.
- Replay idempotente de operaciones `completed`, `in_progress` y `failed`.
- Resolucion de conflictos por politica de entidad (`ENTITY_CONFLICT_POLICIES`): `version_then_timestamp` para `appointment`, `medical_record`, `budget`, `payment`; `version_only` para `file`.
- Respuesta de conflicto con metadata ampliada (`strategy`, `server_sync_version`, `client_sync_version`).

### `pull`
- Entrega de cambios por `since`.
- Incluye `sync_version` por registro en `data`.

### Entidades sincronizadas actualmente
- `appointment`
- `medical_record`
- `budget`
- `payment`
- `file`

### Versionado e idempotencia persistente
- `sync_version` implementado en `appointments`, `medical_records`, `budgets`, `payments`, `files`.
- `sync_logs` almacena `result_entity_version`.
- Indice unico en `sync_logs(idempotency_key, direction)` cuando `idempotency_key` no es null.

## Validacion tecnica registrada
- `docker compose exec -T backend pytest -q tests/test_sync_endpoints.py tests/test_sync_service.py tests/test_sync_tasks.py` -> `25 passed`.
- `docker compose exec -T backend alembic upgrade head`.
- `docker compose exec -T backend alembic current` -> `f0e1d2c3b4a5 (head)`.

## Brechas pendientes reales
- E2E offline/online mas profundo en frontends contra entorno de despliegue.
- Cobertura sync para entidades adicionales si entran al alcance final.
- Politicas de merge de negocio por dominio (cuando `server_wins` no sea suficiente).

## Criterio de cierre de sync para release
- Smoke sync por actor en entorno de despliegue.
- Reintentos idempotentes verificados ante concurrencia.
- Evidencia operativa de monitoreo y runbook de recuperacion vigente.
