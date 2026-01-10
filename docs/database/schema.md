# Medical Services - Database Schema

## Diagrama de Entidad-Relación

```
┌─────────────────┐
│     users       │ (Tabla base - Herencia)
├─────────────────┤
│ PK id           │
│    email        │ (UNIQUE)
│    password_hash│
│    first_name   │
│    last_name    │
│    role         │ (admin, professional, patient)
│    is_active    │
│    user_type    │ (polymorphic)
│    created_at   │
│    updated_at   │
└─────────────────┘
         △
         │ (Herencia)
    ┌────┴────┐
    │         │
┌───▼──────┐  │
│professionals│  │
├──────────┤  │
│PK/FK id  │  │
│ license_number│ (UNIQUE)
│ specialty│  │
│ phone    │  │
│ address  │  │
└──────────┘  │
              │
         ┌────▼─────┐
         │ patients │
         ├──────────┤
         │PK/FK id  │
         │date_of_birth│
         │phone     │
         │address   │
         │emergency_contact│
         │emergency_phone│
         │blood_type│
         │allergies │
         │medical_history│
         └──────────┘


┌─────────────────┐       ┌──────────────────┐
│  appointments   │       │ medical_records  │
├─────────────────┤       ├──────────────────┤
│ PK id           │       │ PK id            │
│ FK patient_id   │───┐   │ FK patient_id    │───┐
│ FK professional_id│─┐│   │ FK professional_id│─┐│
│ appointment_date│ ││   │ FK appointment_id│ ││
│ duration_minutes│ ││   │ record_date      │ ││
│ status          │ ││   │ chief_complaint  │ ││
│ appointment_type│ ││   │ symptoms         │ ││
│ reason          │ ││   │ diagnosis        │ ││
│ notes           │ ││   │ treatment        │ ││
│ reminder_sent   │ ││   │ prescriptions    │ ││
│ created_at      │ ││   │ notes            │ ││
│ updated_at      │ ││   │ blood_pressure   │ ││
└─────────────────┘ ││   │ heart_rate       │ ││
                    ││   │ temperature      │ ││
                    ││   │ weight           │ ││
                    ││   │ height           │ ││
                    ││   │ created_at       │ ││
                    ││   │ updated_at       │ ││
                    ││   └──────────────────┘ ││
                    ││            │            ││
                    ││            │            ││
                    ││   ┌────────▼────────┐  ││
                    ││   │     files       │  ││
                    ││   ├─────────────────┤  ││
                    ││   │ PK id           │  ││
                    ││   │ FK medical_record_id│
                    ││   │ filename        │  ││
                    ││   │ file_type       │  ││
                    ││   │ mime_type       │  ││
                    ││   │ file_size       │  ││
                    ││   │ storage_type    │  ││
                    ││   │ file_path       │  ││
                    ││   │ thumbnail_path  │  ││
                    ││   │ description     │  ││
                    ││   │ FK uploaded_by  │  ││
                    ││   │ created_at      │  ││
                    ││   └─────────────────┘  ││
                    ││                         ││
                    │└─────────────────────────┘│
                    └───────────────────────────┘


┌─────────────────┐       ┌──────────────────┐
│    budgets      │       │    payments      │
├─────────────────┤       ├──────────────────┤
│ PK id           │       │ PK id            │
│ FK patient_id   │───┐   │ FK budget_id     │───┐
│ FK created_by   │   │   │ amount           │   │
│ title           │   │   │ currency         │   │
│ description     │   │   │ payment_method   │   │
│ total_amount    │   │   │ payment_status   │   │
│ currency        │   │   │ transaction_id   │   │
│ status          │   │   │ payment_date     │   │
│ valid_until     │   │   │ notes            │   │
│ items (JSON)    │   │   │ created_at       │   │
│ created_at      │   │   │ updated_at       │   │
│ updated_at      │   │   └──────────────────┘   │
└─────────────────┘   │                           │
                      └───────────────────────────┘


┌─────────────────┐
│   sync_logs     │
├─────────────────┤
│ PK id           │
│ entity_type     │
│ entity_id       │
│ operation       │
│ direction       │
│ status          │
│ error_message   │
│ retry_count     │
│ created_at      │
│ completed_at    │
└─────────────────┘
```

