# Politica de Rotacion de Secretos

Actualizado: 2026-02-14

## Objetivo
Reducir riesgo por exposicion de credenciales y estandarizar rotacion de secretos en `development`, `staging` y `production`.

## Alcance
- `SECRET_KEY`
- `JWT_SECRET_KEY`
- `POSTGRES_PASSWORD`
- `S3_ACCESS_KEY`
- `S3_SECRET_KEY`
- `PGADMIN_DEFAULT_PASSWORD` (solo entornos no productivos)

## Frecuencia minima
- Produccion:
- claves de aplicacion (`SECRET_KEY`, `JWT_SECRET_KEY`): cada 90 dias.
- credenciales DB y cloud: cada 90 dias o ante incidente.
- Staging:
- cada 180 dias o cuando se rote en produccion.
- Development:
- al inicio de cada ciclo mayor o ante filtracion detectada.

## Procedimiento
1. Generar nuevo secreto en gestor seguro (Vault/Secrets Manager/CI variables protegidas).
2. Aplicar secreto en entorno objetivo sin commitearlo en repositorio.
3. Reiniciar servicios dependientes (`backend`, `celery`, `db` si aplica).
4. Validar `GET /health`, login JWT y flujos core.
5. Revocar secreto anterior y dejar trazabilidad del cambio.

## Trazabilidad obligatoria
- Fecha y hora UTC.
- Secreto rotado (nombre, no valor).
- Responsable de cambio.
- Entorno afectado.
- Resultado de validacion tecnica.

## Controles
- Prohibido hardcodear secretos en `docker-compose*.yml`.
- Prohibido valores reales en `.env.compose.example`.
- Cualquier secreto detectado en git requiere:
- revocacion inmediata,
- nuevo secreto,
- registro de incidente.

