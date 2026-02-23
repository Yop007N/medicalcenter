# Medical Services Backend

Actualizado: 2026-02-23

## Descripcion
API Flask para gestion clinica con autenticacion JWT, modulos asistenciales, especialidades, reportes y sincronizacion.

## Stack
- Python 3.11+
- Flask + SQLAlchemy + Marshmallow
- PostgreSQL
- Redis + Celery
- Flask-SocketIO

## Estructura principal
- `app/models/`: modelos de dominio.
- `app/schemas/`: serializacion y validacion.
- `app/resources/`: endpoints REST.
- `app/services/`: logica de negocio.
- `app/tasks/`: tareas asincronas.
- `migrations/`: versionado de base de datos.
- `tests/`: pruebas unitarias e integracion.

## Ejecucion local rapida
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements\dev.txt
python run.py
```

API:
- Base: `http://localhost:5000`
- Health: `http://localhost:5000/health`

## Pruebas
```bash
cd backend
pytest
```

Validacion puntual ejecutada el 2026-02-23:
```bash
pytest backend/tests/test_patients.py backend/tests/test_sync_endpoints.py -q
```
Resultado: `42 passed`.

## Referencias
- Plan backend: `backend/PLAN_DESARROLLO.md`
- Arquitectura general: `docs/architecture/architecture.md`
- Estrategia sync: `docs/architecture/sync-strategy.md`
- API operativa: `docs/api/README.md`
