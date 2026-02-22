# SEC-03 - Trazabilidad de Export y Sync Logs

Estado: `ready`
Fecha: 2026-02-14

## Problema
Los nuevos campos de `sync_logs` mejoran trazabilidad tecnica, pero falta correlacion estructurada con `audit_logs` para exportes/eventos sensibles.

## Objetivo
Unificar trazabilidad de auditoria entre sync y export.

## Alcance
- Correlation ID entre `sync_logs` y `audit_logs`.
- Registro de export con actor, payload minimo y resultado.
- Enmascarado de datos sensibles en metadata.

## Criterios de aceptacion
- Cada export/sync critico tiene evento de auditoria correlacionable.
- Reporte de cumplimiento puede reconstruir flujo usuario -> accion -> resultado.
- Pruebas de auditoria en escenarios de exito y falla.

## Dependencias
- Definicion de campos minimos de cumplimiento.
- Politica de retencion y acceso de auditoria.

