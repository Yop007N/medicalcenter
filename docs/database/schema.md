# Medical Services - Database Schema (Estado real)

Actualizado: 2026-02-14

## Fuente de verdad
- Modelos SQLAlchemy en `backend/app/models/`
- Migraciones en `backend/migrations/`

Este documento reemplaza la version anterior simplificada de 9 tablas.

## Inventario actual
- Total: 25 tablas de negocio

### 1) Identidad
- `users`: usuario base (email unico, rol, user_type)
- `professionals`: extension de `users` para profesionales
- `patients`: extension de `users` para pacientes

### 2) Operacion clinica core
- `appointments`: turnos
- `medical_records`: fichas medicas
- `files`: archivos vinculados a ficha
- `budgets`: presupuestos
- `payments`: pagos
- `sync_logs`: trazas de sincronizacion
- `audit_logs`: trazas de auditoria

### 3) Odontologia
- `odontograms`: cabecera de odontograma
- `teeth`: detalle por pieza dental
- `dental_treatments`: tratamientos dentales

### 4) Psicologia
- `psychological_evaluations`: evaluacion psicologica
- `therapy_sessions`: sesiones terapeuticas

### 5) Psicopedagogia
- `psychopedagogical_evaluations`: evaluacion psicopedagogica
- `intervention_sessions`: sesiones de intervencion

### 6) Historia clinica odontologica
- `evolutions`: evoluciones
- `anamnesis`: anamnesis (1 por paciente)
- `periodontal_records`: periodontograma por pieza/fecha
- `patient_documents`: documentos de paciente
- `prescriptions`: recetas
- `clinical_documents`: documentos clinicos
- `informed_consents`: consentimientos informados
- `clinical_history_events`: eventos timeline

## Relaciones principales
- `professionals.id` -> `users.id`
- `patients.id` -> `users.id`
- `appointments.patient_id` -> `patients.id`
- `appointments.professional_id` -> `professionals.id`
- `medical_records.patient_id` -> `patients.id`
- `medical_records.professional_id` -> `professionals.id`
- `medical_records.appointment_id` -> `appointments.id`
- `files.medical_record_id` -> `medical_records.id`
- `files.uploaded_by` -> `users.id`
- `budgets.patient_id` -> `patients.id`
- `budgets.created_by` -> `users.id`
- `payments.budget_id` -> `budgets.id`

Relaciones de especialidad:
- Odontologia: `odontograms`, `teeth`, `dental_treatments`
- Psicologia: `psychological_evaluations`, `therapy_sessions`
- Psicopedagogia: `psychopedagogical_evaluations`, `intervention_sessions`
- Historia clinica: `evolutions`, `anamnesis`, `periodontal_records`, `patient_documents`, `prescriptions`, `clinical_documents`, `informed_consents`, `clinical_history_events`

## Indices declarados en modelos
- `appointments`: `idx_professional_date`, `idx_patient_date`, `idx_status_date`
- `medical_records`: `idx_patient_record_date`, `idx_professional_record_date`
- `audit_logs`: `idx_audit_user_timestamp`, `idx_audit_entity`, `idx_audit_action_timestamp`, `idx_audit_timestamp`

## Constraints relevantes declarados
- Unicos:
  - `users.email`
  - `professionals.license_number`
  - `payments.transaction_id`
  - `teeth(odontogram_id, tooth_number)`
  - `periodontal_records(patient_id, measurement_date, tooth_number)`
  - `anamnesis.patient_id`

## Notas de alineacion
- El modelo `files.storage_type` mantiene default `cloud`, pero los endpoints y servicios actuales guardan en almacenamiento local (`storage/files`).
- La estrategia de sincronizacion tiene endpoints funcionales, pero la aplicacion por entidad todavia esta simplificada (ver `docs/architecture/sync-strategy.md`).

## Sync Logs (detalle relevante)
`sync_logs` incluye campos para trazabilidad de idempotencia y conflictos:
- `idempotency_key`
- `external_entity_ref`
- `result_entity_id`
- `conflict_payload`

## Recomendacion operativa
Para dudas de consistencia entre documentacion y codigo, tomar como autoridad el codigo en `backend/app/models/`.
