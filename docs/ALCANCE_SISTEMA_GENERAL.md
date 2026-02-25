# Alcance del Sistema - Medical Services

Actualizado: 2026-02-25

## 1. Objetivo general
Plataforma de gestion clinica para centralizar operacion asistencial, administrativa y trazabilidad de pacientes, turnos, historia clinica, archivos y cobranza.

## 2. Actores y frontera de acceso
- Administrador (`admin`): gobierno total del sistema (usuarios, profesionales, auditoria, reportes y operacion global).
- Profesional (`professional`): operacion clinica diaria sobre pacientes vinculados y modulos habilitados por especialidad.
- Paciente (`patient`): acceso solo a informacion propia y a sus profesionales tratantes.

## 3. Alcance funcional incluido
### Core
- Autenticacion JWT y control por roles.
- Gestion de usuarios, pacientes y profesionales.
- Agenda de citas y estados de atencion.
- Historia clinica y archivos medicos.
- Presupuestos y pagos.

### Especialidades
- Odontologia (odontogramas, dientes y tratamientos).
- Psicologia (evaluaciones y sesiones).
- Psicopedagogia (evaluaciones e intervenciones).

### Gobierno operativo
- Dashboard y reportes.
- Auditoria de acciones.
- Soporte de sincronizacion local/nube.
- Soporte asincrono con Celery y Redis.

## 4. Alcance tecnico incluido
- Backend Flask + SQLAlchemy + PostgreSQL.
- Redis + Celery para cache/tareas.
- Tres frontends separados por actor: `frontend-admin-profesional` (Angular) para `admin`, `frontend-profesional` (Angular) para `professional`, `frontend-paciente` (Ionic PWA) para `patient`.
- Despliegue con Docker Compose.

## 5. Estado funcional actual
- Casos de uso UC-MS-001..UC-MS-017 verificados como implementados.
- Referencia: `docs/development/UC_RF_VERIFICATION_2026-02-24.md`.
- Estado de modulos por sprint/evidencia: `docs/development/SPRINT_BACKLOG_P0_P1_P2_2026-02-24.md` y `docs/development/solid_activity_tracker.md`.

## 6. Fuera de alcance actual
- Integraciones productivas completas con pasarelas de pago externas.
- Integraciones hospitalarias HL7/FHIR enterprise.
- Multi-tenant completo por organizacion.
- Observabilidad/alertas de nivel productivo completamente cerradas en compose/prod.

## 7. Brechas activas de cierre (no funcionales)
- Hardening operativo de release (P2.2): healthchecks avanzados, alertas, validacion periodica de rollback/restore.
- Cobertura E2E integral offline/online por actor en entorno de despliegue estable.
- Endurecimiento adicional de autenticacion de salida (`logout` con revocacion real de token) segun estrategia final de sesiones.

## 8. Criterio de cierre de producto
- Build y suites criticas en verde de backend y 3 frontends.
- Smoke/E2E por actor en entorno de despliegue.
- Despliegue operativo documentado con backup/restore y rollback validados.
