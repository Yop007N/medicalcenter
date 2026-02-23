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
- Fecha de referencia documental: 2026-02-23
- Rama principal de trabajo: `dev`
- Ramas remotas oficiales: `dev`, `enrique-b`, `prod`
- Backend funcional con cobertura de dominios core y especialidades
- Frontend web y frontend PWA compilan en entorno local
- Cierre de producto aun pendiente en sync productivo, paridad funcional total y hardening operativo

## Estructura del repositorio
- `backend/`: API, modelos, recursos REST, servicios, tests y migraciones
- `frontend/`: app Angular/Ionic principal con NgRx y E2E
- `frontend-web/`: web app para profesionales
- `frontend-pwa/`: app PWA para pacientes
- `docs/`: documentacion tecnica y funcional consolidada
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
- `backend/PLAN_DESARROLLO.md`: plan de backend
- `docs/architecture/architecture.md`: arquitectura base
- `docs/architecture/sync-strategy.md`: estrategia de sincronizacion
- `docs/api/README.md`: referencia de endpoints
- `docs/development/setup.md`: setup de desarrollo
- `docs/database/SETUP.md`: setup de base de datos
- `docs/deployment/COMPOSE_AUDIT.md`: estado de compose y recomendaciones
- `docs/security/README.md`: indice de seguridad

## Notas de limpieza
Documentos historicos que ya no representan el estado actual fueron movidos a `docs/archive/legacy/`.
