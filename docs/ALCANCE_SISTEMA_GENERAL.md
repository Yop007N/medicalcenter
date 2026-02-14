# Alcance del Sistema - Medical Services

## 1. Objetivo general
Medical Services es una plataforma para gestion clinica que centraliza operaciones asistenciales, administrativas y de seguimiento de pacientes en una arquitectura web + API + PWA.

## 2. Actores principales
- Administrador: configura el sistema, usuarios, auditoria y reportes.
- Profesional de salud: gestiona pacientes, turnos, historia clinica y tratamientos.
- Paciente: consulta informacion y seguimiento desde canales orientados a autoservicio.

## 3. Alcance funcional (incluido)
### 3.1 Core clinico y operativo
- Autenticacion JWT y control por roles.
- Gestion de usuarios, pacientes y profesionales.
- Agenda de citas con estados y filtros.
- Historia clinica y registros medicos.
- Archivos clinicos asociados a registros.
- Presupuestos y pagos.

### 3.2 Modulos especializados
- Odontologia (odontograma y tratamientos dentales).
- Psicologia.
- Psicopedagogia.

### 3.3 Operacion y soporte
- Reportes operativos y financieros.
- Dashboard con metricas.
- Auditoria de acciones.
- WebSockets para eventos en tiempo real.
- Tareas asincronas (notificaciones, sync, backups).

## 4. Alcance tecnico (incluido)
- Backend Python/Flask con SQLAlchemy y Marshmallow.
- Persistencia principal PostgreSQL (y soporte local en flujos de desarrollo).
- Redis/Celery para cache y tareas asincronas.
- Frontend Angular/Ionic con estado NgRx.
- Contenerizacion con Docker Compose.
- Pipelines CI en GitHub Actions.

## 5. Fuera de alcance actual
- Integraciones productivas con pasarelas de pago externas.
- Integraciones hospitalarias avanzadas (HL7/FHIR completas).
- Multi-tenant empresarial completo.
- Aplicaciones moviles nativas separadas (fuera de Ionic/Capacitor).

## 6. Estado general actual
- Base backend amplia y funcional con multiples modulos cubiertos por tests.
- Frontend en evolucion con mejoras activas de rendimiento, accesibilidad y pipeline.
- Se realizo limpieza de documentos legacy para reducir ruido y facilitar continuidad.

## 7. Limites y dependencias clave
- Requiere servicios de infraestructura (PostgreSQL, Redis) para escenarios completos.
- Compatibilidad de toolchain frontend depende de version de Node/NPM/Pnpm.
- Cambios de seguridad (RBAC/IDOR/JWT) deben validarse con tests de regresion.

## 8. Criterios para considerar el sistema estable
- Tests backend criticos en verde.
- Builds frontend en verde en entorno LTS compatible.
- Endpoints criticos (auth, patients, appointments, medical_records) verificados.
- Healthcheck y servicios base disponibles en entorno de despliegue.
