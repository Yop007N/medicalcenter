# Configuracion de Base de Datos

Actualizado: 2026-03-01

## Objetivo
Levantar PostgreSQL para desarrollo, validar conexion y dejar esquema/migraciones consistentes.

## Opcion A: DB dedicada (compose DB)

```bash
cd /home/cfernanv/workspace/pro/empresas/medical-services
docker compose -f docker-compose.db.yml up -d
docker compose -f docker-compose.db.yml ps
```

Servicios:
- PostgreSQL: `localhost:5433`
- pgAdmin: `http://localhost:5050`

Credenciales default (`docker-compose.db.yml`):
- DB: `medical_services_dev`
- User: `medical_user`
- Password: `change-me-db`

Verificacion:
```bash
docker compose -f docker-compose.db.yml exec -T postgres \
  psql -U medical_user -d medical_services_dev -c "SELECT 1;"
```

## Opcion B: DB dentro del stack principal

```bash
cd /home/cfernanv/workspace/pro/empresas/medical-services
docker compose up -d postgres
docker compose ps postgres
```

Credenciales default (`docker-compose.yml`):
- DB: `medical_services_dev`
- User: `postgres`
- Password: `postgres`

Verificacion:
```bash
docker compose exec -T postgres \
  psql -U postgres -d medical_services_dev -c "SELECT 1;"
```

## Configurar backend

En `backend/.env`:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/medical_services_dev
REDIS_URL=redis://localhost:6379/0
```

## Inicializar esquema

```bash
cd /home/cfernanv/workspace/pro/empresas/medical-services
npm run db:reconcile-alembic
```

## Poblar datos demo realistas

```bash
cd backend
python seed_realistic_data.py
```

Notas:
- Seed idempotente.
- Conserva credenciales base:
  - `admin@medical.com / admin123`
  - `doctor@medical.com / doctor123`
  - `patient@medical.com / patient123`

## Verificacion rapida final
- `GET http://localhost:5000/health`
- `POST http://localhost:5000/api/auth/login`

## Problemas frecuentes
- Puerto ocupado `5433`: validar otra instancia PostgreSQL activa.
- `alembic_version` faltante: ejecutar `npm run db:reconcile-alembic`.
- Error de credenciales: revisar que `DATABASE_URL` coincida con el compose elegido.
