# Medical Services - AI Coding Instructions

## Project Overview
**Medical Services** is a clinical management platform with a Flask REST API backend and three Angular frontend applications (web, PWA, and hybrid). Architecture: PostgreSQL + Redis + Celery for async tasks.

**Current Status (2026-02-23):** Backend ~95% functional (core domains, specialties, sync). Frontends compile. Production deployment pending: sync completion, full frontend parity, operational hardening.

---

## Architecture & Component Interactions

### Backend Stack
- **Framework:** Flask + SQLAlchemy ORM + Marshmallow schemas
- **Auth:** JWT + role-based access control (admin, professional, patient)
- **Async:** Celery worker with Redis broker
- **Real-time:** Flask-SocketIO for websockets
- **Storage:** PostgreSQL (transactions) + Redis (cache/broker) + local files (`storage/files/`)
- **API Docs:** Flasgger (auto-generated Swagger)

### Key Directories
- `backend/app/models/` - Domain entities (User, Patient, Professional, Appointment, MedicalRecord, Budget, Payment, etc.)
- `backend/app/resources/` - REST endpoints (blueprints registered in `__init__.py`)
- `backend/app/services/` - Business logic (should NOT contain SQLAlchemy queries—those go in models or use ORM patterns)
- `backend/app/middleware/` - Error handlers and request logging
- `backend/app/utils/` - Helpers, validators, decorators (`decorators.py` has `@admin_required`, `@professional_required`)
- `backend/tests/` - Pytest fixtures in `conftest.py`; test files mirror resource structure

### Frontend Stack
- All three frontends: **Angular 17** with standalone components, NgRx store
- `frontend/` - Ionic hybrid app (main), highest coverage
- `frontend-web/` - Angular standalone for professionals
- `frontend-pwa/` - Ionic PWA for patients
- Shared types: `shared/types/` (consider expanding for code-gen opportunities)

---

## Critical Patterns & Conventions

### Backend Patterns

**1. Resource Blueprint Pattern**
```python
# backend/app/resources/example.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.utils.decorators import admin_required, professional_required

blueprint = Blueprint('example', __name__, url_prefix='/api/example')

@blueprint.route('/', methods=['GET'])
@jwt_required()
def list_examples():
    # Logic here
    pass

@blueprint.route('/<int:id>', methods=['PUT'])
@professional_required  # Or @admin_required
def update_example(id):
    # Logic here
    pass
```
**Why:** Each resource is a separate blueprint. Ensure all new endpoints are registered in `backend/app/__init__.py`.

**2. Auth & Access Control**
- `@jwt_required()` - Requires valid JWT token (all protected endpoints use this)
- `@admin_required` - Wraps `@jwt_required()` + role check
- `@professional_required` - Similar, checks role='professional'
- Extracting user: `from flask_jwt_extended import get_jwt_identity; user_id = get_jwt_identity()`

**3. Schema Validation**
Models use Marshmallow schemas (`backend/app/schemas/`) for request/response serialization:
```python
from app.schemas.example_schema import ExampleSchema
schema = ExampleSchema()
data = schema.load(request.get_json())  # Validates + deserializes
```

**4. Error Handling**
- Custom HTTP exceptions in `middleware/error_handler.py`
- Return `jsonify({'msg': 'error message'}), status_code`
- Validation errors: check `app/utils/validators.py` for patterns

**5. Pagination**
Use `get_pagination_params()` from `app/utils/helpers.py`:
```python
page, per_page = get_pagination_params(request)
items = Model.query.paginate(page=page, per_page=per_page)
```

**6. Sync Architecture**
- Endpoints: `POST /api/sync/push`, `GET /api/sync/pull`, `GET /api/sync/status`
- Logic in `backend/app/services/sync_service.py`
- Entities covered: appointments, medical_records, budgets, payments, files
- Conflict resolution: "server_wins" (latest `updated_at` wins)
- Idempotency: via `idempotency_key` or content fingerprint

### Frontend Patterns
- **State:** NgRx store + effects for async operations
- **Services:** API calls through `HttpClient` interceptors (auth token injection)
- **Modules:** Lazy-loaded feature modules (e.g., appointments, patients)
- **Forms:** Reactive forms with validators

