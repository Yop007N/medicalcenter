# Runbook de Rollback de Incidentes

Actualizado: 2026-02-14

## Objetivo
Recuperar servicio de Medical Services ante despliegue fallido o degradacion critica, minimizando downtime y perdida de datos.

## Escenarios cubiertos
- Backend no inicia despues de deploy.
- Error de migracion/esquema incompatible.
- Degradacion severa de API (`/health` no saludable).
- Falla en frontends/nginx post-release.

## Prerrequisitos
- Backup DB reciente validado.
- Backup de archivos reciente.
- Acceso a Docker host y variables de entorno.

## Procedimiento rapido (primeros 10 minutos)
1. Congelar cambios:
- detener pipeline/CD del release actual.
2. Identificar version estable previa:
- tag o imagen anterior documentada.
3. Capturar evidencia:
- `docker compose ps`
- `docker compose logs backend --tail=200`
- `docker compose logs postgres --tail=200`
4. Decidir rollback parcial o total:
- parcial: solo backend/frontend.
- total: backend + DB restore + archivos.

## Rollback parcial (sin restore DB)
```bash
# ejemplo stack principal
docker compose down
docker compose up -d
docker compose ps
```

Validar:
```bash
curl -f http://localhost:5000/health
```

## Rollback total (con restore DB + archivos)
1. Detener servicios de app:
```bash
docker compose down
```
2. Levantar stack DB:
```bash
docker compose -f docker-compose.db.yml up -d
```
3. Restaurar base:
```bash
cat storage/backups/database/<backup>.sql | docker exec -i medical-services-postgres \
  psql -U ${POSTGRES_USER:-medical_user} ${POSTGRES_DB:-medical_services_dev}
```
4. Restaurar archivos:
```bash
tar -xzf storage/backups/files/<backup>.tar.gz -C .
```
5. Levantar app:
```bash
docker compose up -d
```
6. Validar salud y login.

## Criterio de exito de rollback
- `GET /health` responde 200 y DB/Redis en `healthy`.
- Login API exitoso.
- Flujos core accesibles (`patients`, `appointments`, `medical-records`).
- No errores criticos repetidos en logs backend durante 10 minutos.

## Escalamiento
- Si rollback falla en 15 minutos:
- escalar a incidente severidad alta.
- activar restauracion en entorno alternativo.
- mantener sistema en modo degradado controlado.

## Post-incidente (obligatorio)
1. Registrar causa raiz y timestamp.
2. Documentar impacto y ventana de afectacion.
3. Actualizar backlog tecnico con acciones correctivas.
4. Revalidar plan de backup/restore.
