# SEC-06 - Monitoreo de Eventos de Seguridad

Estado: `ready`
Fecha: 2026-02-14

## Problema
No existe catalogo formal de eventos de seguridad ni umbrales de alerta operativa.

## Objetivo
Definir monitoreo minimo de eventos de seguridad para deteccion temprana.

## Alcance
- Eventos:
- login fallido repetido,
- intentos `403` en endpoints admin,
- picos de `429`,
- errores internos en sync,
- cambios de secretos y configuracion.
- Alertas:
- umbrales por minuto/hora,
- notificacion a canal operativo.

## Criterios de aceptacion
- Catalogo de eventos y severidad documentado.
- Dashboard/consulta operativa disponible.
- Runbook de respuesta a incidente asociado.

## Dependencias
- Instrumentacion de logs estructurados.
- Integracion con stack de observabilidad.