## Tablas Principales

### 1. users (Tabla base)
- **Propósito**: Tabla base para todos los usuarios del sistema
- **Tipo**: Herencia de tabla única con columna discriminadora
- **Índices**: email (UNIQUE)

### 2. professionals
- **Propósito**: Profesionales de la salud
- **Hereda de**: users
- **Índices**: license_number (UNIQUE)
- **Relaciones**:
  - appointments (1:N)
  - medical_records (1:N)

### 3. patients
- **Propósito**: Pacientes del sistema
- **Hereda de**: users
- **Relaciones**:
  - appointments (1:N)
  - medical_records (1:N)
  - budgets (1:N)

### 4. appointments
- **Propósito**: Gestión de turnos médicos
- **Relaciones**:
  - patient (N:1)
  - professional (N:1)
  - medical_record (1:1)
- **Índices**: appointment_date

### 5. medical_records
- **Propósito**: Fichas médicas de consultas
- **Relaciones**:
  - patient (N:1)
  - professional (N:1)
  - appointment (1:1) - Opcional
  - files (1:N)

### 6. files
- **Propósito**: Archivos médicos (estudios, imágenes, etc.)
- **Relaciones**:
  - medical_record (N:1)
  - uploaded_by → users (N:1)

### 7. budgets
- **Propósito**: Presupuestos de tratamientos
- **Relaciones**:
  - patient (N:1)
  - created_by → professionals (N:1)
  - payments (1:N)

### 8. payments
- **Propósito**: Pagos de presupuestos
- **Relaciones**:
  - budget (N:1) - Opcional

### 9. sync_logs
- **Propósito**: Logs de sincronización nube-local
- **Sin relaciones directas**

## Constraints y Validaciones

### Check Constraints
- `users.role IN ('admin', 'professional', 'patient')`
- `appointments.status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')`
- `budgets.status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')`
- `payments.payment_status IN ('pending', 'completed', 'failed', 'refunded')`
- `files.storage_type IN ('cloud', 'local')`
- `sync_logs.direction IN ('cloud_to_local', 'local_to_cloud')`

### Unique Constraints
- `users.email`
- `professionals.license_number`
- `payments.transaction_id` (cuando no es NULL)

### Foreign Keys
Todas las relaciones tienen FK con `ON DELETE` apropiado:
- `CASCADE`: Cuando se elimina el padre, eliminar hijos (ej: user → appointments)
- `SET NULL`: Cuando se elimina el padre, setear NULL (ej: appointment → medical_record)
- `RESTRICT`: Prevenir eliminación si hay referencias

## Índices para Performance

```sql
-- Índices de búsqueda frecuente
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_professionals_specialty ON professionals(specialty);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_medical_records_date ON medical_records(record_date);
CREATE INDEX idx_sync_logs_status ON sync_logs(status);

-- Índices compuestos
CREATE INDEX idx_appointments_prof_date ON appointments(professional_id, appointment_date);
CREATE INDEX idx_medical_records_patient ON medical_records(patient_id, record_date);
```

## Triggers Potenciales

1. **update_timestamp**: Actualizar `updated_at` automáticamente
2. **validate_appointment_conflict**: Prevenir conflictos de horarios
3. **sync_log_creation**: Crear log cuando se modifica una entidad sincronizable

## Volumetría Estimada

- **users**: ~1,000-10,000 registros
- **professionals**: ~100-1,000 registros
- **patients**: ~5,000-50,000 registros
- **appointments**: ~50,000-500,000 registros/año
- **medical_records**: ~50,000-500,000 registros/año
- **files**: ~100,000-1,000,000 registros
- **budgets**: ~10,000-100,000 registros/año
- **payments**: ~10,000-100,000 registros/año
- **sync_logs**: ~100,000-1,000,000 registros (con limpieza periódica)

## Estrategia de Backup

1. **Backup completo**: Diario a las 2 AM
2. **Backup incremental**: Cada 6 horas
3. **Retención**: 30 días de backups diarios, 12 meses de backups mensuales
4. **Archivos**: Backup a S3/DigitalOcean Spaces con versionado
