# Development Setup

Actualizado: 2026-03-01

## Prerrequisitos
- Python 3.11+
- Node.js 20+
- Docker + Docker Compose v2 (`docker compose`)

## Opcion 1 (recomendada): stack completo con Docker

```bash
cd /home/cfernanv/workspace/pro/empresas/medical-services
docker compose up -d --build
docker compose ps
```

Servicios esperados:
- backend: `http://localhost:5000`
- frontend profesional web: `http://localhost` (o `FRONTEND_WEB_PORT`)
- frontend admin/profesional: `http://localhost:4200` (o `FRONTEND_ADMIN_PORT`)
- frontend paciente PWA: `http://localhost:8100` (o `FRONTEND_PWA_PORT`)
- postgres: `localhost:5433`
- redis: `localhost:6379`

## Opcion 2: solo base de datos (backend/frontend locales)

```bash
cd /home/cfernanv/workspace/pro/empresas/medical-services
docker compose -f docker-compose.db.yml up -d
docker compose -f docker-compose.db.yml ps
```

## Backend local (sin contenedor backend)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements/dev.txt
python run.py
```

Health:
- `http://localhost:5000/health`

## Frontends locales

### Admin/profesional principal
```bash
cd frontend-admin-profesional
npm install
npm run start
```

### Profesional web
```bash
cd frontend-profesional
npm install
npm run start
```

### Paciente PWA
```bash
cd frontend-paciente
npm install
npm run start
```

## Variables de entorno backend clave

Archivo sugerido: `backend/.env`

```bash
FLASK_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/medical_services_dev
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=change-me
SECRET_KEY=change-me
```

## Migraciones y reconciliacion

```bash
cd /home/cfernanv/workspace/pro/empresas/medical-services
npm run db:reconcile-alembic
```

## Datos demo reproducibles

```bash
cd backend
python seed_realistic_data.py
```

Credenciales base:
- `admin@medical.com / admin123`
- `doctor@medical.com / doctor123`
- `patient@medical.com / patient123`

## Build y tests rapidos

### Backend
```bash
cd backend
pytest
```

### Frontend admin/profesional
```bash
cd frontend-admin-profesional
npm run build
```

### Frontend profesional
```bash
cd frontend-profesional
npm run build
```

### Frontend paciente
```bash
cd frontend-paciente
npm run build
```

## Ejecucion por olas

```bash
cd /home/cfernanv/workspace/pro/empresas/medical-services
npm run waves:1
npm run waves:2
npm run waves:n
```

Referencia: `docs/development/WAVE_EXECUTION_AUTONOMA.md`.
