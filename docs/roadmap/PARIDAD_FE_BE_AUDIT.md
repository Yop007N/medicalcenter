# Auditoria Paridad Frontend/Backend

Actualizado: 2026-02-14

## Frontend objetivo
- Cliente principal: `frontend/`

## Resultado rapido
- Lint `frontend/`: OK sin errores (`1 warning` residual en `tooth-action-modal.component.ts`).
- Build `frontend/`: OK (warnings de imports Ionic no usados en varios componentes).
- Build `frontend-web/`: OK.
- Build `frontend-pwa/`: OK (warnings de stencil/css selectors).

## Matriz de paridad (frontend principal)
| Modulo UI | Ruta UI | Prefijo API backend | Estado |
| --- | --- | --- | --- |
| Auth | `/auth/*` | `/api/auth/*` | alineado |
| Patients | `/patients/*` | `/api/patients/*` | alineado base |
| Professionals | `/professionals/*` | `/api/professionals/*` | alineado base |
| Appointments | `/appointments/*` | `/api/appointments/*` | alineado base |
| Medical Records | `/medical-records/*` | `/api/medical-records/*` | alineado base |
| Budgets | `/budgets/*` | `/api/budgets/*` | alineado base |
| Payments | `/payments/*` | `/api/payments/*` | alineado base |
| Files | `/files/*` | `/api/files/*` | alineado base |
| Odontology | `/odontology/*` | `/api/odontograms/*`, `/api/dental-treatments/*`, `/api/clinical-history/*` | parcial avanzado |
| Psychology | `/psychology/*` | `/api/psychology/*` | parcial |
| Psychopedagogy | `/psychopedagogy/*` | `/api/psychopedagogy/*` | parcial |
| Reports | `/reports/*` | `/api/reports/*` | alineado base |
| Audit | `/audit/*` | `/api/audit/*` | parcial |

## Brechas concretas detectadas (contratos)
1. `reports export`:
- El endpoint generico `/reports/{type}/export` ya existe, pero hoy devuelve CSV para todos los formatos solicitados (incluido `pdf`/`excel`).
2. `warning tecnico`:
- Persiste warning de estilo (`NG8113`) en varios componentes Ionic por imports no usados.

## Priorizacion inmediata de cierre
1. `FE-RPT-EXPORT-02` (media): generar export real por formato (`pdf`/`excel`) o normalizar frontend a `csv`.
2. `FE-WARN-01` (media): reducir warning `NG8113` para mejorar senal de calidad.
3. `FE-CORE-UX-01` (media): consolidar estados `loading/error/empty` en todos los flujos core (`T031`).

## Cierres aplicados en esta corrida
- `appointments.effects.ts`: adaptado a contrato backend real:
  - carga de listado tolera respuesta paginada (`items`) o array.
  - cancelar/completar cita usa `PUT /appointments/{id}` con `status` en lugar de endpoints inexistentes.
- `backend/app/resources/patients.py` + `frontend/src/app/store/patients/patients.effects.ts`:
  - soporte `q`/`search` en listado y payload frontend-compatible (`is_active`, `notes`, `insurance_*`, `document_*`, `gender`).
  - update robusto de `date_of_birth` y soporte `is_active`.
- `backend/app/resources/professionals.py` + `frontend/src/app/store/professionals/professionals.effects.ts`:
  - alias `office_address` <-> `address` y campos frontend (`working_hours`, `consultation_fee`, `bio`, `is_active`).
  - create/update profesional alineados con formulario (password/license_number obligatorios en alta).
- `backend/app/resources/files.py`: agregado `GET /api/files` con filtro `patient_id`.
- `backend/app/resources/files.py`: upload ahora acepta alias frontend `category` y fallback por `patient_id`.
- `backend/app/resources/reports.py`: agregados endpoints frontend-compatibles:
  - `GET /api/reports/medical`
  - `GET /api/reports/financial`
  - `GET /api/reports/quick/stats`
  - `GET /api/reports/{report_type}/export`
  - normalizacion de payload en `GET /api/reports/appointments`.
- `backend/app/resources/budgets.py` + `frontend/src/app/store/budgets/budgets.effects.ts`:
  - soporte list/detail/create/update con `currency`, `valid_until`, `status`, `total_paid/payments_count` y payload paginado (`items`) o array.
- `backend/app/resources/payments.py` + `frontend/src/app/store/payments/payments.effects.ts`:
  - soporte `transaction_reference` alias de `transaction_id`, `payment_date` ISO y normalizacion de payload paginado (`items`) o array.
- `backend/app/schemas/medical_record_schema.py` + `frontend/src/app/store/medical-records/medical-records.effects.ts`:
  - payload con `patient/professional` anidados para list/detail.
  - normalizacion frontend para respuestas `array` o paginadas (`items`) y defaults de `record_date/files`.
- `frontend/src/app/features/medical-records/medical-record-form/medical-record-form.page.ts`:
  - carga de pacientes robusta para contrato `array` o paginado.
