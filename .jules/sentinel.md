## 2025-05-15 - IDOR in File Management
**Vulnerability:** Insecure Direct Object Reference (IDOR) in file download endpoints.
**Learning:** The application verified authentication (token presence) but failed to verify authorization (ownership) for file objects, allowing any authenticated user (e.g., a patient) to access files belonging to other patients by guessing the file ID.
**Prevention:** Always implement object-level permission checks (e.g., `check_file_access`) in addition to authentication checks. Ensure that access controls are consistent across all CRUD operations (create, read, update, delete).
