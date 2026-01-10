# Configuración de Base de Datos - Medical Services

## Guía Completa de Instalación y Configuración

Esta guía te llevará paso a paso para configurar PostgreSQL y pgAdmin usando Docker.

---

## 📋 Prerequisitos

- ✅ Docker Desktop instalado y corriendo
- ✅ Python 3.11+ instalado
- ✅ Puerto 5432 (PostgreSQL) disponible
- ✅ Puerto 5050 (pgAdmin) disponible

---

## 🚀 Paso 1: Levantar PostgreSQL y pgAdmin

### Opción A: Usando docker-compose (Recomendado)

```bash
# Desde la raíz del proyecto
cd c:\pgxDev\medical-services

# Levantar los servicios
docker-compose -f docker-compose.db.yml up -d

# Verificar que estén corriendo
docker-compose -f docker-compose.db.yml ps
```

**Salida esperada:**
```
NAME                          STATUS    PORTS
medical-services-postgres     running   0.0.0.0:5432->5432/tcp
medical-services-pgadmin      running   0.0.0.0:5050->80/tcp
```

### Ver logs (si hay problemas)

```bash
# Ver logs de PostgreSQL
docker logs medical-services-postgres

# Ver logs de pgAdmin
docker logs medical-services-pgadmin

# Ver logs en tiempo real
docker-compose -f docker-compose.db.yml logs -f
```

---

## 🔧 Paso 2: Acceder a pgAdmin

1. **Abrir navegador** y ir a: http://localhost:5050

2. **Credenciales de login:**
   - Email: `admin@medical.com`
   - Password: `admin123`

3. **Conectar al servidor PostgreSQL:**
   - El servidor debería aparecer automáticamente como "Medical Services DB"
   - Si no aparece, agrégalo manualmente:
     - Host: `postgres` (nombre del contenedor)
     - Port: `5432`
     - Database: `medical_services_dev`
     - Username: `medical_user`
     - Password: `medical_pass_2024`

---

## 🐍 Paso 3: Configurar Backend de Flask

### 3.1. Crear archivo .env

```bash
cd backend
cp .env.example .env
```

### 3.2. Verificar la configuración en .env

El archivo `.env` debe tener:

```env
# Flask Configuration
FLASK_ENV=development
SECRET_KEY=dev-secret-key-change-in-production-2024
DEBUG=True

# Database (Docker PostgreSQL)
DATABASE_URL=postgresql://medical_user:medical_pass_2024@localhost:5432/medical_services_dev

# JWT
JWT_SECRET_KEY=jwt-secret-key-change-in-production-2024

# Redis
REDIS_URL=redis://localhost:6379/0

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# File Upload
UPLOAD_FOLDER=storage/files
MAX_CONTENT_LENGTH=52428800  # 50MB
```

### 3.3. Instalar dependencias de Python

```bash
# Activar entorno virtual
python -m venv venv
venv\Scripts\activate  # Windows

# Instalar dependencias
pip install -r requirements/dev.txt
```

---

## 📊 Paso 4: Inicializar la Base de Datos

### 4.1. Crear las tablas

```bash
# Desde backend/
python init_db.py
```

**Esto creará:**
- ✅ Todas las tablas del modelo
- ✅ Usuario administrador (`admin@medical.com`)
- ✅ Usuario profesional de ejemplo (`doctor@medical.com`)
- ✅ Usuario paciente de ejemplo (`patient@medical.com`)

**Salida esperada:**
```
Creating database tables...
Tables created successfully!

Creating default admin user...
Creating sample professional...
Creating sample patient...

Default users created!
==================================================
LOGIN CREDENTIALS:
==================================================

Admin:
  Email: admin@medical.com
  Password: admin123

Professional (Doctor):
  Email: doctor@medical.com
  Password: doctor123

Patient:
  Email: patient@medical.com
  Password: patient123
==================================================

Database initialization complete!
```

### 4.2. Verificar en pgAdmin

