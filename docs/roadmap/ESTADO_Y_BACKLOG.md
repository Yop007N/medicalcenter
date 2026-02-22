# Estado y Backlog Priorizado

Actualizado: 2026-02-14

## 1) Estado actual resumido
- Backend: muchos modulos implementados y estructurados.
- Frontend principal (`frontend/`): el mas avanzado y candidato natural para cierre MVP.
- Frontend appointments: contrato de listado/cancelacion/completado alineado con backend en efectos NgRx.
- Frontend patients/professionals: list/detail/form alineados con backend (payloads y aliases de campos).
- Frontend medical-records: list/detail/form alineados con backend y datos anidados de paciente/profesional.
- Frontend budgets/payments: contratos list/detail/create/update alineados con backend (`T029`, `T030`).
- Frontend estados UX core: loading/error/empty cubiertos en flujos pendientes de appointments (lista + calendario) (`T031`).
- Frontend RBAC: rutas protegidas con `roleGuard` y menu principal filtrado por rol (`T032`).
- Archivos: endpoint `GET /api/files` y upload con alias frontend (`category`/`patient_id`) alineados.
- Reports: endpoints frontend (`/medical`, `/financial`, `/quick/stats`, `/export`) ya disponibles y validados.
- Frontend web (`frontend-web`): base funcional, varias pantallas aun sin integracion real.
- Frontend PWA (`frontend-pwa`): base inicial.
- Frontend PWA auditado: alcance minimo de release definido y desacoplado del cierre del frontend principal.
- Sync: avance activo. `SYNC-01` y `SYNC-02` completados; `SYNC-03` ya definido en ticket tecnico (`docs/roadmap/SYNC-03_VERSIONADO_POR_ENTIDAD.md`) para cierre de versionado distribuido.
- Seguridad: RBAC administrativo endurecido (`users` + `sync/logs`), CORS por entorno endurecido, secretos en compose DB parametrizados, y retencion operativa de `sync_logs` implementada; pendientes de fase siguiente documentados en `docs/roadmap/security/SEC-01..SEC-06`.
- QA: smoke backend (`auth`, `patients`, `appointments`) y suite sync en verde.
- QA: suite de regresion backend core y tickets QA (`QA-E2E-CORE-01`, `QA-LOAD-01`, `QA-E2E-02`) preparados para fase siguiente.
- Deploy: auditoria compose completada con brechas documentadas en `docs/deployment/COMPOSE_AUDIT.md`; tickets `DEPLOY-02..DEPLOY-04` preparados en `docs/roadmap/deploy/`.
- Release/docs-product: cierre de fase 1, arranque de fase 2, resumen ejecutivo y handover formalizados en `docs/roadmap/release/`.
- Operacion autonoma: tablero historico completado (`100/100`) y tablero de continuidad habilitado en `TABLERO_FASE_SIGUIENTE_100_TAREAS_AUTONOMO.md`.

## 2) Correcciones de alineacion (prioridad alta)
### A1. Documentacion vs codigo
- Mantener `docs/database/schema.md`, `docs/architecture/*` y `docs/ALCANCE_SISTEMA_GENERAL.md` como fuente vigente.
- Evitar documentos antiguos que contradigan estado real.

### A2. Storage de archivos
- Unificar decision: local-first o S3-first.
- Ajustar default/modelo/config para que no haya semantica mixta (`cloud` vs `local`).

### A3. Sync productivo
- Completar versionado distribuido por entidad y merge granular por campo.
- Extender idempotencia para escenarios multi-nodo y reintentos masivos.

### A4. Paridad frontend-backend
- Elegir frontend de cierre (recomendado: `frontend/`).
- Cerrar brechas en `frontend-web` y `frontend-pwa` segun alcance final.

## 3) Modulos sugeridos para agregar o formalizar
### Prioridad media (valor alto)
- Modulo de cobertura/seguro: planes, autorizaciones, copagos, trazabilidad por prestacion.
- Modulo de comunicacion con paciente: recordatorios, confirmaciones, cancelaciones, plantillas.
- Modulo de agenda avanzada: bloques, sobreturnos controlados, reglas por profesional/sede.
- Modulo de firma y documentos: firma de recetas/consentimientos y versionado documental.

### Prioridad media/baja
- Modulo de teleconsulta: agenda remota, consentimiento, registro de sesion.
- Modulo BI/indicadores: tableros operativos y clinicos con KPI de negocio.
- Integraciones externas graduales: pagos, facturacion, interoperabilidad (FHIR/HL7 por etapas).

## 4) Plan de cierre recomendado
### Fase 1 (2-3 semanas)
- Cerrar alineacion documental.
- Definir frontend objetivo de release.
- Congelar contrato API para core.

### Fase 2 (3-5 semanas)
- Cerrar sync core (patients/appointments/medical_records/files).
- Completar flujos end-to-end en frontend objetivo.
- Endurecer seguridad y auditoria.

### Fase 3 (2-4 semanas)
- Hardening de despliegue (backup/restore, monitoreo, alertas).
- Pruebas de regresion y smoke productivo.
- Checklist de release y handover operativo.

## 5) Decision ejecutiva sugerida
Para "terminar el proyecto" rapido y con menor riesgo:
1. Tomar `frontend/` como cliente principal de release.
2. Tratar `frontend-web` y `frontend-pwa` como lineas secundarias hasta completar core.
3. Cerrar sync + despliegue + observabilidad antes de abrir nuevos modulos grandes.
