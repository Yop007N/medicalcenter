# 🚀 INICIO RÁPIDO - Medical Services

## ⚡ Configuración en 3 Pasos

### Paso 1: Levantar Base de Datos (PostgreSQL + pgAdmin)

```bash
# Opción A: Usando el script (Windows)
.\start-db.bat

# Opción B: Usando docker-compose
docker-compose -f docker-compose.db.yml up -d
```

**Resultado:**
- ✅ PostgreSQL corriendo en `localhost:5432`
- ✅ pgAdmin accesible en `http://localhost:5050`

---

### Paso 2: Configurar Backend

```bash
# Opción A: Usando el script (Windows)
.\setup-backend.bat

# Opción B: Manual
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements\dev.txt
cp .env.example .env
python init_db.py
```

**Resultado:**
- ✅ Dependencias instaladas
- ✅ Base de datos inicializada
- ✅ Usuarios de ejemplo creados

---

### Paso 3: Ejecutar Backend

```bash
# Opción A: Usando el script (Windows)
.\run-backend.bat

# Opción B: Manual
cd backend
venv\Scripts\activate
python run.py
```

**Resultado:**
- ✅ API corriendo en `http://localhost:5000`

---

## 🔐 Credenciales por Defecto

### Base de Datos
```
Host:     localhost:5432
Database: medical_services_dev
Usuario:  medical_user
Password: medical_pass_2024
```

### pgAdmin (http://localhost:5050)
```
Email:    admin@medical.com
Password: admin123
```

### Usuarios de la Aplicación

**Administrador:**
```
Email:    admin@medical.com
Password: admin123
```

**Doctor (Profesional):**
```
Email:    doctor@medical.com
Password: doctor123
```

**Paciente:**
```
Email:    patient@medical.com
Password: patient123
```

---

## 🧪 Probar la API

### Opción 1: Script de prueba
```bash
cd backend
venv\Scripts\activate
python test_api.py
```

### Opción 2: cURL
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@medical.com\",\"password\":\"admin123\"}"
```

### Opción 3: Navegador
Abre: http://localhost:5000/api/users (recibirás error 401, normal sin token)

---

## 📊 Ver la Base de Datos

1. Abrir pgAdmin: http://localhost:5050
2. Login con `admin@medical.com` / `admin123`
3. El servidor "Medical Services DB" debería estar conectado
4. Navegar a: `Servers` → `Medical Services DB` → `Databases` → `medical_services_dev` → `Schemas` → `public` → `Tables`

**Deberías ver 9 tablas:**
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

## 🛠️ Comandos Útiles

### Base de Datos
```bash
# Iniciar
.\start-db.bat

# Detener
.\stop-db.bat

# Ver logs
docker logs medical-services-postgres

# Acceder a PostgreSQL
docker exec -it medical-services-postgres psql -U medical_user -d medical_services_dev
```

### Backend
```bash
# Ejecutar servidor
.\run-backend.bat

# Ejecutar tests
cd backend
venv\Scripts\activate
pytest

# Limpiar cache
make clean  # (requiere make instalado)
```

---

## 📁 Estructura del Proyecto

```
medical-services/
├── backend/              # API Flask
│   ├── app/             # Código de la aplicación
│   ├── tests/           # Tests
│   ├── storage/         # Archivos subidos
│   ├── init_db.py       # Inicializar BD
│   ├── run.py           # Servidor dev
│   └── test_api.py      # Test de API
│
├── docs/
│   └── database/        # Documentación de BD
│       ├── SETUP.md     # Guía detallada
│       └── schema.md    # Esquema de BD
│
├── docker-compose.db.yml # PostgreSQL + pgAdmin
├── start-db.bat          # Script para iniciar BD
├── setup-backend.bat     # Script para configurar backend
└── run-backend.bat       # Script para ejecutar backend
```

---

## 🐛 Solución de Problemas

### Error: "Puerto 5432 en uso"
```bash
# Windows
netstat -ano | findstr :5432
taskkill /PID <PID> /F
```

### Error: "No se puede conectar a la BD"
```bash
# Verificar que Docker esté corriendo
docker ps

# Reiniciar contenedor
docker restart medical-services-postgres
```

### Error: "ModuleNotFoundError"
```bash
# Reinstalar dependencias
cd backend
venv\Scripts\activate
pip install -r requirements\dev.txt
```

---

## 📚 Documentación Completa

- **Setup detallado:** `docs/database/SETUP.md`
- **Esquema de BD:** `docs/database/schema.md`
- **API Backend:** `backend/README.md`
- **Documentación general:** `README.md`

---

## ✅ Checklist de Verificación

- [ ] Docker Desktop está corriendo
- [ ] Ejecuté `start-db.bat` (o `docker-compose -f docker-compose.db.yml up -d`)
- [ ] pgAdmin abre en http://localhost:5050
- [ ] Ejecuté `setup-backend.bat` (o los comandos manuales)
- [ ] Vi el mensaje "Database initialization complete!"
- [ ] Ejecuté `run-backend.bat` (o `python run.py`)
- [ ] El servidor muestra "Running on http://0.0.0.0:5000"
- [ ] `test_api.py` se ejecuta sin errores

---

## 🎯 Próximos Pasos

1. ✅ **Explorar pgAdmin:** Ver las tablas y datos
2. ✅ **Probar endpoints:** Login, crear usuario, etc.
3. ✅ **Leer la documentación:** `docs/database/SETUP.md`
4. ✅ **Desarrollar:** Agregar features, modificar código

---

¿Problemas? Revisa `docs/database/SETUP.md` para guía detallada.

¡Listo para desarrollar! 🚀
