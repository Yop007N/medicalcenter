# Auditoria Docker Compose

Actualizado: 2026-02-26

## Archivos auditados
- `docker-compose.yml`
- `docker-compose.db.yml`
- `docker-compose.prod.yml`

Comando de validacion sintactica ejecutado:
- `docker compose -f docker-compose.yml config`
- `docker compose -f docker-compose.db.yml config`
- `docker compose -f docker-compose.prod.yml config`

## Hallazgos de coherencia
1. Redes diferentes entre stacks:
- `docker-compose.yml` y `docker-compose.prod.yml` usan `medical-services-network`.
- `docker-compose.db.yml` usa `medical-network`.

2. Credenciales y estrategia DB no alineadas:
- `docker-compose.yml` usa `postgres/postgres` + `POSTGRES_HOST_AUTH_METHOD=trust`.
- `docker-compose.db.yml` usa defaults `medical_user/change-me-db` + healthcheck.

3. Variables de entorno obligatorias en produccion no definidas por defecto:
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `DATABASE_URL`
- `JWT_SECRET_KEY`
- `SECRET_KEY`
- `S3_BUCKET`
- `S3_ACCESS_KEY`
- `S3_SECRET_KEY`

4. Healthchecks y gating de arranque:
- `docker-compose.yml`: `DONE` (postgres/redis/backend/celery/frontend-web/frontend-admin/frontend-pwa con `healthcheck` + `depends_on.condition=service_healthy`).
- `docker-compose.prod.yml`: `DONE` (postgres/redis/backend/celery/nginx con `healthcheck` + `depends_on.condition=service_healthy`).
- `version` obsoleta removida de ambos compose para eliminar warning operativo.

## Checklist minimo de healthchecks recomendado
- `postgres`: `pg_isready`.
- `redis`: `redis-cli ping`.
- `backend`: `GET /health` o endpoint equivalente.
- `nginx`: check HTTP 200 de upstream.
- `celery`: ping de worker (`celery inspect ping`) o probe de liveness del proceso.

## Cierre tecnico (2026-02-26)
- Validacion sintactica:
  - `docker compose config` -> `DEV_CONFIG_OK`.
  - `docker compose -f docker-compose.prod.yml config` -> `PROD_CONFIG_OK`.
- Validacion runtime:
  - `docker compose up -d`.
  - `docker compose ps` -> servicios en `healthy`:
    - `medical-services-db`
    - `medical-services-redis`
    - `medical-services-backend`
    - `medical-services-celery`
    - `medical-services-frontend-web`
    - `medical-services-frontend-admin`
    - `medical-services-frontend-pwa`

## Validacion runtime dev (2026-02-14)
- Stack completo levantado con `docker compose -f docker-compose.yml up -d` y override `FRONTEND_WEB_PORT=4201`.
- `GET /health` validado en `http://localhost:5000/health` con HTTP `200` y estado `database=healthy`, `redis=healthy`.
- Frontends expuestos y respondiendo HTTP `200`:
  - `http://localhost:4201`
  - `http://localhost:8100`
- Logs de arranque backend revisados sin errores criticos (solo warning esperado de servidor Flask dev/Werkzeug).
- Redis/Celery en desarrollo auditado:
  - `docker-compose.yml` usa `REDIS_URL`, `CELERY_BROKER_URL` y `CELERY_RESULT_BACKEND` apuntando a `redis://redis:6379/0`.
  - Redis se ejecuta con `--protected-mode no` en red interna de compose para evitar resets de conexion en backend dev.
  - `backend/app/extensions.py` ahora construye `redis_client` desde `REDIS_URL` (fallback a `REDIS_HOST/REDIS_PORT/REDIS_DB`).
- Persistencia de volumenes validada con recreacion de contenedores (`docker compose down && up -d`):
  - Redis: key `codex_persist_check=20260214_201006` conservada post-recreacion.
  - PostgreSQL: tabla `codex_persist_check` y valor `20260214_201006` conservados post-recreacion.

## Acciones de cierre propuestas
1. Estandarizar red y credenciales de desarrollo para evitar divergencia de entorno.
2. Consolidar variables de entorno root en `.env.compose.example`.
3. Definir un perfil unico de arranque local (`db-only`, `full-stack`) con comandos documentados.
