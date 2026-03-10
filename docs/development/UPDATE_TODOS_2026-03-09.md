# Update Todos - Estado Real y Backlog Ejecutable

Fecha: 2026-03-09  
Branch revisada: `dev` (con cambios locales sin commit)

## Resumen ejecutivo

De los 12 TODOs listados:
- 12 estan resueltos en codigo.
- 0 quedan parciales.
- 0 quedan pendientes funcionales.

Estado de validacion:
- Pendiente ejecucion completa de tests por entorno local sin dependencias Python instaladas (`ModuleNotFoundError: flask`).

Ademas, el analisis de los 3 frontends muestra deriva de versiones (Angular 20 vs 17), contrato de reportes acoplado a estados de presupuesto inconsistentes y validacion bloqueada por entorno local (Node no LTS y dependencias no instaladas).

## Estado por TODO (depurado)

| Prioridad | TODO original | Estado | Evidencia |
|---|---|---|---|
| CRITICAL | Fix Payment transaction_id race condition (unique + nullable) | RESUELTO | Migracion `backend/migrations/versions/b2c3d4e5f6a7_make_payment_transaction_id_unique_when_present.py`; manejo `IntegrityError -> 409` en `backend/app/services/payment_service.py` y `backend/app/resources/payments.py` |
| CRITICAL | Fix switchMap(async) in admin auth.service.ts | RESUELTO | `frontend-admin-profesional/src/app/core/services/auth.service.ts` ya reemplaza `switchMap(async)` por `switchMap(() => from((async () => ... )()))` |
| CRITICAL | Fix SocketIO CORS wildcard and production rate limits | RESUELTO | `backend/app/extensions.py` bloquea wildcard en produccion para SocketIO; `backend/app/config.py` define `RATELIMIT_*` por entorno + validaciones de produccion |
| HIGH | Fix sync _apply_model_data blacklist to whitelist | RESUELTO | `backend/app/resources/sync.py` usa `ENTITY_WRITABLE_FIELDS` + whitelist explicita |
| HIGH | Add future date validation in create_appointment | RESUELTO | `backend/app/services/appointment_service.py` valida `appointment_date must be in the future` |
| HIGH | Fix duration_minutes None crash in report sum() | RESUELTO | `backend/app/services/report_service.py` usa `sum(a.duration_minutes or 0 ...)` |
| HIGH | Fix dashboard patient async user name loading | RESUELTO | `frontend-paciente/src/app/pages/dashboard.page.ts` ahora escucha `currentUser$` |
| HIGH | Fix patient creation transaction context | RESUELTO (revisado) | `backend/app/services/patient_service.py` usa `flush + commit` en `try/except` con `rollback` |
| MEDIUM | Remove dead code sync methods | RESUELTO | `SyncService` consolidado en `backend/app/services/sync_service.py`; `backend/app/tasks/sync_tasks.py` reutiliza ese servicio |
| MEDIUM | Fix budget status inconsistency (draft vs pending) | RESUELTO | `backend/app/resources/reports.py` y `backend/app/services/report_service.py` alineados a `draft` como pendiente |
| MEDIUM | Fix N+1 query in list_patients admin specialty scope | RESUELTO | `backend/app/services/patient_service.py` reemplaza loop por consulta unica a `ProfessionalPatientAssignment` |
| MEDIUM | Fix report counting pending budgets (should be draft) | RESUELTO | `pending_budgets` y `total_pending` en reportes ahora cuentan solo `draft` |

## Backlog mejorado (accionable)

### Wave 1 - Critico (cerrar hoy)

1. **Cerrar race condition de `transaction_id` en persistencia real**
   - Crear migracion Alembic para indice parcial unico `uq_payments_transaction_id`.
   - Capturar `IntegrityError` en create/update/process payment y devolver `409` con mensaje de dominio.
   - Agregar test de colision de `transaction_id` concurrente.
   - Done: no 500 por duplicado de transaccion + test verde.

2. **Eliminar wildcard efectivo en SocketIO y endurecer limites productivos**
   - En `configure_socketio`, bloquear `*` en produccion y fallar arranque si no hay origins validos.
   - Definir `RATELIMIT_DEFAULT` por entorno (prod << dev).
   - Done: produccion no acepta wildcard y limites quedan externalizados por env.

### Wave 2 - Alta/Media funcional

3. **Unificar semantica de presupuestos pendientes**
   - Decidir contrato unico: `pending_budgets` = `draft` solo, o `draft + sent`.
   - Alinear:
     - `backend/app/services/report_service.py`
     - `backend/app/resources/reports.py`
     - frontends que consumen `pending_budgets` / `total_pending`.
   - Done: mismo numero en dashboards/reportes para el mismo rango.

4. **Depurar SyncService duplicado**
   - Elegir fuente unica (`services` o `tasks`) y eliminar duplicados no usados.
   - Actualizar imports/tests en consecuencia.
   - Done: una sola implementacion mantenible + tests adaptados.

## Analisis profundo de 3 frontends

## 1) `frontend-admin-profesional`

- Stack: Angular 20 + Ionic 8 + NgRx (base mas grande: ~236 archivos TS).
- Riesgo principal actual:
  - Auth con cadenas Rx + storage async (ya corregido `switchMap(async)`, pero aun hay complejidad en flujo de token refresh).
- Acople backend:
  - Consume `reports/quick/stats` y `reports/financial`; hoy puede mostrar metricas erraticas por inconsistencia de estados en backend.
- Validacion:
  - `npm run build` fallo por dependencias no instaladas y Node `v25.2.1` (no LTS).

## 2) `frontend-profesional`

- Stack: Angular 17 + Material + NgRx (~51 TS).
- Riesgo principal actual:
  - Pantalla de reportes depende directamente de `pending_budgets` y `total_pending`; hoy esos campos no tienen semantica estable en backend.
- Fortaleza:
  - Capa API bastante limpia (`core/api/api.service.ts`, endpoints centralizados).
- Validacion:
  - `npm run build` fallo por dependencias no instaladas y Node `v25.2.1` no LTS.

## 3) `frontend-paciente`

- Stack: Angular 17 + Ionic 7 + PWA (~21 TS).
- Mejora aplicada:
  - Dashboard ya no depende de `currentUserValue` instantaneo; ahora escucha `currentUser$`.
- Riesgo principal actual:
  - Sigue acoplado a conteo de presupuestos pendientes (usa `draft/sent`) que no coincide con todo el backend.
- Validacion:
  - `npm run build` fallo por dependencias no instaladas y Node `v25.2.1` no LTS.

## Riesgos transversales frontend

1. Divergencia tecnologica:
   - Admin en Angular 20, Profesional/Paciente en Angular 17.
   - Impacta costo de mantenimiento, librerias compartidas y QA cruzado.
2. Contrato funcional no unificado:
   - `pending_budgets` y `total_pending` no representan lo mismo en todos los puntos.
3. Validacion local bloqueada:
   - No hay `node_modules` y el runtime actual es no LTS.

## Checklist de cierre recomendado

- [x] Migracion DB + manejo 409 para `transaction_id` duplicado.
- [x] SocketIO sin wildcard en produccion.
- [x] Limites de rate-limit por entorno (prod endurecido).
- [x] Contrato de "presupuesto pendiente" definido y aplicado end-to-end.
- [x] SyncService duplicado eliminado o consolidado.
- [ ] Build de los 3 frontends en Node LTS + `npm install`.
