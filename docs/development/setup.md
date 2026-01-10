# Development Setup Guide

## Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 15+
- Redis 7.2+
- Docker & Docker Compose (optional)

## Quick Start with Docker

The fastest way to get started:

```bash
# Clone repository
git clone https://github.com/yourorg/medical-services.git
cd medical-services

# Start all services
docker-compose up
```

Services will be available at:
- Backend API: http://localhost:5000
- Frontend Web: http://localhost:4200
- Frontend PWA: http://localhost:8100
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Manual Setup

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements/dev.txt

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Initialize database
flask db init
flask db migrate -m "Initial migration"
flask db upgrade

# Run development server
python run.py
```

### 2. Frontend Web Setup

```bash
cd frontend-web

# Install dependencies
npm install

# Run development server
npm start
# or
ng serve
```

Navigate to http://localhost:4200

### 3. Frontend PWA Setup

```bash
cd frontend-pwa

# Install dependencies
npm install

# Run development server
ionic serve
```

Navigate to http://localhost:8100

### 4. Start Celery Worker (in separate terminal)

```bash
cd backend
source venv/bin/activate

celery -A celery_worker.celery worker --loglevel=info
```

## Database Setup

### PostgreSQL

Create database:
```sql
CREATE DATABASE medical_services_dev;
CREATE USER medical_user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE medical_services_dev TO medical_user;
```

### Run Migrations

```bash
cd backend
flask db upgrade
```

### Seed Data (optional)

```bash
python -c "from app.utils.seed import seed_data; seed_data()"
```

## Environment Variables

### Backend (.env)

```bash
FLASK_ENV=development
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/medical_services_dev
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=your-jwt-secret
```

### Frontend (environment.ts)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api'
};
```

## Testing

### Backend Tests

```bash
cd backend
pytest
```

With coverage:
```bash
pytest --cov=app --cov-report=html
```

### Frontend Tests

```bash
cd frontend-web
npm test
```

## Code Quality

### Backend

```bash
# Linting
flake8 app/

# Formatting
black app/

# Type checking
mypy app/
```

### Frontend

```bash
# Linting
ng lint

# Formatting
npm run format
```

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

### Database Connection Error

Check PostgreSQL is running:
```bash
sudo service postgresql status
```

### Redis Connection Error

Check Redis is running:
```bash
redis-cli ping
```

Should return `PONG`

## IDE Setup

### VS Code

Recommended extensions:
- Python
- Angular Language Service
- ESLint
- Prettier
- Docker

### PyCharm

1. Mark `backend/app` as Sources Root
2. Set Python interpreter to venv
3. Enable Flask support

## Next Steps

- Read [API Documentation](../api/README.md)
- Read [Architecture Documentation](../architecture/architecture.md)
- Check [Coding Standards](./coding-standards.md)
