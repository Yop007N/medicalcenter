# Auditoria de Seguridad 2026-02-14

## Alcance
- `backend/app/resources/sync.py`
- `backend/app/resources/users.py`
- `backend/app/config.py`
- `backend/app/__init__.py`
- `backend/app/tasks/sync_tasks.py`
- `docker-compose.db.yml`

## Resultado ejecutivo
- Estado: `aprobado con acciones aplicadas y tickets abiertos`.
- Riesgo alto mitigado:
- control de acceso en endpoints administrativos (`/api/users`, `/api/sync/logs`),
- eliminacion de credenciales hardcodeadas en compose de DB,
- control operativo de retencion de `sync_logs`.

## Hallazgos y acciones
### T073 - Impacto de nuevos campos `sync_logs` en auditoria
- Hallazgo:
- `sync_logs` incorpora `idempotency_key`, `external_entity_ref`, `result_entity_id`, `conflict_payload`, `error_message`.
- esos campos no se serializan hoy en `audit_logs` de forma estructurada.
- Accion:
- se documenta brecha de trazabilidad y se abre ticket `SEC-03` para extender auditoria de export/eventos y correlacion.

### T075 - RBAC en endpoints administrativos
- Hallazgo:
- `/api/users/*` estaba protegido solo con JWT y permitia gestion global sin rol admin.
- `/api/sync/logs` estaba disponible para cualquier usuario autenticado.
- Accion aplicada:
- `backend/app/resources/users.py`: `list/create/delete` requieren `admin`; `get/update` permiten `admin` o acceso propio.
- `backend/app/resources/sync.py`: `/api/sync/logs` pasa a `admin_required`.
- Evidencia:
- `backend/tests/test_users.py` y `backend/tests/test_sync_endpoints.py` con casos `403` para no admin.

### T076 - CORS por entorno objetivo
- Hallazgo:
- configuracion CORS aceptaba lista separada por coma sin sanitizacion y `credentials` siempre habilitado.
- Accion aplicada:
- `backend/app/config.py`: parseo robusto de `CORS_ORIGINS`, `CORS_ALLOW_CREDENTIALS`, `CORS_MAX_AGE`.
- `backend/app/config.py`: en `production` ahora es obligatorio definir `CORS_ORIGINS`.
- `backend/app/__init__.py`: sanitiza origenes y desactiva credenciales si hay wildcard `*`.

### T077 - Secretos en configuracion
- Hallazgo:
- `docker-compose.db.yml` tenia credenciales y password de pgAdmin hardcodeadas.
- Accion aplicada:
- `docker-compose.db.yml` ahora usa variables con defaults rotables (`${...:-...}`).
- `.env.compose.example` incorpora variables de CORS y pgAdmin para gestion explicita.

### T079 - Retencion de `sync_logs`
- Hallazgo:
- `cleanup_old_sync_logs_task` estaba en modo placeholder.
- Accion aplicada:
- `backend/app/tasks/sync_tasks.py` ahora elimina logs terminales (`completed/failed`) fuera de ventana de retencion.
- no elimina `pending/in_progress`.
- Evidencia:
- `backend/tests/test_sync_tasks.py`.

## Riesgo residual
- Falta instrumentar rate limiting dedicado por endpoint de sync (`SEC-01`).
- Falta hardening centralizado de headers HTTP (`SEC-02`).
- Falta trazabilidad detallada de export en auditoria (`SEC-03`).

## Evidencia de validacion
- `backend/.venv311/Scripts/python -m pytest backend/tests/test_users.py backend/tests/test_sync_endpoints.py backend/tests/test_sync_tasks.py -q` -> `44 passed`.
- `docker compose -f docker-compose.db.yml config` -> `OK`.

