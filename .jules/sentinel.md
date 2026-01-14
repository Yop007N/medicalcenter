## 2025-01-14 - IDOR in Patient Resources
**Vulnerability:** IDOR in `get_patient` and related endpoints allowed authenticated users to access other patients' PII and medical records by guessing IDs.
**Learning:** Authorization checks were missing on GET requests, only present on PUT. Implicit type assumptions (int vs str) in ID comparisons can lead to bypasses or regressions.
**Prevention:** Use a centralized authorization helper (`check_patient_access`) for all resource access, and ensure explicit type casting when comparing IDs.
