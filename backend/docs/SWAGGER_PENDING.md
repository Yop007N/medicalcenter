# Documentación Swagger - Endpoints Pendientes

## Resumen

Este documento contiene la especificación Swagger/OpenAPI para los endpoints que aún no están documentados en el backend de Medical Services.

---

## Medical Records (5 endpoints)

### GET /api/medical-records
```yaml
tags:
  - Medical Records
security:
  - Bearer: []
parameters:
  - in: query
    name: patient_id
    type: integer
    required: false
    description: Filter by patient ID
  - in: query
    name: professional_id
    type: integer
    required: false
    description: Filter by professional ID
responses:
  200:
    description: Lista de historiales médicos
  401:
    description: No autenticado
```

### GET /api/medical-records/{id}
```yaml
tags:
  - Medical Records
security:
  - Bearer: []
parameters:
  - in: path
    name: id
    type: integer
    required: true
    description: Medical record ID
responses:
  200:
    description: Historial médico encontrado
  404:
    description: Historial no encontrado
  401:
    description: No autenticado
```

### POST /api/medical-records
```yaml
tags:
  - Medical Records
security:
  - Bearer: []
parameters:
  - in: body
    name: body
    required: true
    schema:
      type: object
      required:
        - patient_id
      properties:
        patient_id:
          type: integer
        appointment_id:
          type: integer
        chief_complaint:
          type: string
        symptoms:
          type: string
        diagnosis:
          type: string
        treatment:
          type: string
        prescriptions:
          type: string
        notes:
          type: string
        blood_pressure:
          type: string
        heart_rate:
          type: integer
        temperature:
          type: number
        weight:
          type: number
        height:
          type: number
responses:
  201:
    description: Historial médico creado
  400:
    description: Campos requeridos faltantes
  401:
    description: No autenticado (requiere rol professional)
```

### PUT /api/medical-records/{id}
```yaml
tags:
  - Medical Records
security:
  - Bearer: []
parameters:
  - in: path
    name: id
    type: integer
    required: true
  - in: body
    name: body
    schema:
      type: object
      properties:
        chief_complaint:
          type: string
        diagnosis:
          type: string
        treatment:
          type: string
responses:
  200:
    description: Historial actualizado
  404:
    description: Historial no encontrado
  401:
    description: No autenticado
```

### DELETE /api/medical-records/{id}
```yaml
tags:
  - Medical Records
security:
  - Bearer: []
parameters:
  - in: path
    name: id
    type: integer
    required: true
responses:
  200:
    description: Historial eliminado
  404:
    description: Historial no encontrado
  401:
    description: No autenticado (requiere rol professional)
```

---

## Files (4 endpoints)

### GET /api/files
```yaml
tags:
  - Files
security:
  - Bearer: []
parameters:
  - in: query
    name: patient_id
    type: integer
  - in: query
    name: medical_record_id
    type: integer
responses:
  200:
    description: Lista de archivos médicos
  401:
    description: No autenticado
```

### POST /api/files/upload
```yaml
tags:
  - Files
security:
  - Bearer: []
consumes:
  - multipart/form-data
parameters:
  - in: formData
    name: file
    type: file
    required: true
    description: Archivo médico a subir
  - in: formData
    name: patient_id
    type: integer
    required: true
  - in: formData
    name: medical_record_id
    type: integer
  - in: formData
    name: description
    type: string
responses:
  201:
    description: Archivo subido exitosamente
  400:
    description: Archivo no proporcionado o inválido
  401:
    description: No autenticado
```

### GET /api/files/{id}/download
```yaml
tags:
  - Files
security:
  - Bearer: []
parameters:
  - in: path
    name: id
    type: integer
    required: true
responses:
  200:
    description: Archivo descargado
    content:
      application/octet-stream:
        schema:
          type: string
          format: binary
  404:
    description: Archivo no encontrado
  401:
    description: No autenticado
```

### DELETE /api/files/{id}
```yaml
tags:
  - Files
security:
  - Bearer: []
parameters:
  - in: path
    name: id
    type: integer
    required: true
responses:
  200:
    description: Archivo eliminado
  404:
    description: Archivo no encontrado
  401:
    description: No autenticado
```

---

## Budgets (6 endpoints)

### GET /api/budgets
```yaml
tags:
  - Budgets
security:
  - Bearer: []
parameters:
  - in: query
    name: patient_id
    type: integer
  - in: query
    name: status
    type: string
    enum: [draft, sent, accepted, rejected, expired]
responses:
  200:
    description: Lista de presupuestos
  401:
    description: No autenticado
```

### GET /api/budgets/{id}
```yaml
tags:
  - Budgets
security:
  - Bearer: []
parameters:
  - in: path
    name: id
    type: integer
    required: true
responses:
  200:
    description: Presupuesto encontrado
  404:
    description: Presupuesto no encontrado
  401:
    description: No autenticado
```

