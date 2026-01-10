# PROMPT PARA CREAR ESTRUCTURA DE PROYECTO MEDICAL-SERVICES

## CONTEXTO DEL PROYECTO

Medical-Services es un sistema integral de gestión clínica con arquitectura híbrida (nube-local) que incluye:

1. **Backend API**: Flask 3.0+ con Python 3.11+, SQLAlchemy 2.0+, Celery 5.3+
2. **Frontend Web**: Angular 17+ con Material, NgRx, RxJS para profesionales de salud
3. **PWA Paciente**: Ionic 7+ con Angular 17+ para pacientes con capacidades offline
4. **Base de datos**: PostgreSQL 15+ (nube) + SQLite 3.45+ (local)
5. **Cache/Queue**: Redis 7.2+
6. **Storage**: AWS S3/DigitalOcean Spaces (nube) + File System (local)
7. **DevOps**: Docker, Docker Compose, GitHub Actions, Nginx

---

## INSTRUCCIONES PARA LA IA

Crea una estructura de proyecto completa y profesional para Medical-Services siguiendo estas especificaciones:

### ARQUITECTURA DEL PROYECTO

El proyecto debe organizarse en un monorepo con las siguientes partes principales:

```
medical-services/
├── backend/          # API Flask (Python 3.11+)
├── frontend-web/     # Web App Angular 17+ para profesionales
├── frontend-pwa/     # PWA Ionic 7+ para pacientes  
├── shared/           # Código compartido, tipos, utils
├── docker/           # Docker configs
├── docs/             # Documentación
└── infrastructure/   # Scripts de deploy, CI/CD
```

---

## REQUERIMIENTOS ESPECÍFICOS

### 1. BACKEND (Flask API)

**Stack:**
- Python 3.11+
- Flask 3.0+ con Flask-RESTful 0.3.10+
- SQLAlchemy 2.0+ (ORM)
- Flask-JWT-Extended 4.6+ (autenticación)
- Celery 5.3+ (tareas asíncronas)
- Redis 7.2+ (cache y broker)
- Marshmallow 3.20+ (validación)
- Bcrypt 4.1+ (passwords)
- Pytest 8.0+ (testing)
- Flask-CORS 4.0+

