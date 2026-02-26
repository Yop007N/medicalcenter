# Configuracion de Base de Datos

Actualizado: 2026-02-14

## Objetivo
Levantar PostgreSQL local para desarrollo y validar conexion con backend.

## 1) Levantar PostgreSQL + pgAdmin
```bash
docker-compose -f docker-compose.db.yml up -d
```

Servicios:
- PostgreSQL: `localhost:5433`
- pgAdmin: `http://localhost:5050`

Credenciales por defecto (compose db):
- DB: `medical_services_dev`
- User: `medical_user`
- Password: `medical_pass_2024`

## 2) Verificar conexion
```bash
docker-compose -f docker-compose.db.yml ps
docker exec -it medical-services-postgres psql -U medical_user -d medical_services_dev -c "SELECT 1;"
```

## 3) Configurar backend
En `backend/.env` usar:
```bash
DATABASE_URL=postgresql://medical_user:medical_pass_2024@localhost:5433/medical_services_dev
REDIS_URL=redis://localhost:6379/0
```

## 4) Inicializar esquema
Opciones comunes:
```bash
cd backend
python init_db.py
# o con migraciones
flask db upgrade
```

## 4.1) Poblar datos clinicos realistas (recomendado para UI/E2E)
Despues de migrar, cargar datos relacionales (profesionales por especialidad, pacientes asignados, citas, historiales, presupuestos, pagos, archivos y encuentros por modulo):

```bash
cd backend
python seed_realistic_data.py
```

Notas:
- El seed es idempotente: puede correrse mas de una vez sin duplicar registros sembrados.
- Conserva credenciales base:
  - `admin@medical.com / admin123`
  - `doctor@medical.com / doctor123`
  - `patient@medical.com / patient123`

## 5) Verificacion rapida
- `GET http://localhost:5000/health`
- Login: `POST http://localhost:5000/api/auth/login`

## 6) Tabla esperada
El dominio actual incluye 25 tablas de negocio.
Referencia: `docs/database/schema.md`

## Problemas frecuentes
- Puerto ocupado: revisar si existe otra instancia PostgreSQL en 5433/5432.
- Error de conexion: confirmar `DATABASE_URL` y estado del contenedor `medical-services-postgres`.
- Diferencias de esquema: ejecutar migraciones pendientes.

## Reconciliacion Alembic (entornos con schema previo)
Si la base tiene tablas pero no tiene `alembic_version`, ejecutar:
```bash
cd /home/cfernanv/workspace/pro/empresas/medical-services
npm run db:reconcile-alembic
```

Este comando:
- usa `upgrade head` en esquema vacio;
- usa `stamp head` en esquema existente sin versionado;
- deja `alembic_version` consistente para despliegues futuros.