### POST /api/budgets
```yaml
tags:
  - Budgets
security:
  - Bearer: []
parameters:
  - in: body
    name: body
    required: true
    schema:
      type: object
      required:
        - patient_id
        - total_amount
      properties:
        patient_id:
          type: integer
        total_amount:
          type: number
          format: float
        description:
          type: string
        items:
          type: array
          items:
            type: object
            properties:
              description:
                type: string
              quantity:
                type: integer
              unit_price:
                type: number
        valid_until:
          type: string
          format: date
responses:
  201:
    description: Presupuesto creado
  400:
    description: Campos requeridos faltantes
  401:
    description: No autenticado
```

### PUT /api/budgets/{id}
```yaml
tags:
  - Budgets
security:
  - Bearer: []
parameters:
  - in: path
    name: id
    type: integer
    required: true
  - in: body
    name: body
    schema:
      type: object
      properties:
        total_amount:
          type: number
        description:
          type: string
        status:
          type: string
          enum: [draft, sent, accepted, rejected, expired]
responses:
  200:
    description: Presupuesto actualizado
  404:
    description: Presupuesto no encontrado
  401:
    description: No autenticado
```

### DELETE /api/budgets/{id}
```yaml
tags:
  - Budgets
security:
  - Bearer: []
parameters:
  - in: path
    name: id
    type: integer
    required: true
responses:
  200:
    description: Presupuesto eliminado
  404:
    description: Presupuesto no encontrado
  401:
    description: No autenticado
```

### POST /api/budgets/{id}/send
```yaml
tags:
  - Budgets
security:
  - Bearer: []
parameters:
  - in: path
    name: id
    type: integer
    required: true
responses:
  200:
    description: Presupuesto enviado al paciente
  404:
    description: Presupuesto no encontrado
  401:
    description: No autenticado
```

---

## Payments (5 endpoints)

### GET /api/payments
```yaml
tags:
  - Payments
security:
  - Bearer: []
parameters:
  - in: query
    name: budget_id
    type: integer
  - in: query
    name: status
    type: string
    enum: [pending, completed, failed, refunded]
  - in: query
    name: payment_method
    type: string
    enum: [cash, card, transfer, insurance]
responses:
  200:
    description: Lista de pagos
  401:
    description: No autenticado
```

### GET /api/payments/{id}
```yaml
tags:
  - Payments
security:
  - Bearer: []
parameters:
  - in: path
    name: id
    type: integer
    required: true
responses:
  200:
    description: Pago encontrado
  404:
    description: Pago no encontrado
  401:
    description: No autenticado
```

### POST /api/payments
```yaml
tags:
  - Payments
security:
  - Bearer: []
parameters:
  - in: body
    name: body
    required: true
    schema:
      type: object
      required:
        - budget_id
        - amount
        - payment_method
      properties:
        budget_id:
          type: integer
        amount:
          type: number
          format: float
        payment_method:
          type: string
          enum: [cash, card, transfer, insurance]
        transaction_id:
          type: string
        notes:
          type: string
responses:
  201:
    description: Pago registrado
  400:
    description: Campos requeridos faltantes
  401:
    description: No autenticado
```

### PUT /api/payments/{id}
```yaml
tags:
  - Payments
security:
  - Bearer: []
parameters:
  - in: path
    name: id
    type: integer
    required: true
  - in: body
    name: body
    schema:
      type: object
      properties:
        status:
          type: string
          enum: [pending, completed, failed, refunded]
        notes:
          type: string
responses:
  200:
    description: Pago actualizado
  404:
    description: Pago no encontrado
  401:
    description: No autenticado
```

### POST /api/payments/{id}/process
```yaml
tags:
  - Payments
security:
  - Bearer: []
parameters:
  - in: path
    name: id
    type: integer
    required: true
responses:
  200:
    description: Pago procesado exitosamente
  404:
    description: Pago no encontrado
  400:
    description: Pago ya procesado o inválido
  401:
    description: No autenticado
```

---

## Dashboard (3 endpoints)

### GET /api/dashboard/overview
```yaml
tags:
  - Dashboard
security:
  - Bearer: []
responses:
  200:
    description: Vista general del sistema
    schema:
      type: object
      properties:
        total_patients:
          type: integer
        total_appointments_today:
          type: integer
        total_revenue_month:
          type: number
        pending_budgets:
          type: integer
  401:
    description: No autenticado
```

### GET /api/dashboard/stats
```yaml
tags:
  - Dashboard
security:
  - Bearer: []
parameters:
  - in: query
    name: period
    type: string
    enum: [today, week, month, year]
    default: month
responses:
  200:
    description: Estadísticas del sistema
  401:
    description: No autenticado
```

