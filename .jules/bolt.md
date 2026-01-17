## 2025-02-23 - Performance Optimization: Missing Indexes
**Learning:** Found several models (`Budget`, `Payment`, `Appointment`) missing indexes on frequently queried fields (`created_at`, `patient_id`, `budget_id`), leading to potential table scans in dashboard and list views.
**Action:** Always check model definitions against usage in `resources/` (endpoints) to identify missing indexes. Foreign keys in SQLAlchemy do not automatically create indexes.
