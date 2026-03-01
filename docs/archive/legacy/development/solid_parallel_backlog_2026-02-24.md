# SOLID Parallel Backlog - 2026-02-24

## Estado rapido (hecho hoy)
- Frontend profesional: `appointments` completado a flujo operativo completo con API (`listar`, `crear`, `editar`, `confirmar`, `cancelar` + filtros por `patient_id/status`).
- Frontend profesional: `budgets` completado a flujo operativo CRUD con API (`listar`, `crear`, `editar`, `eliminar`, `enviar` + filtros por `patient_id/status`).
- Frontend profesional: `dashboard` migrado a consumo API real (`overview` + `recent activity`).
- Frontend profesional: `patients` migrado a listado real con filtro por busqueda.
- Frontend profesional: `professionals` migrado a listado real con filtro por especialidad.
- Frontend profesional: `medical-records` migrado a listado real con filtro por `patient_id`.
- Frontend profesional: `files` implementado end-to-end para UC-MS-009/RF-013 (`listar`, `filtrar`, `subir`, `descargar`, `eliminar`).
- Frontend profesional: refactor SOLID en capa API para colecciones (`collection-response.util.ts`) y normalizacion de query params en `ApiService`.
- Frontend profesional: `odontology` implementado end-to-end (`odontogramas`, `dientes FDI`, `tratamientos` con estados `in_progress/completed/cancelled`).
- Frontend admin/profesional: `psychology` y `psychopedagogy` activados en modo operativo (evaluaciones + sesiones) con rutas sin placeholders.
- Frontend admin/profesional: contratos API de salud mental corregidos a endpoints reales (`evaluations/patient|professional`, `sessions` paginadas).
- Frontend paciente: `my-appointments` extendido con filtros operativos y cancelacion de turnos.
- Backend: tests de workflow integral implementados en `backend/tests/integration/test_workflows.py`.
- BD compose: estado Alembic reconciliado (`alembic_version=63f140c09d89`) + script operativo `scripts/db/reconcile_alembic_state.sh`.
- Backend: `sync_service` sin TODOs, con transiciones persistidas en `SyncLog` y pruebas nuevas.
- Backend: `notification_service` con proveedores configurables para SMS/Push (`log`, `disabled`) y pruebas nuevas.
- Backend: `clinical_history` en progreso SOLID, con `evolutions` movido a `backend/app/services/clinical_history_service.py`.
- Backend: `clinical_history` extendido a servicio para `anamnesis`, `periodontal` y `prescriptions`.
- Backend: `clinical_history` completado en capa servicio para `documents`, `clinical-docs`, `consents`, `timeline` y `summary`.
- Backend: `odontograms` migrado a `backend/app/services/odontogram_service.py`.
- Backend: `psychology` migrado a `backend/app/services/psychology_service.py`.
- Backend: `psychopedagogy` migrado a `backend/app/services/psychopedagogy_service.py`.
- Backend: `logs` migrado a `backend/app/services/logs_service.py` y recurso reducido a capa HTTP.
- QA backend: regresion focal en verde (`57 passed`) para clinical history + odontology + psychology.
- Backend: `dashboard` y `reports` normalizados a payload de error `msg` con helper compartido.
- QA backend: `test_dashboard.py` + `test_reports.py` en verde (`60 passed`).
- Backend: `psychopedagogy/users/logs/sync` normalizados con helper de errores compartido.
- QA backend: `test_users.py` + `test_sync_endpoints.py` + `test_logs_frontend.py` en verde (`49 passed`).
- QA backend: `test_logs_frontend.py` en verde (`7 passed`) post refactor SOLID de logs.
- QA backend: `test_files.py` en verde (`19 passed`) tras integracion de modulo files en frontend profesional.
- QA backend: `test_odontology.py` en verde (`18 passed`) tras integracion de modulo odontology en frontend profesional.
- QA frontend: `frontend-admin-profesional` build en verde tras activacion operativa de salud mental.
- QA frontend: `frontend-paciente` build en verde tras operaciones de turnos.
- Backend P3 D1 en progreso: asignacion profesional-paciente ahora soporta `specialty_key` con migracion Alembic + backfill.
- Backend P3 D2 en progreso: anti double-booking por rango horario (`duration_minutes`) con lock transaccional por profesional.
- Frontend profesional P3 B1 en progreso: `patients` consume filtro `specialty_key` derivado del profesional autenticado.
- Frontend admin P3 A4 en progreso: `/files` limpia listado cuando no existe `patient_id` seleccionado.

## Pendientes por frontend (actor profesional web)
- Validar E2E funcional especifico de vistas (interaccion UI) para:
  - `frontend-profesional/src/app/pages/dashboard.page.ts`
  - `frontend-profesional/src/app/pages/patients.page.ts`
  - `frontend-profesional/src/app/pages/professionals.page.ts`
  - `frontend-profesional/src/app/pages/medical-records.page.ts`

## Pendientes backend (migracion SOLID)
- Revisar `auth/logout` para pasar de placeholder a flujo con revocacion/token blacklist cuando se habilite estrategia de sesiones.

## Estado migraciones de BD
- `alembic heads`: `f0e1d2c3b4a5`.
- `alembic_version` en compose: `f0e1d2c3b4a5`.
- Comando operativo: `npm run db:reconcile-alembic`.

## Cola paralela recomendada (siguiente ola)
1. Frontend profesional: QA E2E real (Playwright) para vistas `dashboard/patients/professionals/medical-records/files`.
2. Frontend/paciente: QA E2E real para `my-history`, `my-appointments` y `my-budgets` con backend en IP de despliegue.
3. Operacion DB: ejecutar `db:reconcile-alembic` al inicio de cada despliegue de entorno nuevo.

## Nueva ola paralela P3 (2026-02-26)
Referencia principal: `docs/development/SPRINT_BACKLOG_P3_PARALLEL_2026-02-26.md`.

### Lane A (frontend-admin-profesional)
1. Reemplazar uso operativo de `specialty-module` por modulos clinicos dedicados por especialidad.
2. Aplicar segmentacion real de historiales/documentos/citas por especialidad activa.
3. Normalizar UI transversal (tokens de color, modales, estados vacios y feedback).
4. Consolidar archivos por paciente con navegacion contextual (`patients/:id -> files?patient_id=:id`).

### Lane B (frontend-profesional)
1. Forzar workspace por profesional (solo pacientes asignados y rutas segun especialidad).
2. Consolidar alta de paciente con credenciales y asignacion inicial automatica.
3. Profundizar modulo por especialidad (consulta/evolucion/plan por dominio).
4. Completar E2E profundo CRUD por modulo.

### Lane C (frontend-paciente)
1. Agenda inteligente por slots reales libres y proximidad temporal.
2. Historia por especialidad (incluye odontograma lectura paciente y timeline especializado).
3. Refinamiento UX mobile-first para salida publica.
4. E2E profundo por journeys de paciente.

### Lane D (backend/transversal)
1. Endurecer asignacion profesional-paciente-especialidad en servicios de acceso.
2. Motor de disponibilidad y validacion anti double-booking.
3. Endpoints especializados de timeline/documentos por dominio clinico.
4. Seeds reproducibles con dataset clinico realista por especialidad.

### Lane E (QA/release)
1. Matriz E2E por actor/especialidad.
2. Contract tests para endpoints compartidos.
3. Checklist release + rollback por lane.
