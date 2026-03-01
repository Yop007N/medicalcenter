# Politica de Retencion de Sync Logs

Actualizado: 2026-03-01

## Objetivo
Definir retencion operativa de `sync_logs` para balancear trazabilidad, costo y privacidad.

## Regla de retencion
- Ventana default: `30 dias`.
- Se eliminan solo registros terminales:
- `completed`
- `failed`
- No se eliminan:
- `pending`
- `in_progress`

## Implementacion actual
- Tarea: `cleanup_old_sync_logs_task` en `backend/app/tasks/sync_tasks.py`.
- Criterio de corte:
- por `completed_at` si existe,
- por `created_at` cuando `completed_at` es `NULL`.
- Parametro: `days` (entero, `>=1`).

## Operacion recomendada
- Ejecutar limpieza diaria con Celery Beat.
- Configuracion sugerida:
- `cleanup_old_sync_logs_task(days=30)` diario en ventana nocturna.
- En auditorias especiales, ampliar temporalmente la ventana a 60/90 dias.

## Validacion
- Pruebas automatizadas:
- `backend/tests/test_sync_tasks.py`
- Casos cubiertos:
- elimina solo terminales viejos,
- conserva recientes y no terminales,
- rechaza `days <= 0`.

## Riesgos y mitigacion
- Riesgo: borrar evidencia util para incidentes activos.
- Mitigacion: excluir estados no terminales y exigir export de evidencia antes de cambios de retencion.
