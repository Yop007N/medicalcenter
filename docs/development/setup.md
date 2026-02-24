# Development Setup

Actualizado: 2026-02-14

## Prerrequisitos
- Python 3.11+
- Node.js 20+
- Docker Desktop + Docker Compose

## Opcion recomendada (base de datos con Docker)
### 1) Levantar PostgreSQL + pgAdmin
```bash
docker-compose -f docker-compose.db.yml up -d
```

Puertos por defecto:
- PostgreSQL: `localhost:5433`
- pgAdmin: `http://localhost:5050`

### 2) Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements\dev.txt
python run.py
```

Backend:
- API: `http://localhost:5000`
- Health: `http://localhost:5000/health`

### 3) Frontend principal (recomendado para desarrollo funcional)
```bash
cd frontend-admin-profesional
npm install
npm run start
```

## Opcion stack completo con Docker
```bash
docker-compose up -d
```

Incluye:
- backend
- redis
- celery
- frontend-admin (cliente `frontend-admin-profesional/`)
- frontend-web (cliente `frontend-profesional/`)
- frontend-pwa (cliente `frontend-paciente/`)

## Variables de entorno backend clave
Crear `backend/.env` (si aplica en tu entorno) con:
```bash
FLASK_ENV=development
DATABASE_URL=postgresql://medical_user:medical_pass_2024@localhost:5433/medical_services_dev
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=change-me
SECRET_KEY=change-me
```

## Tests
### Backend
```bash
cd backend
pytest
```

### Frontend principal
```bash
cd frontend-admin-profesional
npm test
```

## Nota
Si hay diferencia entre esta guia y los `docker-compose*.yml`, prevalece la configuracion de los compose.
