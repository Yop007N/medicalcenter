# Medical Services - Frontend Web

Angular 17+ web application for healthcare professionals.

## Stack

- **Angular**: 17+
- **TypeScript**: 5.0+
- **Angular Material**: 17+
- **State Management**: NgRx 17+
- **RxJS**: 7.8+
- **Charts**: Chart.js 4.4+

## Project Structure

```
frontend-web/
├── src/
│   ├── app/
│   │   ├── core/              # Singleton services, guards, interceptors
│   │   ├── shared/            # Shared components, pipes, directives
│   │   ├── features/          # Feature modules
│   │   ├── store/             # NgRx store
│   │   └── app.routes.ts      # App routing
│   ├── assets/                # Static assets
│   ├── environments/          # Environment configs
│   └── styles/                # Global styles
└── package.json
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Edit `src/environments/environment.ts` with your API URL and settings.

### 3. Run development server

```bash
npm start
# or
ng serve
```

Navigate to `http://localhost:4200/`

### 4. Build for production

```bash
npm run build
# or
ng build --configuration production
```

## Features

- User authentication with JWT
- Role-based access control
- Appointment management and calendar
- Medical record management
- Patient management
- File upload and management
- Budget creation and tracking
- Real-time state management with NgRx
- Responsive Material Design UI
- Internationalization (i18n) support

## Testing

Run unit tests:
```bash
npm test
# or
ng test
```

## Linting

```bash
npm run lint
# or
ng lint
```

## Key Modules

- **Auth**: Login, registration, authentication
- **Dashboard**: Overview widgets and statistics
- **Professionals**: Professional management
- **Patients**: Patient management and medical history
- **Appointments**: Appointment scheduling and calendar
- **Medical Records**: Clinical record management
- **Budgets**: Budget creation and management
- **Settings**: User preferences and profile

## State Management

The application uses NgRx for state management with:
- Actions
- Reducers
- Effects
- Selectors

## API Integration

All API calls go through the `ApiService` which handles:
- HTTP requests
- Error handling
- Token management
