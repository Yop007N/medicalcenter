SENTINEL'S JOURNAL - CRITICAL LEARNINGS ONLY

## 2024-03-01 - Missing Resource-Level Authorization (IDOR)
**Vulnerability:** Files and other resources were protected by `jwt_required()` (authentication) but lacked checks to ensure the user owned the resource (authorization). This allowed any authenticated user to access any file via its ID.
**Learning:** The application relies on `jwt_required` for access control, but this only validates the token, not the permissions on specific objects.
**Prevention:** Always verify `current_user_id` against the resource's owner ID (e.g. `medical_record.patient_id`) before returning data. Use helper functions like `check_file_access` to centralize this logic.
