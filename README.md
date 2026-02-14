# Medical Services

Plataforma de gestion clinica con arquitectura modular para:
- Backend API (Flask + SQLAlchemy + PostgreSQL)
- Frontend principal (Angular + Ionic)
- Frontend web (Angular)
- Frontend PWA (Angular/Ionic)

## Estado actual
- Proyecto en rama de integracion: `retoma/jules-integracion`
- Backend con cobertura funcional amplia y tests por modulo
- Frontends con trabajo activo en CI/tooling y accesibilidad

## Estructura del repositorio
- `backend/`: API, modelos, recursos REST, servicios, tests y migraciones
- `frontend/`: app Angular/Ionic principal con NgRx y E2E
- `frontend-web/`: web app para profesionales
- `frontend-pwa/`: app PWA para pacientes
- `docs/`: documentacion tecnica y funcional consolidada
- `docker/` y `docker-compose*.yml`: despliegue local y productivo

## Inicio rapido
1. Base de datos local:
```bash
docker-compose -f docker-compose.db.yml up -d
```
2. Backend:
```bash
cd backend
venv\Scripts\activate
python run.py
```
3. Frontend principal:
```bash
cd frontend
npm install
npm run start
```

## Documentacion clave
- `docs/README.md`: indice de documentacion
- `docs/ALCANCE_SISTEMA_GENERAL.md`: alcance funcional y tecnico
- `backend/PLAN_DESARROLLO.md`: estado y plan de backend
- `docs/architecture/architecture.md`: arquitectura base
- `docs/development/setup.md`: setup de desarrollo

## Notas de limpieza
Se removieron documentos legacy y reportes intermedios que duplicaban informacion o ya no representaban el estado actual del sistema.
