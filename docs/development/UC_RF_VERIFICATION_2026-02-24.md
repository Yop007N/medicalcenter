# Verificacion UC/RF - 2026-02-24

Fuente verificada: `docs/exports/REQUISITOS_FUNCIONALES_CASOS_USO.pdf`

## Resultado de verificacion funcional
| Caso de uso | RF clave | Estado | Evidencia tecnica |
|---|---|---|---|
| UC-MS-001 Identidad/JWT | RF-001, RF-002, RF-024 | DONE | `backend/app/resources/auth.py` |
| UC-MS-002 Registro publico | RF-003 | DONE | `backend/app/services/auth_service.py` |
| UC-MS-003 Usuarios admin | RF-004, RF-005 | DONE | `backend/app/resources/users.py` |
| UC-MS-004 Profesionales | RF-006 | DONE | `backend/app/resources/professionals.py` |
| UC-MS-005 Pacientes por perfil | RF-007, RF-008 | DONE | `backend/app/resources/patients.py` + `frontend-profesional/src/app/pages/patients.page.ts` |
| UC-MS-006 Turnos/confirmacion | RF-009, RF-010 | DONE | `backend/app/resources/appointments.py` + `frontend-profesional/src/app/pages/appointments.page.ts` |
| UC-MS-007 Historial medico base | RF-011 | DONE | `backend/app/resources/medical_records.py` + `frontend-profesional/src/app/pages/medical-records.page.ts` |
| UC-MS-008 Historia odontologica | RF-012 | DONE | `backend/app/resources/clinical_history.py` |
| UC-MS-009 Archivos clinicos | RF-013 | DONE | `backend/app/resources/files.py` + `frontend-profesional/src/app/pages/files.page.ts` |
| UC-MS-010 Odontogramas/tratamientos | RF-014 | DONE | `backend/app/resources/odontograms.py`, `backend/app/resources/dental_treatments.py` + `frontend-profesional/src/app/pages/odontology.page.ts` |
| UC-MS-011 Psicologia/psicopedagogia | RF-015 | DONE | `backend/app/resources/psychology.py`, `backend/app/resources/psychopedagogy.py` |
| UC-MS-012 Presupuestos | RF-016 | DONE | `backend/app/resources/budgets.py` + `frontend-profesional/src/app/pages/budgets.page.ts` |
| UC-MS-013 Pagos | RF-017 | DONE | `backend/app/resources/payments.py` + `frontend-profesional/src/app/pages/payments.page.ts` |
| UC-MS-014 Dashboard | RF-018 | DONE | `backend/app/resources/dashboard.py` + `frontend-profesional/src/app/pages/dashboard.page.ts` |
| UC-MS-015 Reportes/export | RF-019 | DONE | `backend/app/resources/reports.py` + `frontend-profesional/src/app/pages/reports.page.ts` |
| UC-MS-016 Auditoria/compliance | RF-020 | DONE | `backend/app/resources/audit.py` + `frontend-admin-profesional/src/app/features/audit/` |
| UC-MS-017 Sync local-nube | RF-021, RF-022, RF-023 | DONE | `backend/app/resources/sync.py` |

## Brecha cerrada en este ciclo
- Se cerró UC-MS-009/RF-013 en `frontend-profesional` con modulo `files` (listar, filtrar, subir, descargar, eliminar).
- Se cerró UC-MS-010/RF-014 en `frontend-profesional` con modulo `odontology` (odontogramas, dientes y tratamientos).

## Siguiente validacion recomendada
1. Ejecutar QA E2E real por actor para verificar casos de uso en UI contra el deployment activo.
