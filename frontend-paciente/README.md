# Medical Services - Frontend PWA

Actualizado: 2026-02-23

Cliente PWA para canal Paciente con autenticacion real e integracion contra backend.

## Stack real
- Angular 17
- Ionic Angular 7
- Capacitor 5
- Angular Service Worker

## Comandos
```bash
npm install
npm start
npm run build
npm test
npm run lint
npm run ionic:serve
npm run ionic:build
```

## Estado actual
- Flujo funcional inicial para actor Paciente implementado:
  - Login por JWT (`/auth/login`)
  - Dashboard paciente (`/dashboard`)
  - Mis turnos (`/my-appointments`)
  - Mis presupuestos (`/my-budgets`)
  - Mi historia clinica (`/my-history`)
  - Mi perfil (`/my-profile`)
- Menu lateral con sesion activa y cierre de sesion.
- Interceptor de auth + guard de rutas protegidas.
- Sincronizacion base (`sync/push`, `sync/pull`, `sync/status`) con cola local.

## Estructura principal
- `src/app/core`: auth, sync, offline, guard e interceptor.
- `src/app/pages`: paginas funcionales del paciente.
- `src/app/app.routes.ts`: rutas del canal paciente.

## Configuracion API
`environment.prod.ts` usa `apiUrl: '/api'` para despliegue con Nginx reverse-proxy.
Para desarrollo local sin proxy, ajustar `environment.ts` segun tu backend.

## Nota operativa
La paridad funcional total de Paciente aun requiere modulos adicionales (historia clinica, documentos y consentimientos), pero el canal ya no esta en estado shell.
