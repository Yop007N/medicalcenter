# Alcance del Sistema - Medical Services

Actualizado: 2026-02-23

## 1. Objetivo general
Plataforma de gestion clinica para centralizar operacion asistencial, administrativa y trazabilidad sobre pacientes, turnos e historia clinica.

## 2. Actores principales
- Administrador: gobierno del sistema, usuarios, auditoria, reportes.
- Profesional de salud: operacion diaria clinica y administrativa.
- Paciente: consulta/autogestion desde canales web/moviles.

## 3. Alcance funcional incluido
### Core
- Autenticacion JWT y control por roles.
- Gestion de usuarios, pacientes y profesionales.
- Agenda de citas y estados de atencion.
- Historia clinica y archivos medicos.
- Presupuestos y pagos.

### Especialidades
- Odontologia (odontograma, tratamientos, historia clinica odontologica).
- Psicologia (evaluaciones y sesiones).
- Psicopedagogia (evaluaciones e intervenciones).

### Gobierno operativo
- Auditoria de acciones.
- Reportes y dashboard.
- Base de tiempo real via WebSockets.
- Soporte de tareas asincronas con Celery.

## 4. Alcance tecnico incluido
- Backend Flask + SQLAlchemy + PostgreSQL.
- Redis + Celery para cache/tareas.
- Frontends Angular/Ionic en multiples clientes.
- Contenerizacion con Docker Compose.

## 5. Fuera de alcance actual (todavia)
- Integraciones productivas completas con pasarelas de pago.
- Integraciones hospitalarias HL7/FHIR de nivel enterprise.
- Multi-tenant completo por organizacion.
- PWA de paciente con paridad funcional total.

## 6. Estado real por capa
- Backend: alto avance funcional en modulos core y especialidades.
- Frontend principal (`frontend/`): avance alto relativo y mayor cobertura funcional.
- Frontend web (`frontend-web/`): avance medio con foco profesional.
- Frontend PWA (`frontend-pwa/`): base tecnica inicial, paridad funcional pendiente.
- Sync cloud/local: funcionalidad base, cierre productivo pendiente.

## 7. Veredicto de avance
El sistema NO esta cerrado al 100% como producto integral.

Si se evalua solo backend, el avance es alto.
Si se evalua producto completo (backend + frontends + sync + despliegue operativo), todavia hay trabajo de cierre.

## 8. Criterios para considerar "desarrollo terminado"
- Backend + frontend elegido para produccion con paridad funcional completa.
- Sincronizacion validada end-to-end con conflictos y reintentos.
- Pipeline CI estable (tests + build) en entorno limpio.
- Despliegue productivo documentado y probado (backup/restore, monitoreo, alertas).
