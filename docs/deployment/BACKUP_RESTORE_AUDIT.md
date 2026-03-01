# Auditoria Backup/Restore Operativa

Actualizado: 2026-03-01

## Alcance auditado
- `backend/app/tasks/backup_tasks.py`
- `backend/tests/test_backups.py`
- `docker-compose.yml`
- `docker-compose.db.yml`
- `docker-compose.prod.yml`

## Estado actual
- Backup de base de datos implementado via `pg_dump` en `backup_database_task`.
- Backup de archivos implementado via ZIP en `backup_files_task`.
- Rotacion implementada (`MAX_BACKUPS=7`) con `cleanup_old_backups_task`.
- Consulta de estado implementada con `get_backup_status_task`.
- Restore no esta automatizado como task dedicada: se ejecuta por procedimiento operativo.

## Evidencia tecnica
- Codigo de backup:
- `backend/app/tasks/backup_tasks.py`
- Cobertura de pruebas:
- `backend/tests/test_backups.py`
- Estructura de salida local:
- `storage/backups/database`
- `storage/backups/files`

## Riesgos detectados
1. `pg_dump` ausente genera backup mock en desarrollo:
- util para pruebas, pero no valido para DR real.
2. No existe task de restore transaccional:
- recovery depende de ejecucion manual con runbook.
3. Backups locales en mismo host:
- sin offsite no hay proteccion ante falla total de nodo.
4. Falta validacion automatica de restore:
- no hay prueba periodica de restauracion completa.

## Procedimiento operativo recomendado
### Backup DB manual (contenedor postgres en compose)
```bash
docker compose exec -T postgres \
  pg_dump -U ${POSTGRES_USER:-postgres} ${POSTGRES_DB:-medical_services_dev} \
  > storage/backups/database/manual_$(date +%Y%m%d_%H%M%S).sql
```

### Restore DB manual
```bash
cat storage/backups/database/<backup>.sql | docker compose exec -T postgres \
  psql -U ${POSTGRES_USER:-postgres} ${POSTGRES_DB:-medical_services_dev}
```

### Backup de archivos
```bash
tar -czf storage/backups/files/files_$(date +%Y%m%d_%H%M%S).tar.gz storage/files
```

### Restore de archivos
```bash
tar -xzf storage/backups/files/<backup>.tar.gz -C .
```

## Checklist minimo de restore (validacion)
1. Restaurar DB en entorno aislado.
2. Restaurar `storage/files`.
3. Levantar backend y validar `GET /health`.
4. Ejecutar login API.
5. Validar entidades core (`patients`, `appointments`, `medical-records`).

## Acciones de mejora propuestas
1. Crear task `restore_database_task` y `restore_files_task` con guardrails.
2. Publicar backup offsite (S3/objeto equivalente) cifrado.
3. Programar prueba mensual de restore de punta a punta.
4. Incorporar hash/verificacion de integridad post-backup.