### GET /api/dashboard/activity
```yaml
tags:
  - Dashboard
security:
  - Bearer: []
parameters:
  - in: query
    name: limit
    type: integer
    default: 20
responses:
  200:
    description: Actividad reciente del sistema
  401:
    description: No autenticado
```

---

## Reports (7 endpoints)

### GET /api/reports/medical/patient/{id}
```yaml
tags:
  - Reports
security:
  - Bearer: []
parameters:
  - in: path
    name: id
    type: integer
    required: true
    description: Patient ID
  - in: query
    name: start_date
    type: string
    format: date
  - in: query
    name: end_date
    type: string
    format: date
responses:
  200:
    description: Historial médico completo del paciente
  404:
    description: Paciente no encontrado
  401:
    description: No autenticado
```

### GET /api/reports/medical/professional/{id}
```yaml
tags:
  - Reports
security:
  - Bearer: []
parameters:
  - in: path
    name: id
    type: integer
    required: true
    description: Professional ID
  - in: query
    name: start_date
    type: string
    format: date
  - in: query
    name: end_date
    type: string
    format: date
responses:
  200:
    description: Reporte de actividad del profesional
  404:
    description: Profesional no encontrado
  401:
    description: No autenticado
```

### GET /api/reports/financial/revenue
```yaml
tags:
  - Reports
security:
  - Bearer: []
parameters:
  - in: query
    name: start_date
    type: string
    format: date
  - in: query
    name: end_date
    type: string
    format: date
  - in: query
    name: payment_method
    type: string
    enum: [cash, card, transfer, insurance]
responses:
  200:
    description: Reporte de ingresos
  401:
    description: No autenticado (requiere rol admin)
```

### GET /api/reports/financial/budgets
```yaml
tags:
  - Reports
security:
  - Bearer: []
parameters:
  - in: query
    name: status
    type: string
    enum: [draft, sent, accepted, rejected, expired]
  - in: query
    name: start_date
    type: string
    format: date
  - in: query
    name: end_date
    type: string
    format: date
responses:
  200:
    description: Reporte de presupuestos
  401:
    description: No autenticado (requiere rol admin)
```

### GET /api/reports/appointments
```yaml
tags:
  - Reports
security:
  - Bearer: []
parameters:
  - in: query
    name: professional_id
    type: integer
  - in: query
    name: patient_id
    type: integer
  - in: query
    name: status
    type: string
    enum: [scheduled, confirmed, cancelled, completed, no_show]
  - in: query
    name: start_date
    type: string
    format: date
  - in: query
    name: end_date
    type: string
    format: date
responses:
  200:
    description: Reporte de turnos
  401:
    description: No autenticado
```

### GET /api/reports/quick/monthly
```yaml
tags:
  - Reports
security:
  - Bearer: []
parameters:
  - in: query
    name: year
    type: integer
  - in: query
    name: month
    type: integer
responses:
  200:
    description: Resumen mensual (turnos + ingresos + presupuestos)
  401:
    description: No autenticado (requiere rol admin)
```

### GET /api/reports/quick/weekly
```yaml
tags:
  - Reports
security:
  - Bearer: []
responses:
  200:
    description: Resumen semanal
  401:
    description: No autenticado
```

---

## Implementación

Para agregar esta documentación al código, se debe:

1. Importar `from flasgger import swag_from` en cada archivo de recursos
2. Agregar el decorador `@swag_from()` o incluir el docstring con formato YAML en cada función
3. Alternativamente, crear archivos `.yml` separados en `docs/swagger/` y referenciarlos

**Ejemplo:**
```python
@blueprint.route('', methods=['GET'])
@jwt_required()
def list_medical_records():
    """List medical records with optional filters.
    ---
    tags:
      - Medical Records
    security:
      - Bearer: []
    parameters:
      - in: query
        name: patient_id
        type: integer
    responses:
      200:
        description: Lista de historiales médicos
    """
    # ... código existente
```

---

## Estado Actual

- ✅ Authentication: 3/3 endpoints documentados
- ✅ Users: 5/5 endpoints documentados  
- ✅ Professionals: 6/6 endpoints documentados
- ✅ Patients: 5/5 endpoints documentados
- ✅ Appointments: 6/6 endpoints documentados
- ⏳ Medical Records: 0/5 endpoints (especificación lista)
- ⏳ Files: 0/4 endpoints (especificación lista)
- ⏳ Budgets: 0/6 endpoints (especificación lista)
- ⏳ Payments: 0/5 endpoints (especificación lista)
- ⏳ Dashboard: 0/3 endpoints (especificación lista)
- ⏳ Reports: 0/7 endpoints (especificación lista)

**Total documentado:** 25/61 endpoints (41%)
**Pendiente:** 36 endpoints con especificación completa en este documento
