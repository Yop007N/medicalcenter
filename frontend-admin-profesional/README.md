# Medical Services - Frontend Principal

Actualizado: 2026-02-23

Cliente principal del producto, orientado a cobertura funcional completa.

## Stack real
- Angular 20
- Ionic Angular 8
- NgRx 20
- Capacitor 7
- Playwright E2E

## Comandos principales
```bash
npm install
npm start
npm run build
npm run build:prod
npm run lint
npm test
npm run e2e
```

## Comandos mobile (Capacitor)
```bash
npm run cap:sync
npm run cap:android
npm run cap:ios
```

## Ubicacion funcional
- `src/app/features`: modulos funcionales.
- `src/app/core`: servicios, guards, interceptors.
- `src/app/store`: estado global y efectos.
- `e2e/`: pruebas end-to-end con Playwright.

## Estado
- Cliente con mayor madurez del repositorio.
- Referencia recomendada para cierre de paridad funcional backend/frontend.