---

## Testing & Quality

**Backend Tests**
- Framework: **Pytest** with fixtures in `conftest.py`
- Config: `pytest.ini` with coverage targets
- Run: `pytest` or `cd backend && pytest backend/tests/test_patients.py` (e.g.)
- Fixtures: `app`, `client`, `db_session`, `admin_user`, `patient_user`, `auth_headers`
- **Coverage target:** HTML report in `htmlcov/`

**Frontend Tests**
- Framework: Jasmine + Karma
- Run: `npm test` in respective frontend directory

**CI/Automation**
- Local validation (2026-02-23): Backend `pytest` → 42 passed; Frontend builds green
- Production requires: Consistent CI, backup/restore runbooks, monitoring

---

## Common Tasks & Commands

### Backend Development
```bash
cd backend

# Setup
python -m venv venv
source venv/bin/activate
pip install -r requirements/dev.txt

# Run API
python run.py  # http://localhost:5000

# Tests + coverage
pytest
make test  # via Makefile

# Database
python init_db.py  # Create tables + seed users
flask db upgrade  # Apply migrations

# Async worker
celery -A celery_worker.celery worker --loglevel=info
```

### Frontend Development
```bash
cd frontend-web
npm install
npm start  # Dev server

cd frontend-pwa
npm install
ionic serve  # Ionic-specific serve
npm run ionic:build  # Build

npm run build  # Standard build
```

### Docker (Local)
```bash
# Database + services
docker-compose -f docker-compose.db.yml up -d

# Full stack (development)
docker-compose up -d
```

---

## Key Files & Entry Points

| File | Purpose |
|------|---------|
| `backend/app/__init__.py` | Flask app factory + blueprint registration |
| `backend/app/config.py` | Environment-based configuration |
| `backend/run.py` | Development server entry |
| `backend/celery_worker.py` | Celery initialization |
| `backend/tests/conftest.py` | Pytest fixtures + database setup |
| `docs/architecture/architecture.md` | System design & data flow |
| `docs/architecture/sync-strategy.md` | Synchronization logic |
| `docs/ALCANCE_SISTEMA_GENERAL.md` | Functional scope |

---

## Known Gaps & Risks

1. **Sync Scope** - Limited to subset of entities; expand for full offline capability
2. **Production Hardening** - Compose audit incomplete; needs healthchecks, observability, disaster recovery
3. **Frontend Parity** - Secondary frontends lag main app; prioritize PWA feature alignment
4. **Storage Strategy** - S3 configuration future; currently local-only (`storage/files/`)
5. **Error Catalogs** - Standardize error codes across API (in progress via validators)

---

## Debugging & Troubleshooting

- **Backend logs:** Check Flask output + `request_logger` middleware (all HTTP requests)
- **Database issues:** Ensure PostgreSQL running; check `migrations/versions/` for schema mismatches
- **JWT errors:** Verify token in Authorization header; check `JWT_SECRET_KEY` env var
- **CORS failures:** Confirm frontend origin in `CORS_ORIGINS` env var (default: `http://localhost:4200`)
- **Tests fail:** Ensure test database clean; use `make clean` to reset cache/pycache
- **Celery not working:** Verify Redis running (`redis-cli ping`); check broker URL in config

---

## Guidelines for AI Agents

1. **Read architecture docs first** - `docs/architecture/architecture.md` for context before coding
2. **Check existing patterns** - Mirror resource/schema/service structure before creating new modules
3. **Run tests after changes** - `pytest backend/tests/` to catch regressions
4. **Update schemas** - Always add Marshmallow schema for new models/endpoints
5. **DB migrations** - Use Flask-Migrate (`flask db migrate`) for schema changes; never raw SQL
6. **Auth enforcement** - Always use `@jwt_required()` or role decorators on sensitive endpoints
7. **API docs** - Include docstrings with Flasgger tags for Swagger auto-generation
8. **Frontend sync** - After backend changes affecting shared data, update NgRx effects/reducers

---

*Last updated: 2026-02-23 | Branch: `dev` | Author: Enrique Bobadilla*