1. Abrir pgAdmin (http://localhost:5050)
2. Expandir: `Servers` → `Medical Services DB` → `Databases` → `medical_services_dev` → `Schemas` → `public` → `Tables`
3. Deberías ver las 9 tablas:
   - users
   - professionals
   - patients
   - appointments
   - medical_records
   - files
   - budgets
   - payments
   - sync_logs

---

## 🏃 Paso 5: Ejecutar el Backend

```bash
# Desde backend/
python run.py
```

**Salida esperada:**
```
 * Serving Flask app 'app'
 * Debug mode: on
WARNING: This is a development server. Do not use it in a production deployment.
 * Running on http://0.0.0.0:5000
Press CTRL+C to quit
```

---

## ✅ Paso 6: Probar la API

### Opción A: Usar el script de prueba

```bash
# En otra terminal, con venv activado
python test_api.py
```

### Opción B: Probar manualmente con cURL

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@medical.com\",\"password\":\"admin123\"}"
```

**Respuesta esperada:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "admin@medical.com",
    "first_name": "Admin",
    "last_name": "User",
    "role": "admin"
  }
}
```

### Opción C: Usar Postman/Insomnia

1. **Login:**
   - Method: POST
   - URL: `http://localhost:5000/api/auth/login`
   - Body (JSON):
     ```json
     {
       "email": "admin@medical.com",
       "password": "admin123"
     }
     ```

2. **Copiar el access_token de la respuesta**

3. **Probar otros endpoints:**
   - Method: GET
   - URL: `http://localhost:5000/api/users`
   - Headers:
     ```
     Authorization: Bearer <access_token>
     ```

---

## 🔍 Consultas SQL Útiles en pgAdmin

### Ver todos los usuarios
```sql
SELECT id, email, first_name, last_name, role, is_active
FROM users
ORDER BY id;
```

### Ver profesionales con su especialidad
```sql
SELECT u.id, u.email, u.first_name, u.last_name, p.license_number, p.specialty
FROM users u
JOIN professionals p ON u.id = p.id
WHERE u.role = 'professional';
```

### Ver turnos de hoy
```sql
SELECT
    a.id,
    a.appointment_date,
    pat.first_name || ' ' || pat.last_name AS patient_name,
    prof.first_name || ' ' || prof.last_name AS professional_name,
    a.status
FROM appointments a
JOIN users pat ON a.patient_id = pat.id
JOIN users prof ON a.professional_id = prof.id
WHERE DATE(a.appointment_date) = CURRENT_DATE
ORDER BY a.appointment_date;
```

### Ver fichas médicas con archivos
```sql
SELECT
    mr.id,
    mr.record_date,
    pat.first_name || ' ' || pat.last_name AS patient_name,
    mr.diagnosis,
    COUNT(f.id) AS num_files
FROM medical_records mr
JOIN users pat ON mr.patient_id = pat.id
LEFT JOIN files f ON mr.id = f.medical_record_id
GROUP BY mr.id, mr.record_date, pat.first_name, pat.last_name, mr.diagnosis
ORDER BY mr.record_date DESC;
```

---

## 🛠️ Comandos Docker Útiles

### Ver estado de contenedores
```bash
docker ps
```

### Parar servicios
```bash
docker-compose -f docker-compose.db.yml stop
```

### Iniciar servicios
```bash
docker-compose -f docker-compose.db.yml start
```

### Reiniciar servicios
```bash
docker-compose -f docker-compose.db.yml restart
```

### Eliminar contenedores (mantiene datos)
```bash
docker-compose -f docker-compose.db.yml down
```

### Eliminar contenedores Y datos (¡CUIDADO!)
```bash
docker-compose -f docker-compose.db.yml down -v
```

### Acceder a la consola de PostgreSQL
```bash
docker exec -it medical-services-postgres psql -U medical_user -d medical_services_dev
```

**Comandos útiles en psql:**
```sql
\l          -- Listar bases de datos
\dt         -- Listar tablas
\d users    -- Describir tabla users
\q          -- Salir
```

---

## 🔧 Solución de Problemas

### Puerto 5432 en uso

**Windows:**
```bash
netstat -ano | findstr :5432
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
lsof -ti:5432 | xargs kill -9
```

### No puedo conectar a PostgreSQL desde Flask

1. **Verificar que el contenedor esté corriendo:**
   ```bash
   docker ps | grep postgres
   ```

2. **Probar conexión manual:**
   ```bash
   docker exec -it medical-services-postgres psql -U medical_user -d medical_services_dev -c "SELECT 1;"
   ```

3. **Verificar el .env tiene la URL correcta:**
   ```
   DATABASE_URL=postgresql://medical_user:medical_pass_2024@localhost:5432/medical_services_dev
   ```

### Error "database does not exist"

```bash
# Recrear la base de datos
docker exec -it medical-services-postgres psql -U medical_user -c "CREATE DATABASE medical_services_dev;"
```

### pgAdmin no carga

1. **Limpiar cookies del navegador**
2. **Reiniciar contenedor:**
   ```bash
   docker restart medical-services-pgadmin
   ```
3. **Ver logs:**
   ```bash
   docker logs medical-services-pgadmin
   ```

### Olvidé las credenciales

**Base de Datos:**
- Usuario: `medical_user`
- Password: `medical_pass_2024`
- Database: `medical_services_dev`

**pgAdmin:**
- Email: `admin@medical.com`
- Password: `admin123`

**Usuarios de la App:**
- Admin: `admin@medical.com` / `admin123`
- Doctor: `doctor@medical.com` / `doctor123`
- Paciente: `patient@medical.com` / `patient123`

---

## 📊 Información de Conexión

### Desde la aplicación Flask (localhost)
```
Host: localhost
Port: 5432
Database: medical_services_dev
Username: medical_user
Password: medical_pass_2024
```

### Desde otros contenedores Docker
```
Host: postgres
Port: 5432
Database: medical_services_dev
Username: medical_user
Password: medical_pass_2024
```

---

## 🎯 Checklist de Verificación

- [ ] Docker Desktop está corriendo
- [ ] Contenedores PostgreSQL y pgAdmin están UP
- [ ] pgAdmin accesible en http://localhost:5050
- [ ] Puedo conectarme a la base de datos desde pgAdmin
- [ ] Backend tiene archivo .env configurado
- [ ] Ejecuté `python init_db.py` exitosamente
- [ ] Veo las 9 tablas en pgAdmin
- [ ] Backend corre con `python run.py`
- [ ] Puedo hacer login en http://localhost:5000/api/auth/login

---

## 📚 Próximos Pasos

1. **Explorar la API** con Postman o el script test_api.py
2. **Ver los datos** en pgAdmin
3. **Crear turnos** de prueba
4. **Subir archivos** médicos
5. **Probar workflows** completos

¡Todo listo para desarrollar! 🚀
