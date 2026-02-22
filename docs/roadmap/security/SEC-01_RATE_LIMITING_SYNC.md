# SEC-01 - Rate Limiting en Sync

Estado: `ready`
Fecha: 2026-02-14

## Problema
Los endpoints de sync (`/api/sync/push`, `/api/sync/pull`, `/api/sync/status`, `/api/sync/logs`) no tienen limites por endpoint/usuario para escenarios de abuso o replay masivo.

## Objetivo
Aplicar rate limiting granular sin romper sincronizacion legitima.

## Alcance
- Limites por endpoint y por identidad (IP + user_id).
- Respuesta consistente `429`.
- Exenciones acotadas para tareas internas.

## Criterios de aceptacion
- `push/pull/logs/status` devuelven `429` al exceder cupos.
- Limites configurables por entorno.
- Pruebas automatizadas de umbral y recuperacion.

## Dependencias
- Redis estable en entorno de ejecucion.
- Definicion de cuotas por producto.

