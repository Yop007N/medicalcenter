# Medical Services - Database Schema (estado real)

Actualizado: 2026-03-01

## Fuente de verdad
- Modelos SQLAlchemy en `backend/app/models/`
- Migraciones en `backend/migrations/`

## Inventario actual
- Total: 27 tablas de negocio

### 1) Identidad y asignacion
- `users`
- `professionals`
- `patients`
- `professional_patient_assignments` (relacion profesional-paciente por especialidad)

### 2) Operacion clinica core
- `appointments`
- `medical_records`
- `files`
- `budgets`
- `payments`
- `sync_logs`
- `audit_logs`
- `specialty_encounters`

### 3) Odontologia
- `odontograms`
- `teeth`
- `dental_treatments`

### 4) Psicologia
- `psychological_evaluations`
- `therapy_sessions`

### 5) Psicopedagogia
- `psychopedagogical_evaluations`
- `intervention_sessions`

### 6) Historia clinica odontologica
- `evolutions`
- `anamnesis`
- `periodontal_records`
- `patient_documents`
- `prescriptions`
- `clinical_documents`
- `informed_consents`
- `clinical_history_events`

## Relaciones principales
- `professionals.id` -> `users.id`
- `patients.id` -> `users.id`
- `professional_patient_assignments.professional_id` -> `professionals.id`
- `professional_patient_assignments.patient_id` -> `patients.id`
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
- `specialty_encounters.patient_id` -> `patients.id`
- `specialty_encounters.professional_id` -> `professionals.id`

## Indices y restricciones clave
- `appointments`: `idx_professional_date`, `idx_patient_date`, `idx_status_date`
- `medical_records`: `idx_patient_record_date`, `idx_professional_record_date`
- `audit_logs`: indices por usuario/entidad/accion/timestamp
- Restricciones unicas:
  - `users.email`
  - `professionals.license_number`
  - `payments.transaction_id`
  - `teeth(odontogram_id, tooth_number)`
  - `periodontal_records(patient_id, measurement_date, tooth_number)`
  - `anamnesis.patient_id`

## Notas de alineacion
- `files.storage_type` mantiene default `cloud`, pero el flujo actual persiste archivos en `storage/files`.
- El scope clinico por especialidad usa `specialty_key` en asignaciones y encuentros.
- Para decisiones de diseño, prevalece el codigo en `backend/app/models/`.
