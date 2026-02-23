# Medical Services

Plataforma de gestion clinica con arquitectura modular para:
- Backend API (Flask + SQLAlchemy + PostgreSQL)
- Frontend principal (Angular + Ionic)
- Frontend web (Angular)
- Frontend PWA (Angular/Ionic)

## Autor y licencia
- Autor del codigo: Enrique Bobadilla
- Licencia vigente: Codigo personal (ver `LICENSE`)
- Todos los derechos reservados. Se requiere autorizacion escrita para uso,
  copia, modificacion o distribucion.

## Estado actual
- Proyecto en rama de integracion: `retoma/jules-integracion`
- Backend con avance funcional alto
- Cierre de producto pendiente en sync productivo, paridad frontend y hardening de despliegue

## Estructura del repositorio
- `backend/`: API, modelos, recursos REST, servicios, tests y migraciones
- `frontend/`: app Angular/Ionic principal con NgRx y E2E
- `frontend-web/`: web app para profesionales
- `frontend-pwa/`: app PWA para pacientes
- `docs/`: documentacion tecnica y funcional consolidada
- `skills/`: skills de trabajo para backend, frontend, deploy y orquestacion fullstack
- `docker/` y `docker-compose*.yml`: despliegue local y productivo

## Inicio rapido
1. Variables docker compose (root):
```bash
copy .env.compose.example .env
```
2. Base de datos local:
```bash
docker-compose -f docker-compose.db.yml up -d
```
3. Backend:
```bash
cd backend
venv\Scripts\activate
python run.py
```
4. Frontend principal:
```bash
cd frontend
npm install
npm run start
```

## Documentacion clave
- `docs/README.md`: indice de documentacion
- `docs/ALCANCE_SISTEMA_GENERAL.md`: alcance funcional y tecnico
- `docs/roadmap/ESTADO_Y_BACKLOG.md`: backlog priorizado y plan de cierre
- `docs/roadmap/TABLERO_1000_TAREAS_AUTONOMO.md`: tablero expandido de microtareas en paralelo
- `backend/PLAN_DESARROLLO.md`: plan de backend
- `docs/architecture/architecture.md`: arquitectura base
- `docs/development/setup.md`: setup de desarrollo

## Notas de limpieza
Documentos historicos que ya no representan el estado actual fueron movidos a `docs/archive/legacy/`.
