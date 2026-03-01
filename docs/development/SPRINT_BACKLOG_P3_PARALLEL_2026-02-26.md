# Sprint Backlog P3 - Paralelo

Actualizado: 2026-02-26 (iteracion 1 en progreso)

## Objetivo
Cerrar brechas funcionales grandes de producto en paralelo para los 3 frontends y backend, evitando hardcodeo, duplicacion de logica y regresiones.

## Ejecucion continua por olas
- orquestador operativo: `scripts/orchestration/wave_orchestrator.py`
- guia: `docs/development/WAVE_EXECUTION_AUTONOMA.md`

## Alcance de este lote (grande)
- `frontend-admin-profesional`: paridad funcional real por especialidad (no plantilla generica).
- `frontend-profesional`: experiencia de profesional por especialidad y pacientes asignados.
- `frontend-paciente`: agenda inteligente por disponibilidad real + historia clinica por especialidad.
- `backend`: reglas de asignacion profesional-paciente-especialidad, agenda y datos clinicos filtrados por dominio.
- `qa/release`: cobertura E2E profunda por actor y regresion cruzada.

## Regla de ejecucion en paralelo
1. Track A/B/C implementan UI y flujos.
2. Track D desbloquea contratos/servicios transversales.
3. Track E valida cada entregable antes de marcar `DONE`.
4. No se inicia un sub-item sin endpoint/contrato definido.

---

## Track A - Frontend Admin/Profesional (Angular/Ionic principal)

### A1. Especialidades con modulo propio real (sin `specialty-module` generico)
- Estado: `IN_PROGRESS`
- Entregable:
  - flujo propio por especialidad con componentes/servicios dedicados.
  - cards/tabla/timeline clinico especifico por area (ej: cardiologia, traumatologia, endocrinologia).
- Criterio de cierre:
  - cada especialidad navega a su modulo dedicado y no a plantilla comun.
  - sin hardcodeo de bloques clinicos en runtime.

### A2. Segmentacion de historiales por especialidad
- Estado: `IN_PROGRESS`
- Entregable:
  - vistas de historial, citas y documentos filtradas por especialidad activa.
- Criterio de cierre:
  - en `/cardiology` solo datos clinicos de cardiologia del paciente.
  - tests de filtro por especialidad en verde.

### A3. UX transversal: paleta, modales y componentes unificados
- Estado: `PENDING`
- Entregable:
  - un solo set de tokens de color/tipografia/estados.
  - reemplazo de modales nativos por modal estandar del sistema.
- Criterio de cierre:
  - no quedan modales browser `alert/prompt/confirm` en modulos clinicos.
  - chequeo visual consistente en dashboard/patients/appointments/files/budgets/payments.

### A4. Archivos por paciente con navegacion contextual
- Estado: `IN_PROGRESS`
- Entregable:
  - listado de archivos solo del paciente seleccionado.
  - desde `patients/:id` abrir `files` con filtro preaplicado y boton volver funcional.
- Criterio de cierre:
  - sin paciente seleccionado no se renderiza listado.
  - con paciente seleccionado solo se listan sus documentos.

---

## Track B - Frontend Profesional (web profesional puro)

### B1. Workspace por profesional autenticado
- Estado: `IN_PROGRESS`
- Entregable:
  - el profesional solo ve pacientes asignados a su usuario/especialidad.
  - menu/rutas segun permisos y especialidad.
- Criterio de cierre:
  - login `doctor` no puede ver universo completo del sanatorio.
  - filtros de API por `professional_id`/`specialty` aplicados extremo a extremo.

### B2. Alta operativa de paciente con credenciales
- Estado: `DONE`
- Entregable:
  - crear paciente con credenciales validas y asignacion inicial a profesional.
- Criterio de cierre:
  - flujo create -> login paciente -> visualizacion de sus datos funciona sin pasos manuales.

### B3. Flujos por especialidad en profesional web
- Estado: `IN_PROGRESS`
- Entregable:
  - vistas clinicas por especialidad del profesional (sin panel generalista plano).
- Criterio de cierre:
  - cada rol/especialidad tiene UI operativa minima para consulta, evolucion y plan.

### B4. E2E profundo profesional
- Estado: `PENDING`
- Entregable:
  - suite Playwright CRUD real para patients/appointments/medical-records/files/budgets/payments.
- Criterio de cierre:
  - pipeline `chromium` verde con evidencia y capturas por modulo.

---

## Track C - Frontend Paciente (PWA Ionic)

### C1. Agenda inteligente por disponibilidad real
- Estado: `IN_PROGRESS`
- Entregable:
  - busqueda por especialidad + profesional + slot mas cercano libre.
  - sugerencias de proximas fechas disponibles.
- Criterio de cierre:
  - no se permite reservar slot ocupado.
  - lista ordenada por cercania de fecha/hora real.

### C2. Historia clinica enriquecida por especialidad
- Estado: `IN_PROGRESS`
- Entregable:
  - timeline por especialidad.
  - odontograma visible para paciente (solo lectura) y documentos clinicos asociados.
- Criterio de cierre:
  - paciente ve sus registros reales por area, no solo resumen global.

### C3. UX/UI paciente premium (mobile-first)
- Estado: `PENDING`
- Entregable:
  - refinamiento completo de layout, jerarquia visual, estados vacios, feedback de acciones.
- Criterio de cierre:
  - score UX aceptable en mobile y desktop (sin saturacion de colores ni modales nativos).

