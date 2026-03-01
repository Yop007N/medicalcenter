# Seguridad - Documentacion operativa

Actualizado: 2026-03-01

## Documentos vigentes
- `SECURITY_AUDIT_2026-02-14.md`: auditoria aplicada sobre sync, RBAC, CORS y secretos.
- `SECRET_ROTATION_POLICY.md`: politica de rotacion por entorno.
- `SYNC_LOG_RETENTION_POLICY.md`: retencion y limpieza operativa de `sync_logs`.

## Alcance de esta carpeta
- Solo controles operativos vigentes.
- Planes de roadmap/tareas no se consideran fuente activa de seguridad.

## Controles activos en codigo
- JWT para autenticacion y autorizacion por rol.
- Revocacion de token en `POST /api/auth/logout` con blocklist.
- Restriccion de CORS por `CORS_ORIGINS` y validacion estricta en produccion.
- Rate limiting en login y excepciones controladas para endpoints de logs.
- Endurecimiento de `sync/logs` con permisos administrativos.
- Scope de acceso clinico por `specialty_key` en modulos sensibles (`patients`, `medical-records`, `files`, `budgets`, `payments`, `specialties`).

## Pendientes de cierre recomendados
- Suite de pruebas de seguridad API para regresion continua.
- Politica de cabeceras HTTP de seguridad unificada en todos los frontends/proxy.
- Observabilidad y alertas de eventos de seguridad (intentos fallidos, abuso, anomalias de acceso).
