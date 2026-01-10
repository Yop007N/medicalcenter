# Medical Services


  🐳 Base de Datos PostgreSQL

  - PostgreSQL 15 corriendo en localhost:5432
  - Base de datos: medical_services_dev
  - Usuario: medical_user
  - Contraseña: medical_pass_2024
  - 9 tablas creadas: users, professionals, patients, appointments, medical_records, files, budgets, payments, sync_logs


A comprehensive clinical management system with hybrid cloud-local architecture for healthcare professionals and patients.

## Features

### For Healthcare Professionals (Web App)
- Patient management
- Appointment scheduling with calendar view
- Medical record creation and management
- File upload and storage (lab results, images, etc.)
- Budget creation and tracking
- Payment management
- Dashboard with analytics

### For Patients (PWA)
- View appointments
- Request new appointments
- Access medical history
- View medical files
- Check budgets
- Offline-first architecture
- Push notifications

## Technology Stack

### Backend
- **Python** 3.11+
- **Flask** 3.0+ with Flask-RESTful
- **SQLAlchemy** 2.0+ (ORM)
- **PostgreSQL** 15+ (cloud) / SQLite (local)
- **Redis** 7.2+ (cache and broker)
- **Celery** 5.3+ (async tasks)
- **JWT** authentication

### Frontend Web
- **Angular** 17+
- **TypeScript** 5.0+
- **Angular Material** 17+
- **NgRx** 17+ (state management)
- **RxJS** 7.8+
- **Chart.js** 4.4+

### Frontend PWA
- **Ionic** 7+
- **Angular** 17+
- **Capacitor** 5+
- **Service Workers** (offline support)
- **IndexedDB** (local storage)

### DevOps
- **Docker** & Docker Compose
- **Nginx** (reverse proxy)
- **GitHub Actions** (CI/CD)
- **AWS** / DigitalOcean (deployment)

## Project Structure

```
medical-services/
├── backend/              # Flask REST API
├── frontend-web/         # Angular web app for professionals
├── frontend-pwa/         # Ionic PWA for patients
├── shared/               # Shared types and utilities
├── docker/               # Docker configurations
├── docs/                 # Documentation
├── infrastructure/       # Deployment configs
└── .github/             # GitHub Actions workflows
```

## Quick Start

### Using Docker (Recommended)

```bash
# Clone repository
git clone https://github.com/yourorg/medical-services.git
cd medical-services

# Start all services
docker-compose up
```

Services will be available at:
- **Backend API**: http://localhost:5000
- **Frontend Web**: http://localhost:4200
- **Frontend PWA**: http://localhost:8100
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Manual Setup

See [Development Setup Guide](docs/development/setup.md) for detailed instructions.

## Documentation

- **[Architecture](docs/architecture/architecture.md)** - System architecture overview
- **[Sync Strategy](docs/architecture/sync-strategy.md)** - Cloud-local synchronization
- **[API Documentation](docs/api/README.md)** - REST API reference
- **[Setup Guide](docs/development/setup.md)** - Development setup
- **[Coding Standards](docs/development/coding-standards.md)** - Code style guide

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `POST /api/auth/refresh` - Refresh token

### Core Resources
- `/api/users` - User management
- `/api/professionals` - Healthcare professionals
- `/api/patients` - Patient management
- `/api/appointments` - Appointment scheduling
- `/api/medical-records` - Clinical records
- `/api/files` - File upload/download
- `/api/budgets` - Budget management
- `/api/payments` - Payment processing
- `/api/sync` - Data synchronization

See [API Documentation](docs/api/README.md) for complete endpoint reference.

## Development

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements/dev.txt
python run.py
```

### Frontend Web

```bash
cd frontend-web
npm install
npm start
```

### Frontend PWA

```bash
cd frontend-pwa
npm install
ionic serve
```

## Testing

### Backend Tests

```bash
cd backend
pytest --cov=app
```

### Frontend Tests

```bash
cd frontend-web
npm test
```

## Deployment

### Production with Docker

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Backend
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=your-secret-key
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [Coding Standards](docs/development/coding-standards.md) for code style guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@medicalservices.com or open an issue in the GitHub repository.

## Authors

- Your Name - Initial work

## Acknowledgments

- Flask and Angular communities
- Contributors and testers