**Estructura requerida:**
```
backend/
├── app/
│   ├── __init__.py              # Factory pattern app
│   ├── config.py                # Configuraciones (dev, prod, test)
│   ├── extensions.py            # SQLAlchemy, JWT, Celery, etc
│   │
│   ├── models/                  # Modelos SQLAlchemy
│   │   ├── __init__.py
│   │   ├── user.py             # Usuario base
│   │   ├── professional.py     # Profesional de salud
│   │   ├── patient.py          # Paciente
│   │   ├── appointment.py      # Turnos
│   │   ├── medical_record.py   # Fichas médicas
│   │   ├── file.py             # Archivos/estudios
│   │   ├── budget.py           # Presupuestos
│   │   ├── payment.py          # Pagos
│   │   └── sync_log.py         # Logs sincronización
│   │
│   ├── schemas/                 # Marshmallow schemas
│   │   ├── __init__.py
│   │   ├── user_schema.py
│   │   ├── professional_schema.py
│   │   ├── patient_schema.py
│   │   ├── appointment_schema.py
│   │   ├── medical_record_schema.py
│   │   ├── file_schema.py
│   │   ├── budget_schema.py
│   │   └── payment_schema.py
│   │
│   ├── resources/               # REST endpoints
│   │   ├── __init__.py
│   │   ├── auth.py             # Login, refresh, logout
│   │   ├── users.py            # CRUD usuarios
│   │   ├── professionals.py    # CRUD profesionales
│   │   ├── patients.py         # CRUD pacientes
│   │   ├── appointments.py     # CRUD turnos
│   │   ├── medical_records.py  # CRUD fichas médicas
│   │   ├── files.py            # Upload/download archivos
│   │   ├── budgets.py          # CRUD presupuestos
│   │   ├── payments.py         # CRUD pagos
│   │   └── sync.py             # Endpoints sincronización
│   │
│   ├── services/                # Lógica de negocio
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── user_service.py
│   │   ├── appointment_service.py
│   │   ├── medical_record_service.py
│   │   ├── file_service.py
│   │   ├── budget_service.py
│   │   ├── sync_service.py     # Sincronización nube-local
│   │   └── notification_service.py
│   │
│   ├── tasks/                   # Celery tasks
│   │   ├── __init__.py
│   │   ├── sync_tasks.py       # Tareas sincronización
│   │   ├── notification_tasks.py
│   │   └── backup_tasks.py
│   │
│   ├── utils/                   # Utilidades
│   │   ├── __init__.py
│   │   ├── decorators.py       # Role required, etc
│   │   ├── validators.py
│   │   ├── helpers.py
│   │   └── constants.py
│   │
│   └── middleware/              # Middleware custom
│       ├── __init__.py
│       ├── error_handler.py
│       └── request_logger.py
│
├── migrations/                  # Alembic migrations
│   └── versions/
│
├── tests/                       # Pytest tests
│   ├── __init__.py
│   ├── conftest.py             # Fixtures
│   ├── test_auth.py
│   ├── test_users.py
│   ├── test_appointments.py
│   ├── test_medical_records.py
│   ├── test_sync.py
│   └── integration/
│       └── test_workflows.py
│
├── storage/                     # Almacenamiento local
│   ├── files/                  # Archivos médicos
│   ├── metadata/               # SQLite metadata
│   └── cache/                  # Cache temporal
│
├── requirements/
│   ├── base.txt                # Dependencias base
│   ├── dev.txt                 # Development
│   ├── prod.txt                # Production
│   └── test.txt                # Testing
│
├── .env.example                # Template variables entorno
├── .gitignore
├── pytest.ini
├── alembic.ini
├── celery_worker.py            # Celery worker
├── wsgi.py                     # WSGI entry point
└── run.py                      # Development server
```

**Archivos de configuración importantes:**
- `config.py`: Clases DevelopmentConfig, ProductionConfig, TestConfig
- `extensions.py`: Inicializar db, jwt, celery, redis, cors
- `.env.example`: DATABASE_URL, REDIS_URL, JWT_SECRET, S3_BUCKET, etc

---

### 2. FRONTEND WEB (Angular para profesionales)

**Stack:**
- Angular 17+
- TypeScript 5.0+
- Angular Material 17+
- NgRx 17+ (state management)
- RxJS 7.8+
- Chart.js 4.4+

