# QA-E2E-02 - Offline/Online Sync

Estado: `ready`
Fecha: 2026-02-15

## Problema
Falta un ticket E2E especifico para validar continuidad funcional cuando el cliente pierde conectividad y re-sincroniza.

## Objetivo
Definir casos E2E de sincronizacion offline/online con criterios claros de consistencia.

## Alcance
- Flujo offline:
  - alta/modificacion local de pacientes, turnos y registros.
  - cola local de cambios con orden preservado.
- Flujo reconexion:
  - envio por lotes a `/api/sync/push`.
  - recuperacion por `/api/sync/pull`.
  - registro en `/api/sync/logs` (solo admin).
- Casos de conflicto:
  - `updated_at` mas nuevo en servidor (server wins).
  - replay idempotente por `idempotency_key`.

## Criterios de aceptacion
1. Casos offline y reconexion documentados con resultado esperado.
2. Se valida idempotencia y manejo de conflictos.
3. Se define reporte minimo de evidencia (logs + entidades impactadas).

## Dependencias
- Matriz E2E core (`QA-E2E-CORE-01`) completada.
- Suite de regresion backend core (`QA-REG-CORE-01`) en verde.

