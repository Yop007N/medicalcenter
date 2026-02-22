# Arranque Fase 2 - Tickets Priorizados

Fecha: 2026-02-15
Estado: `ready`

## Objetivo de fase
Completar paridad funcional del frontend principal y cerrar paquete de salida funcional.

## Entrada de fase
- Fase 1 cerrada con evidencia tecnica (`FASE1_CIERRE_EVIDENCIA.md`).
- QA/backend/deploy/security en estado estable.

## Priorizacion de tickets (orden de ejecucion)
1. `T033` - Reducir mocks residuales en frontend principal.
2. `T034` - Corregir mapeo de modelos TypeScript core.
3. `T038` - Auditar estado real de frontend-pwa.
4. `T039` - Definir alcance minimo PWA fase release.
5. `T040` - Preparar ticket FE-CORE-01 para cierre completo.

## Criterio de exito de fase
1. Frontend principal sin mocks residuales en flujos core.
2. Contratos FE/BE consistentes en runtime (payloads y errores).
3. Alcance PWA explicitado y desacoplado de bloqueantes del release.
4. Ticket FE-CORE-01 listo para cierre de release funcional.

## Cadencia operativa recomendada
- Ejecutar cada ticket con ciclo:
  - implementacion,
  - `npm --prefix frontend run lint`,
  - `npm --prefix frontend run build`,
  - smoke manual del flujo afectado.

## Riesgos de fase
- Divergencia entre `frontend/`, `frontend-web/` y `frontend-pwa`.
- Regresiones de contratos al quitar mocks.
- Deuda de UX en estados de error de modulo.

## Mitigaciones
- Priorizar `frontend/` como cliente de release.
- Validar contratos con endpoints backend reales antes de cerrar cada ticket.
- Mantener reporte QA diario para backend mientras avanza frontend.