**Estructura requerida:**
```
frontend-web/
├── src/
│   ├── app/
│   │   ├── core/                    # Singleton services
│   │   │   ├── auth/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.guard.ts
│   │   │   │   ├── role.guard.ts
│   │   │   │   └── token.interceptor.ts
│   │   │   ├── api/
│   │   │   │   └── api.service.ts
│   │   │   └── services/
│   │   │       ├── user.service.ts
│   │   │       ├── appointment.service.ts
│   │   │       ├── medical-record.service.ts
│   │   │       ├── file.service.ts
│   │   │       └── budget.service.ts
│   │   │
│   │   ├── shared/                  # Shared modules
│   │   │   ├── components/
│   │   │   │   ├── header/
│   │   │   │   ├── sidebar/
│   │   │   │   ├── loading/
│   │   │   │   └── dialog/
│   │   │   ├── directives/
│   │   │   ├── pipes/
│   │   │   └── models/
│   │   │       ├── user.model.ts
│   │   │       ├── appointment.model.ts
│   │   │       ├── medical-record.model.ts
│   │   │       └── budget.model.ts
│   │   │
│   │   ├── store/                   # NgRx store
│   │   │   ├── actions/
│   │   │   │   ├── auth.actions.ts
│   │   │   │   ├── user.actions.ts
│   │   │   │   ├── appointment.actions.ts
│   │   │   │   └── medical-record.actions.ts
│   │   │   ├── reducers/
│   │   │   │   ├── index.ts
│   │   │   │   ├── auth.reducer.ts
│   │   │   │   ├── user.reducer.ts
│   │   │   │   └── appointment.reducer.ts
│   │   │   ├── effects/
│   │   │   │   ├── auth.effects.ts
│   │   │   │   ├── user.effects.ts
│   │   │   │   └── appointment.effects.ts
│   │   │   └── selectors/
│   │   │       ├── auth.selectors.ts
│   │   │       └── user.selectors.ts
│   │   │
│   │   ├── features/                # Feature modules
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   └── auth-routing.module.ts
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── dashboard.component.ts
│   │   │   │   └── widgets/
│   │   │   │
│   │   │   ├── professionals/
│   │   │   │   ├── list/
│   │   │   │   ├── detail/
│   │   │   │   └── form/
│   │   │   │
│   │   │   ├── patients/
│   │   │   │   ├── list/
│   │   │   │   ├── detail/
│   │   │   │   └── medical-history/
│   │   │   │
│   │   │   ├── appointments/
│   │   │   │   ├── calendar/
│   │   │   │   ├── list/
│   │   │   │   └── form/
│   │   │   │
│   │   │   ├── medical-records/
│   │   │   │   ├── list/
│   │   │   │   ├── detail/
│   │   │   │   ├── form/
│   │   │   │   └── files/
│   │   │   │
│   │   │   ├── budgets/
│   │   │   │   ├── list/
│   │   │   │   ├── detail/
│   │   │   │   └── form/
│   │   │   │
│   │   │   └── settings/
│   │   │       ├── profile/
│   │   │       └── preferences/
│   │   │
│   │   ├── app.component.ts
│   │   ├── app.component.html
│   │   ├── app.component.scss
│   │   ├── app.routes.ts
│   │   └── app.config.ts
│   │
│   ├── assets/
│   │   ├── images/
│   │   ├── icons/
│   │   └── i18n/                    # Traducciones
│   │       ├── es.json
│   │       └── en.json
│   │
│   ├── environments/
│   │   ├── environment.ts           # Development
│   │   └── environment.prod.ts      # Production
│   │
│   ├── styles/
│   │   ├── _variables.scss
│   │   ├── _mixins.scss
│   │   └── styles.scss
│   │
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
│
├── angular.json
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── .eslintrc.json
└── README.md
```

**Configuraciones importantes:**
- `environment.ts`: API_URL, API_TIMEOUT, etc
- `angular.json`: Build optimization, assets
- Material theme customizado con colores del proyecto

---

### 3. PWA PACIENTE (Ionic para pacientes)

**Stack:**
- Ionic 7+
- Angular 17+
- Service Workers
- IndexedDB
- Push Notifications API

**Estructura requerida:**
```
frontend-pwa/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── api.service.ts
│   │   │   │   ├── offline.service.ts    # Gestión offline
│   │   │   │   ├── sync.service.ts       # Sincronización
│   │   │   │   └── notification.service.ts
│   │   │   └── guards/
│   │   │       └── auth.guard.ts
│   │   │
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   ├── models/
│   │   │   └── pipes/
│   │   │
│   │   ├── pages/
│   │   │   ├── login/
│   │   │   ├── home/                     # Dashboard paciente
│   │   │   ├── profile/
│   │   │   ├── appointments/
│   │   │   │   ├── list/
│   │   │   │   └── request/              # Solicitar turno
│   │   │   ├── medical-history/
│   │   │   │   ├── consultations/
│   │   │   │   └── files/
│   │   │   └── budgets/
│   │   │       └── list/
│   │   │
│   │   ├── app.component.ts
│   │   ├── app.routes.ts
│   │   └── app.module.ts
│   │
│   ├── assets/
│   │   ├── icon/
│   │   └── images/
│   │
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   │
│   ├── theme/
│   │   └── variables.scss
│   │
│   ├── index.html
│   ├── main.ts
│   ├── manifest.webmanifest              # PWA manifest
│   └── service-worker.js                 # Service worker custom
│
├── ionic.config.json
├── capacitor.config.ts                   # Capacitor config
├── package.json
└── tsconfig.json
```

