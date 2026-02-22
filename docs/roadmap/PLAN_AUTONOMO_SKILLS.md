# Plan Autonomo de Desarrollo con Skills

Actualizado: 2026-02-15

## Objetivo
Ejecutar el cierre del proyecto en modo autonomo, usando skills especializados por capa y una orquestacion unica de extremo a extremo.

## Skills y responsabilidad
- `medical-services-fullstack-orchestrator`: define plan por ticket, ordena el trabajo por capas y valida cierre end-to-end.
- `medical-services-backend-specialist`: implementa API, modelos, servicios, validaciones y tests backend.
- `medical-services-frontend-specialist`: implementa UI/flujo y alinea contratos frontend-backend.
- `medical-services-deploy-specialist`: ejecuta y valida despliegue local/prod, healthchecks, logs y rollback.

## Ciclo autonomo por ticket
1. Triage (Orchestrator)
- Definir alcance, impacto y criterio de exito.
- Clasificar ticket: `backend`, `frontend`, `deploy` o `cross-stack`.
- Crear plan corto (3-6 pasos) con checkpoints verificables.

2. Implementacion por skill
- Si es `backend`: ejecutar con `medical-services-backend-specialist`.
- Si es `frontend`: ejecutar con `medical-services-frontend-specialist`.
- Si es `deploy`: ejecutar con `medical-services-deploy-specialist`.
- Si es `cross-stack`: dividir en sub-tareas y resolver en orden datos -> API -> UI -> deploy.

3. Validacion tecnica
- Backend: tests del modulo y smoke API.
- Frontend: build y prueba del flujo afectado.
- Deploy: compose up, health endpoint y logs sin errores criticos.

4. Cierre de ticket
- Actualizar docs minimas afectadas (api/schema/arquitectura/roadmap).
- Registrar resultado: completado, bloqueado o requiere decision.
- Preparar siguiente ticket automaticamente segun prioridad.

## Operacion diaria automatizada
- Politica operativa vigente: `docs/roadmap/OPERACION_AUTONOMA_DIARIA.md`.
- Herramienta CLI: `tools/autonomy/cli.py`.
- Comandos base:
```bash
backend/.venv311/Scripts/python -m tools.autonomy.cli snapshot
backend/.venv311/Scripts/python -m tools.autonomy.cli qa-report --run-tests
backend/.venv311/Scripts/python -m tools.autonomy.cli close-macros --macros T068 T091 T092 T093 T094
```
- Resultado esperado:
- contexto compacto para reducir lectura/token por corrida,
- priorizacion objetiva por carril e impacto,
- reporte QA diario y KPI semanales con evidencia.

## Backlog autonomo (orden sugerido)
### Fase 1 - Cierre de Sync Core (Prioridad Alta)
- Reemplazar handlers simplificados de sync por handlers reales por entidad.
- Cerrar politica de conflictos e idempotencia.
- Cubrir con tests de integracion.

### Fase 2 - Paridad Frontend de Release (Prioridad Alta)
- Tomar `frontend/` como cliente principal de release.
- Cerrar flujos core: auth, patients, appointments, medical-records, files, budgets, payments.
- Dejar `frontend-web` y `frontend-pwa` con alcance explicito y backlog separado.

### Fase 3 - Hardening de Deploy (Prioridad Alta)
- Estandarizar compose/env para desarrollo y produccion.
- Validar backup/restore y runbook de incidentes.
- Definir checklist de salida a release candidate.

### Fase 4 - Modulos de expansion (Prioridad Media)
- Cobertura/seguro (autorizaciones, copagos, trazabilidad).
- Comunicacion con paciente (recordatorios y confirmaciones).
- Agenda avanzada por reglas de profesional/sede.

