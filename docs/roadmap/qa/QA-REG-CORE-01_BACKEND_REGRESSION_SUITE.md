# QA-REG-CORE-01 - Suite de Regresion Backend Core

Estado: `ready`
Fecha: 2026-02-15

## Objetivo
Definir una suite de regresion backend core repetible para detectar regresiones funcionales antes de release candidate.

## Alcance
- Autenticacion y seguridad base:
  - `backend/tests/test_auth.py`
  - `backend/tests/test_users.py`
- Dominio clinico:
  - `backend/tests/test_patients.py`
  - `backend/tests/test_professionals.py`
  - `backend/tests/test_appointments.py`
  - `backend/tests/test_medical_records.py`
  - `backend/tests/test_files.py`
- Dominio administrativo:
  - `backend/tests/test_budgets.py`
  - `backend/tests/test_payments.py`
  - `backend/tests/test_reports.py`
- Operacion y resiliencia:
  - `backend/tests/test_backups.py`

## Ejecucion estandar
```bash
backend/.venv311/Scripts/python -m tools.autonomy.cli qa-report --run-tests --python-executable backend/.venv311/Scripts/python --cwd .
```

La suite queda integrada en `tools/autonomy/qa_report.py` como `backend_regression_core`.

## Criterios de aceptacion
1. La suite `backend_regression_core` ejecuta en CI/local sin ajustes manuales.
2. El reporte `docs/roadmap/reports/QA_DAILY_TEST_STATUS.md` incluye resultado PASS/FAIL de esta suite.
3. El fallo de cualquier modulo core marca el reporte diario como degradado.

## Dependencias
- Entorno `.venv311` operativo.
- Base de datos de pruebas disponible para pytest.

