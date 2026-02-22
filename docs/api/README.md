# Medical Services API - Referencia Operativa

Actualizado: 2026-02-14

## Base URL
- Desarrollo: `http://localhost:5000/api`

## Autenticacion
- JWT Bearer en `Authorization: Bearer <token>`
- Publicos principales: `POST /api/auth/login`, `POST /api/auth/register`

## Modulos de endpoints (prefijos)
- `auth`: `/api/auth/*`
- `users`: `/api/users/*`
- `professionals`: `/api/professionals/*`
- `patients`: `/api/patients/*`
- `appointments`: `/api/appointments/*`
- `medical-records`: `/api/medical-records/*`
- `files`: `/api/files/*`
- `budgets`: `/api/budgets/*`
- `payments`: `/api/payments/*`
- `sync`: `/api/sync/*`
- `dashboard`: `/api/dashboard/*`
- `audit`: `/api/audit/*`
- `reports`: `/api/reports/*`
- `odontograms`: `/api/odontograms/*`
- `dental-treatments`: `/api/dental-treatments/*`
- `psychology`: `/api/psychology/*`
- `psychopedagogy`: `/api/psychopedagogy/*`
- `clinical-history`: `/api/clinical-history/*`
- `logs`: `/api/logs/*`

## Salud del servicio
- `GET /health`

## Codigo fuente de referencia
- Blueprints: `backend/app/resources/`
- Registro de blueprints: `backend/app/__init__.py`

## Notas
- Sync:
  - `POST /api/sync/push` valida JSON objeto y limita `changes` a `500`.
  - `POST /api/sync/push` expone mensaje generico en errores internos y preserva detalle en logs de servidor.
  - `GET /api/sync/logs` valida `limit` entero en rango `1..500` y requiere rol `admin`.
- Users:
  - `GET /api/users`, `POST /api/users`, `DELETE /api/users/{id}` requieren rol `admin`.
  - `GET/PUT /api/users/{id}`: `admin` o usuario propietario (`self`).
- CORS:
  - `CORS_ORIGINS` se parsea desde variables de entorno.
  - En `production` es obligatorio definir `CORS_ORIGINS`.
- Medical records:
  - `GET /api/medical-records` y `GET /api/medical-records/{id}` incluyen resumen anidado de `patient` y `professional`.
- El contrato detallado por endpoint debe mantenerse desde los recursos Flask y sus pruebas.
- Si hay diferencia entre este documento y el codigo, prevalece el codigo.
