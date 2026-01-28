# Bolt's Journal

## 2024-05-22 - Initial Setup
**Learning:** This journal tracks critical performance learnings.
**Action:** Consult this file before starting optimization tasks.

## 2025-01-29 - N+1 Query in Medical Records
**Learning:** `lazy='dynamic'` on SQLAlchemy relationships prevents standard eager loading (`joinedload`/`subqueryload`) and caused N+1 queries when serializing lists with Marshmallow.
**Action:** Changed `lazy='dynamic'` to `lazy='select'` for `MedicalRecord.files` and added `joinedload` to the query. Always check `lazy='dynamic'` usage when optimizing N+1.
