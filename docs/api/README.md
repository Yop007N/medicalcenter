# Medical Services API Documentation

## Base URL

- **Development**: `http://localhost:5000/api`
- **Production**: `https://api.medicalservices.com/api`

## Authentication

All API endpoints (except `/auth/login` and `/auth/register`) require JWT authentication.

### Headers

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Getting a Token

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "professional"
  }
}
```

## API Endpoints

### Authentication

- `POST /auth/login` - Login
- `POST /auth/register` - Register new user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout

### Users

- `GET /users` - List users
- `GET /users/{id}` - Get user by ID
- `POST /users` - Create user
- `PUT /users/{id}` - Update user
- `DELETE /users/{id}` - Delete user

### Professionals

- `GET /professionals` - List professionals
- `GET /professionals/{id}` - Get professional
- `POST /professionals` - Create professional
- `PUT /professionals/{id}` - Update professional
- `DELETE /professionals/{id}` - Delete professional
- `GET /professionals/{id}/appointments` - Get professional's appointments

### Patients

- `GET /patients` - List patients
- `GET /patients/{id}` - Get patient
- `POST /patients` - Create patient
- `PUT /patients/{id}` - Update patient
- `DELETE /patients/{id}` - Delete patient
- `GET /patients/{id}/medical-history` - Get patient's medical history

### Appointments

- `GET /appointments` - List appointments
- `GET /appointments/{id}` - Get appointment
- `POST /appointments` - Create appointment
- `PUT /appointments/{id}` - Update appointment
- `DELETE /appointments/{id}` - Cancel appointment
- `POST /appointments/{id}/confirm` - Confirm appointment
- `GET /appointments/calendar` - Get calendar view

### Medical Records

- `GET /medical-records` - List medical records
- `GET /medical-records/{id}` - Get medical record
- `POST /medical-records` - Create medical record
- `PUT /medical-records/{id}` - Update medical record
- `DELETE /medical-records/{id}` - Delete medical record

### Files

- `POST /files/upload` - Upload file
- `GET /files/{id}` - Get file
- `GET /files/{id}/download` - Download file
- `DELETE /files/{id}` - Delete file
- `GET /files/{id}/thumbnail` - Get thumbnail

### Budgets

- `GET /budgets` - List budgets
- `GET /budgets/{id}` - Get budget
- `POST /budgets` - Create budget
- `PUT /budgets/{id}` - Update budget
- `DELETE /budgets/{id}` - Delete budget
- `POST /budgets/{id}/send` - Send budget to patient
- `POST /budgets/{id}/accept` - Accept budget

### Payments

- `GET /payments` - List payments
- `GET /payments/{id}` - Get payment
- `POST /payments` - Create payment
- `PUT /payments/{id}` - Update payment
- `POST /payments/{id}/process` - Process payment

### Sync

- `POST /sync/push` - Push local changes to cloud
- `GET /sync/pull` - Pull cloud changes
- `GET /sync/status` - Get sync status
- `GET /sync/logs` - Get sync logs

## Response Codes

- `200 OK` - Request successful
- `201 Created` - Resource created
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Error Response Format

```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "status_code": 400
}
```

## Pagination

List endpoints support pagination:

```
GET /api/patients?page=1&per_page=20
```

**Response**:
```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "per_page": 20,
  "pages": 5
}
```

## Filtering

Most list endpoints support filtering via query parameters:

```
GET /api/appointments?status=scheduled&professional_id=1&date_from=2024-01-01
```

## Rate Limiting

- **Limit**: 100 requests per minute per user
- **Headers**:
  - `X-RateLimit-Limit: 100`
  - `X-RateLimit-Remaining: 95`
  - `X-RateLimit-Reset: 1640000000`
