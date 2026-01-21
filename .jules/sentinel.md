## 2024-05-23 - IDOR in File Downloads
**Vulnerability:** IDOR (Insecure Direct Object Reference) in file download endpoints. Patients could access any file by ID.
**Learning:** `jwt_required()` only handles authentication. It does not restrict access to specific resources based on user identity (authorization).
**Prevention:** Implement explicit ownership checks (e.g., `check_file_access`) before returning resource data. Verify `resource.owner_id == current_user.id`.
