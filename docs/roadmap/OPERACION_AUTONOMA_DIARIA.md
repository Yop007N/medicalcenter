# Operacion Autonoma Diaria

Actualizado: 2026-02-14

## Objetivo
Definir una operacion diaria reproducible para ejecutar backlog por carriles, priorizar por impacto, escalar bloqueos y publicar KPI semanales con evidencia automatizada.

## Cadencia Diaria Por Carriles (T091)
- Slots diarios sugeridos: `12`.
- Asignacion automatica por carril: basada en `backlog pendiente x peso de criticidad`.
- Pesos de criticidad:
- `security`: 5
- `backend-sync`: 5
- `deploy`: 4
- `frontend`: 4
- `qa`: 3
- `docs-product`: 2
- Regla operativa:
- Resolver primero macros no bloqueados de mayor score.
- No abrir macro de menor peso si hay bloqueante en `security` o `deploy`.

## Priorizacion Por Impacto (T092)
- Score base por macro:
- `score = (peso_carril * 1000) + (1000 - id_macro_numerico)`.
- Penalizacion por bloqueo:
- `-10000` si tiene dependencias no resueltas.
- Criterios de orden:
- Riesgo operativo (security/deploy) sobre documentacion.
- Menor ID primero dentro del mismo carril para evitar drift.
- Estado de dependencia valido antes de marcar `in_progress`.

## Bloqueo Y Escalamiento (T093)
- Un macro queda `blocked` si depende de otro macro no `done`.
- Escalamiento obligatorio si:
- bloqueo > 24h,
- falla repetida de pruebas clave en 2 ejecuciones consecutivas,
- falta de decision de producto impide continuar.
- Canal de escalamiento:
- registrar bloqueo en `docs/roadmap/TRAZABILIDAD_TICKETS.md`,
- marcar decision requerida y continuar con siguiente macro no bloqueado.

## KPI Semanales (T094)
- KPI obligatorios:
- `% macro done` y `% micro done`,
- pendientes por carril,
- top de macros criticos pendientes,
- pass/fail/skip de suites QA diarias.
- Publicacion:
- generar snapshot con `tools/autonomy/cli.py snapshot`,
- generar estado QA con `tools/autonomy/cli.py qa-report`.

## Automatizacion
- Snapshot operativo:
```bash
backend/.venv311/Scripts/python -m tools.autonomy.cli snapshot
```
- Reporte QA diario (ejecucion real de suites):
```bash
backend/.venv311/Scripts/python -m tools.autonomy.cli qa-report --run-tests
```
- Cierre por lote de macros y microtareas:
```bash
backend/.venv311/Scripts/python -m tools.autonomy.cli close-macros --macros T068 T091 T092 T093 T094
```

