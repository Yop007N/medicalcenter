# Medical Services - Architecture (Estado actual)

Actualizado: 2026-02-14

## Resumen
Medical Services es una plataforma clinica modular con backend Flask y tres clientes frontend en distinto nivel de madurez.

## Componentes
### Backend API (`backend/`)
- Stack: Python + Flask + SQLAlchemy + Marshmallow
- Base de datos principal: PostgreSQL
- Soporte de cache y cola: Redis + Celery
- Tiempo real: Flask-SocketIO
- Seguridad: JWT + RBAC por roles

### Frontend principal (`frontend/`)
- Stack: Angular + Ionic
- Estado: cliente mas completo funcionalmente (modulos core + especialidades)
- Uso recomendado hoy para flujo fullstack

### Frontend web (`frontend-web/`)
- Stack: Angular standalone
- Estado: base funcional, con varias vistas aun en modo scaffold/mock

### Frontend PWA (`frontend-pwa/`)
- Stack: Angular + Ionic
- Estado: base inicial (shell), aun sin paridad funcional con backend

## Datos y almacenamiento
- Datos transaccionales: PostgreSQL
- Archivos: actualmente almacenamiento local (`storage/files`) via endpoints `files`
- Variables S3 existen en configuracion para extension futura, pero no son el flujo operativo principal hoy

## Integracion y despliegue
### Desarrollo
- `docker-compose.yml`: postgres, redis, backend, celery, frontend-web, frontend-pwa
- `docker-compose.db.yml`: postgres + pgAdmin para entorno de datos

### Produccion base
- `docker-compose.prod.yml`: postgres, redis, backend, celery, nginx
- Requiere completar hardening y observabilidad para operacion continua

## Sincronizacion
- Expuesta por `/api/sync/*`
- Implementacion actual: handlers por entidad (`appointments`, `medical_records`, `budgets`, `payments`, `files`), idempotencia por `idempotency_key`, conflictos `server_wins` y trazabilidad en `sync_logs`
- Hardening aplicado: validaciones de entrada en `push/logs` (tipos, limites y errores de contrato)
- Pendiente principal: versionado distribuido por entidad (`row_version`) definido en `docs/roadmap/SYNC-03_VERSIONADO_POR_ENTIDAD.md`
- Ver detalle operativo en `docs/architecture/sync-strategy.md`

## Estado por capa
- Backend API: alto avance funcional
- Frontend principal: avance medio/alto
- Frontend web: avance medio (parcialmente desacoplado del backend real)
- Frontend PWA: avance inicial
- Despliegue productivo: base disponible, pendiente de cierre operativo

## Riesgos tecnicos actuales
- Brecha entre documentacion historica y comportamiento real de codigo
- Brecha de paridad entre backend y `frontend-web`/`frontend-pwa`
- Sincronizacion aun no productiva para escenarios de conflicto complejos
- Versionado por entidad aun no implementado (ticket `SYNC-03` preparado)

## Criterio de arquitectura estable (release candidate)
- Contrato API-documentacion alineado
- Paridad funcional minima entre backend y al menos un frontend de produccion
- Pipeline CI/CD con tests backend y build frontend en verde
- Observabilidad y politicas de backup/restore probadas
