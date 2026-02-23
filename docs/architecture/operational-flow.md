# Flujo Operativo del Sistema

Actualizado: 2026-02-23
Sistema: Medical Services

## 1. Objetivo

Definir el flujo operativo integral del sistema con los actores activos:
- Administrador
- Profesional
- Paciente
- Cliente offline

El flujo esta alineado con los casos de uso UC-MS-001..UC-MS-017 y con los endpoints vigentes del backend.

## 2. Actores y responsabilidad operativa

| Actor | Responsabilidad principal |
|---|---|
| Administrador | Gobierno del sistema: usuarios, profesionales, auditoria, reportes, monitoreo de sync. |
| Profesional | Operacion clinica diaria: pacientes, turnos, historia clinica, presupuestos, pagos. |
| Paciente | Consulta de informacion propia y aceptacion de presupuestos. |
| Cliente offline | Emite cambios locales y sincroniza con nube (push/pull) con control de conflictos. |
si
## 3. Flujo operativo end-to-end (secuencia)

![Flujo operativo end-to-end](../assets/operational_flow_sequence.png)

Fuente editable: `docs/uml/operational_flow_sequence.mmd`

## 4. Flujo operativo continuo (ciclo diario)

![Flujo operativo continuo](../assets/operational_flow_cycle.png)

Fuente editable: `docs/uml/operational_flow_cycle.mmd`

## 5. Controles transversales del flujo

- Autenticacion JWT en endpoints operativos.
- RBAC en operaciones sensibles (`admin_required`, `professional_required`).
- Trazabilidad por auditoria y `sync_logs`.
- Limites de lote e idempotencia en sincronizacion.
- Persistencia central en PostgreSQL y soporte asyncrono con Redis/Celery.

## 6. Referencias

- `docs/requirements/REQUISITOS_FUNCIONALES_CASOS_USO.md`
- `docs/architecture/architecture.md`
- `docs/architecture/sync-strategy.md`