### C4. E2E profundo paciente
- Estado: `PENDING`
- Entregable:
  - Playwright con escenarios de turnos, cancelaciones, historial, consentimientos y perfil.
- Criterio de cierre:
  - suite verde contra IP de despliegue.

---

## Track D - Backend y datos (transversal)

### D1. Modelo de asignacion profesional-paciente-especialidad
- Estado: `IN_PROGRESS`
- Entregable:
  - entidades/servicios para asignacion explicita.
  - filtros server-side por actor y especialidad.
- Criterio de cierre:
  - todas las consultas clinicas sensibles salen filtradas por asignacion real.

### D2. Motor de disponibilidad de agenda
- Estado: `IN_PROGRESS`
- Entregable:
  - endpoint de slots disponibles por profesional/especialidad/rango.
  - bloqueo de doble reserva con validacion transaccional.
- Criterio de cierre:
  - zero double-booking en tests de concurrencia basicos.

### D3. Historial clinico especializado por dominio
- Estado: `IN_PROGRESS`
- Entregable:
  - endpoints de timeline/documentos/resumen por especialidad.
  - contrato estable para frontend admin/profesional/paciente.
- Criterio de cierre:
  - tests de integracion por especialidad en verde.

### D4. Seed realista no hardcodeado
- Estado: `PENDING`
- Entregable:
  - script reproducible para poblar profesionales, pacientes, asignaciones, citas y registros.
- Criterio de cierre:
  - entorno nuevo queda utilizable con datos demo consistentes por area clinica.

---

## Track E - QA, observabilidad y release

### E1. Matriz E2E por actor y por especialidad
- Estado: `PENDING`
- Entregable:
  - matriz de casos `admin/profesional/paciente` con evidencia automatizada.
- Criterio de cierre:
  - smoke + CRUD profundo + flujos transversales en verde.

### E2. Contratos API y anti-regresion
- Estado: `PENDING`
- Entregable:
  - validaciones de contrato para endpoints compartidos.
- Criterio de cierre:
  - cambios incompatibles rompen CI de forma temprana.

### E3. Checklist release + rollback por lote
- Estado: `PENDING`
- Entregable:
  - checklist actualizado por track y plan de rollback por modulo.
- Criterio de cierre:
  - deploy verificable por actor en IP y rollback documentado.

---

## Orden recomendado de ejecucion (iteraciones)
1. **Iteracion 1 (fundacion):** D1 + D2 + A4 + B1 + C1.
2. **Iteracion 2 (especialidades):** A1 + A2 + B3 + C2 + D3.
3. **Iteracion 3 (calidad y cierre):** A3 + C3 + B4 + C4 + E1/E2/E3 + D4.

## Definicion de terminado (DoD)
- codigo mergeable por modulo.
- build del frontend/servicio afectado en verde.
- pruebas unitarias/integracion del dominio afectado en verde.
- E2E del actor impactado en verde.
- documentacion de uso y evidencia actualizada.

## Avance Iteracion 1 (2026-02-26)
- D1 backend:
  - `professional_patient_assignments` ahora soporta `specialty_key` (migracion + backfill).
  - filtros por `specialty_key` habilitados en `GET /api/patients` y `GET /api/medical-records`.
  - asignacion inicial de paciente desde profesional persiste `specialty_key`.
- D2 backend:
  - validacion anti double-booking por rango horario (`duration_minutes`) en create/update/check availability.
  - lock transaccional por profesional en reservas (`FOR UPDATE`) antes de validar conflicto.
  - slots disponibles calculados contra rangos ocupados reales (no solo fecha exacta).
- B1 frontend-profesional:
  - `patients.page` consume `specialty_key` derivado de especialidad del profesional autenticado.
- A4 frontend-admin:
  - `/files` ya limpia listado cuando no hay `patient_id` seleccionado en query.
- A1 frontend-admin:
  - navegación por especialidades consolidada sin hardcode repetitivo:
    - factoría `buildSpecialtyHomeRoutes(...)` para 21 módulos.
    - redirect legacy `specialties/:specialtyKey` hacia ruta canónica.
    - configuración única de ruta/icono en `core/constants/specialty-navigation.ts`.
- Evidencia tecnica:
  - `docker compose exec -T backend pytest -q tests/test_patients.py tests/test_appointments.py tests/test_professionals.py tests/test_medical_records.py` -> `92 passed`.
  - `docker compose exec -T backend pytest -q tests/test_patients.py` -> `29 passed` (incluye create paciente -> login con credenciales nuevas).
  - `docker compose exec -T backend pytest -q tests/test_auth.py` -> `28 passed`.
  - `npm --prefix frontend-profesional run build` -> `PASS`.
  - `npm --prefix frontend-admin-profesional run build` -> `PASS`.
  - `npm --prefix frontend-paciente run build` -> `PASS`.
  - `cd frontend-profesional && BASE_URL=http://127.0.0.1 LD_LIBRARY_PATH=$HOME/.local/playwright-deps/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH npm run e2e:chromium` -> `3 passed`.
  - `cd frontend-paciente && BASE_URL=http://127.0.0.1:8100 LD_LIBRARY_PATH=$HOME/.local/playwright-deps/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH npm run e2e:chromium` -> `3 passed`.
  - `cd frontend-admin-profesional && BASE_URL=http://127.0.0.1:4200 LD_LIBRARY_PATH=$HOME/.local/playwright-deps/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH npm run e2e:critical` -> `5 passed`.
