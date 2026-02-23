# Synchronization Strategy (estado real y cierre)

Actualizado: 2026-02-23

## Objetivo
Definir el estado actual de sincronizacion y el plan tecnico para cierre productivo sin ambiguedad documental.

## Implementado actualmente

### Endpoints
- `POST /api/sync/push`
- `GET /api/sync/pull`
- `GET /api/sync/status`
- `GET /api/sync/logs` (admin)

### Comportamiento actual en `push`
- Valida cuerpo JSON y estructura minima por cambio.
- Limita lotes a `500` cambios por request.
- Registra eventos en `sync_logs`.
- Aplica idempotencia por `idempotency_key` o fingerprint del payload.
- Ejecuta handlers por entidad soportada.
- Detecta conflictos por `updated_at`.
- Responde conflictos con politica `server_wins`.

### Entidades soportadas hoy
- `appointment`
- `medical_record`
- `budget`
- `payment`
- `file`

### Comportamiento actual en `pull`
- Entrega cambios por fecha (`since`), con serializacion por modelo.
- Omite aliases plurales para no duplicar resultados.

## Validacion ejecutada
- `backend/tests/test_sync_endpoints.py` y `backend/tests/test_patients.py`
- Resultado 2026-02-23: `42 passed`

## Brechas tecnicas pendientes
- Versionado por registro robusto para merge distribuido.
- Resolucion de conflictos mas granular (no solo timestamp).
- Estrategia de idempotencia multi-nodo.
- Cobertura E2E offline/online en flujos frontend.
- Cobertura sync para mas entidades de dominio segun alcance final.

## Plan de cierre recomendado

### Fase 1 - Contrato y observabilidad
- Congelar contrato de payload de sync.
- Unificar catalogo de errores funcionales.
- Exponer metricas operativas de exito/error por ventana.

### Fase 2 - Versionado y conflictos
- Incorporar campo de version por entidad.
- Definir politicas de conflicto por entidad con trazabilidad.
- Garantizar reintentos idempotentes en escenarios distribuidos.

### Fase 3 - Expansión funcional
- Extender sync a entidades adicionales requeridas por producto.
- Cubrir create/update/delete en pruebas de integracion por entidad.

### Fase 4 - Validacion de release
- Suite E2E de sincronizacion offline/online.
- Pruebas de carga con lotes altos.
- Criterios GO/NO-GO de sync para despliegue productivo.
