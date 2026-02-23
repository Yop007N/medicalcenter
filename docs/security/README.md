# Seguridad - Documentacion operativa

Actualizado: 2026-02-23

## Documentos vigentes
- `SECURITY_AUDIT_2026-02-14.md`: auditoria aplicada sobre sync, RBAC, CORS y secretos.
- `SECRET_ROTATION_POLICY.md`: politica de rotacion por entorno.
- `SYNC_LOG_RETENTION_POLICY.md`: retencion y limpieza operativa de `sync_logs`.

## Alcance de esta carpeta
- Solo controles operativos vigentes.
- Planes de roadmap/tareas no se consideran fuente activa de seguridad.

## Controles activos en codigo
- JWT para autenticacion y autorizacion por rol.
- Restriccion de CORS por `CORS_ORIGINS` y validacion estricta en produccion.
- Rate limiting en login y excepciones controladas para endpoints de logs.
- Endurecimiento de `sync/logs` con permisos administrativos.

## Pendientes de cierre recomendados
- Endurecimiento de seguridad en compose productivo (headers, healthchecks y operacion).
- Suite de pruebas de seguridad API para regresion continua.
- Observabilidad de eventos de seguridad y alertas operativas.
