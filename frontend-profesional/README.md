# Medical Services - Frontend Web

Actualizado: 2026-02-23

Cliente web para operacion profesional sobre la API de Medical Services.

## Stack real
- Angular 17
- Angular Material 17
- NgRx 17
- TypeScript 5.2
- Chart.js / ng2-charts

## Comandos
```bash
npm install
npm start
npm run build
npm test
npm run lint
```

## Rutas principales actuales
Definidas en `frontend-profesional/src/app/app.routes.ts`:
- `auth/login`
- `dashboard`
- `professionals`
- `patients`
- `appointments`
- `medical-records`
- `budgets`

## Estructura principal
- `src/app/core`: auth, guards, servicios base.
- `src/app/shared`: componentes y utilidades compartidas.
- `src/app/pages`: paginas standalone usadas por el router.
- `src/app/store`: estado global con NgRx.

## Configuracion API
Actualizar `src/environments/environment.ts` con la URL backend correspondiente.

## Estado funcional
- Build local disponible (`npm run build`).
- Cobertura funcional parcial enfocada en flujo profesional.