**Características PWA:**
- Service Worker para cache de assets y API responses
- IndexedDB para almacenamiento offline
- Background sync para enviar datos cuando haya conexión
- Push notifications configuradas

---

### 4. DOCKER Y DEVOPS

**Estructura requerida:**
```
docker/
├── backend/
│   ├── Dockerfile
│   └── Dockerfile.dev
├── frontend-web/
│   ├── Dockerfile
│   └── nginx.conf
├── frontend-pwa/
│   ├── Dockerfile
│   └── nginx.conf
└── redis/
    └── redis.conf

docker-compose.yml                        # Desarrollo local
docker-compose.prod.yml                   # Producción
```

**GitHub Actions:**
```
.github/
└── workflows/
    ├── backend-ci.yml                    # Test y lint backend
    ├── frontend-web-ci.yml               # Test y build frontend
    ├── frontend-pwa-ci.yml               # Test y build PWA
    └── deploy.yml                        # Deploy automático
```

---

### 5. SHARED (Código compartido)

```
shared/
├── types/                                # TypeScript types compartidos
│   ├── user.types.ts
│   ├── appointment.types.ts
│   └── medical-record.types.ts
├── constants/
│   ├── roles.ts
│   ├── appointment-status.ts
│   └── medical-record-types.ts
└── utils/
    ├── validators.ts
    └── formatters.ts
```

---

### 6. DOCUMENTACIÓN

```
docs/
├── architecture/
│   ├── architecture.md                   # Arquitectura híbrida
│   ├── sync-strategy.md                  # Estrategia sincronización
│   └── diagrams/
│       ├── architecture.png
│       └── data-flow.png
├── api/
│   ├── README.md
│   ├── authentication.md
│   ├── endpoints/
│   │   ├── users.md
│   │   ├── appointments.md
│   │   └── medical-records.md
│   └── postman/
│       └── medical-services.postman_collection.json
├── development/
│   ├── setup.md                          # Setup local
│   ├── coding-standards.md
│   └── testing.md
└── deployment/
    ├── production.md
    └── monitoring.md
```

---

### 7. ROOT FILES

```
medical-services/
├── .gitignore
├── .editorconfig
├── README.md
├── LICENSE
├── CONTRIBUTING.md
└── package.json                          # Scripts monorepo
```

---

## INSTRUCCIONES ADICIONALES

1. **Nombres de archivos**: Usar kebab-case para archivos, PascalCase para clases
2. **Convenciones**: Seguir Angular style guide y PEP 8 para Python
3. **Testing**: Incluir tests unitarios y e2e
4. **Documentación**: Cada módulo debe tener su README.md
5. **Environment variables**: Nunca commitear .env, solo .env.example
6. **Git**: Incluir .gitignore apropiado para cada tecnología

---

## RESULTADO ESPERADO

Genera la estructura completa de carpetas y archivos con:
- Todos los archivos vacíos pero con comentarios explicativos
- package.json con todas las dependencias necesarias
- requirements.txt con versiones específicas
- Docker files configurados
- GitHub Actions workflows básicos
- README.md en cada carpeta principal explicando su propósito

---

## EJEMPLO DE COMANDO PARA EJECUTAR

Si usas este prompt con una IA de código, puedes pedirle:

"Usando el prompt anterior, genera la estructura completa del proyecto Medical-Services con todos los archivos y carpetas especificados. Incluye comentarios en los archivos principales explicando su propósito."