## Ejecucion actual
- Estado: operacion autonoma continua con cierre tecnico de Fase 1 documentado y foco activo en pendientes frontend.
- Orden de skills aplicado en esta corrida: `medical-services-fullstack-orchestrator` -> `medical-services-backend-specialist` -> `medical-services-frontend-specialist` (deploy sin cambios de infraestructura en esta iteracion).
- Ticket completado: `SYNC-01` (handlers reales en `/api/sync/push` + mejora de `/api/sync/pull` + pruebas de endpoints).
- Ticket completado: `SYNC-02` (idempotencia por `idempotency_key`/fingerprint + conflicto `server_wins` por `updated_at`).
- Ticket completado: `SYNC-03-SPEC-01` (definicion tecnica de versionado por entidad en `docs/roadmap/SYNC-03_VERSIONADO_POR_ENTIDAD.md`).
- Ticket completado: `QA-SMOKE-API-01` (smoke backend auth/patients/appointments en verde).
- Ticket completado: `FE-LINT-BUILD-01` (lint sin errores + build frontend principal en verde).
- Ticket completado: `FE-BE-APT-01` (frontend appointments adaptado a contrato backend real).
- Ticket completado: `FE-BE-FILE-01` (listado/upload files alineado con contrato frontend principal).
- Ticket completado: `FE-BE-RPT-01` (endpoints de reports frontend-compatibles + contrato unificado).
- Ticket completado: `FE-BE-PAT-01` (patients list/detail y formularios alineados con payload backend real).
- Ticket completado: `FE-BE-PRO-01` (professionals list/detail y formularios alineados con payload backend real).
- Ticket completado: `FE-BE-BUDPAY-01` (normalizacion de contratos budgets/payments, aliases frontend y validacion list/detail/create/update).
- Ticket completado: `FE-BE-MR-01` (medical-records list/detail/form alineados con backend, payload robusto y datos anidados patient/professional).
- Ticket completado: `SEC-SYNC-INPUT-01` (validaciones de entrada en `/api/sync/push` y `/api/sync/logs` + pruebas negativas).
- Ticket completado: `SEC-SYNC-ERR-01` (sanitizacion de errores internos de sync en respuestas API, manteniendo detalle en logs).
- Ticket completado: `DOC-ARCH-01` (arquitectura y estrategia sync alineadas con estado real y pendiente SYNC-03).
- Ticket completado: `DEPLOY-AUDIT-01` (auditoria compose + variables root en `.env.compose.example`).
- Ticket completado: `FE-CORE-STATE-01` (states loading/error/empty completados en flujos core pendientes de appointments, incluyendo calendario).
- Ticket completado: `FE-RBAC-01` (RBAC aplicado en rutas protegidas y menu filtrado por rol para evitar accesos y enlaces muertos).
- Ticket completado: `AUTONOMY-OPS-01` (CLI modular para snapshot compacto, priorizacion/bloqueos, KPI y reporte QA diario).
- Ticket completado: `SEC-GOV-01` (RBAC administrativo backend, hardening CORS, auditoria de secretos, retencion de sync_logs y tickets SEC-01..SEC-06).
- Paralelismo operativo: ejecutar en lotes por carriles (`backend`, `frontend`, `deploy`, `qa`, `docs`) para mantener throughput alto sin romper consistencia.
- Tablero activo: `docs/roadmap/TABLERO_100_TAREAS_AUTONOMO.md`.
- Tablero de expansion paralela: `docs/roadmap/TABLERO_1000_TAREAS_AUTONOMO.md` (10 microtareas por tarea macro).
- Avance tablero actual: consultar `docs/roadmap/TABLERO_100_TAREAS_AUTONOMO.md` (fuente viva, evitar conteos estaticos en este documento).
- Tablero de continuidad: `docs/roadmap/TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md` y `docs/roadmap/TABLERO_FASE_SIGUIENTE_1000_TAREAS_AUTONOMO.md`.

## Reglas de autonomia
- No abrir modulo nuevo si hay deuda critica abierta en sync, paridad o deploy.
- No marcar tarea como cerrada sin evidencia tecnica minima.
- En bloqueos de producto/negocio, detener y escalar decision al usuario.

## Evidencia minima por ticket
- Resumen de cambios por archivo.
- Resultado de validacion (tests/build/health).
- Riesgos residuales y siguiente paso recomendado.

## KPI de avance
- `% tickets core cerrados` por fase.
- `% flujos core validados end-to-end`.
- `tasa de regresion` (fallos reabiertos).
- `lead time` promedio por ticket.

## Cadencia recomendada
- Diario: ciclo autonomo de 1-3 tickets pequenos o 1 ticket cross-stack.
- Semanal: revision de KPIs + re-priorizacion de backlog.
- Hito de release: cuando Fase 1-3 queden en verde con evidencia.
