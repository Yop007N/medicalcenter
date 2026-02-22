# SEC-05 - Checklist de Seguridad Pre-Release

Estado: `ready`
Fecha: 2026-02-14

## Objetivo
Definir checklist obligatorio antes de liberar release candidate.

## Checklist minimo
- Secretos rotados y validados por entorno.
- CORS restringido a dominios esperados.
- Endpoints administrativos con RBAC validado.
- Healthcheck y logs sin errores criticos de seguridad.
- Backups y rollback probados.
- Evidencia de pruebas de seguridad API adjunta.

## Criterios de aceptacion
- Checklist firmado por responsable tecnico.
- Evidencia publicada en roadmap/traceabilidad.
- Bloqueo de release si falta item critico.

## Dependencias
- Tickets SEC-01..SEC-04 en estado compatible.

