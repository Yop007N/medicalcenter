# FE-CORE-01 - Cierre Frontend Principal

Fecha: 2026-02-15
Estado: `ready`

## Objetivo
Consolidar cierre funcional del frontend principal (`frontend/`) con contratos backend reales y sin mocks residuales en flujos core.

## Alcance de cierre
1. Contratos FE/BE:
- validar payloads paginados y errores normalizados en modulos core.

2. Eliminacion de residuos mock:
- remover hardcodes funcionales en flujos de negocio.

3. Tipado de modelos:
- reducir `any` en rutas de datos criticas de auth/pacientes/citas.

4. Calidad:
- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`

## Criterios de aceptacion
1. Sin hardcodes funcionales en flujos core identificados.
2. Build de `frontend/` en verde.
3. Evidencia registrada en `TRAZABILIDAD_TICKETS.md`.
4. Pendientes de PWA documentados y desacoplados del cierre principal.

## Evidencia ya aplicada para este ticket
- Se reemplazo `professional_id: 1` hardcodeado en `patient-detail` por resolucion desde usuario autenticado / contexto real.
- Se removio `as any` en carga de auth almacenada con validacion tipada de `User`.
- Lint y build ejecutados en `frontend/`.

