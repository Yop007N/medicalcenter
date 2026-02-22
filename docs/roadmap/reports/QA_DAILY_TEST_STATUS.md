# QA Daily Test Status

Generated (UTC): 2026-02-15T05:30:14.998242+00:00

Summary: `4 PASS`, `0 FAIL`, `0 SKIP`, `118.15s total`

| Suite | Status | Duration (s) | Summary |
| --- | --- | --- | --- |
| sync_endpoints | PASS | 14.04 | ============================= 18 passed in 9.89s ============================== |
| sync_core | PASS | 9.46 | ============================= 27 passed in 7.03s ============================== |
| backend_smoke_core | PASS | 21.57 | ============================= 63 passed in 19.18s ============================= |
| backend_regression_core | PASS | 73.08 | ======================= 245 passed in 70.55s (0:01:10) ======================== |

## Commands
- `backend/.venv311/Scripts/python -m pytest backend/tests/test_sync_endpoints.py -q`
- `backend/.venv311/Scripts/python -m pytest backend/tests/test_sync.py -q`
- `backend/.venv311/Scripts/python -m pytest backend/tests/test_auth.py backend/tests/test_patients.py backend/tests/test_appointments.py -q`
- `backend/.venv311/Scripts/python -m pytest backend/tests/test_auth.py backend/tests/test_patients.py backend/tests/test_professionals.py backend/tests/test_appointments.py backend/tests/test_medical_records.py backend/tests/test_files.py backend/tests/test_budgets.py backend/tests/test_payments.py backend/tests/test_reports.py backend/tests/test_users.py backend/tests/test_backups.py -q`
