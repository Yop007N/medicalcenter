# Medical Services - Patient PWA

Ionic 7+ Progressive Web App for patients with offline capabilities.

## Stack

- **Ionic**: 7+
- **Angular**: 17+
- **Capacitor**: 5+
- **Service Workers**: For offline support
- **IndexedDB**: For local data storage

## Project Structure

```
frontend-pwa/
├── src/
│   ├── app/
│   │   ├── core/              # Core services (auth, offline, sync)
│   │   ├── shared/            # Shared components
│   │   └── pages/             # Page components
│   ├── assets/                # Static assets
│   ├── environments/          # Environment configs
│   ├── theme/                 # Ionic theme variables
│   ├── manifest.webmanifest   # PWA manifest
│   └── service-worker.js      # Service worker
├── capacitor.config.ts        # Capacitor configuration
└── ionic.config.json          # Ionic configuration
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Edit `src/environments/environment.ts` with your API URL.

### 3. Run development server

```bash
ionic serve
# or
npm start
```

### 4. Build for production

```bash
ionic build --prod
```

### 5. Add native platforms (optional)

For iOS:
```bash
ionic capacitor add ios
ionic capacitor run ios
```

For Android:
```bash
ionic capacitor add android
ionic capacitor run android
```

## Features

- **Offline-First Architecture**: Works without internet connection
- **Background Sync**: Automatically syncs data when online
- **Push Notifications**: Receive appointment reminders
- **Native Feel**: Looks and feels like a native app
- **Responsive Design**: Works on all screen sizes

### Patient Features

- View appointments
- Request new appointments
- View medical history
- Access medical files
- View budgets
- Profile management

## Offline Support

The app uses:
- **Service Workers**: Cache app shell and assets
- **IndexedDB**: Store data locally
- **Background Sync**: Queue API calls when offline

## PWA Features

- **Installable**: Can be installed on home screen
- **App-like**: Full-screen experience
- **Offline**: Works without internet
- **Fast**: Instant loading with caching
- **Push Notifications**: Stay informed

## Testing

```bash
npm test
```

## Deployment

Build the app and deploy the `www` folder to your web server:

```bash
ionic build --prod
```

The app can be accessed as a web app or installed as a PWA on mobile devices.
