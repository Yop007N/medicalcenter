# Medical Services - Frontend PWA

Actualizado: 2026-02-23

Cliente PWA de base para canal paciente.

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
- Proyecto en estado base/shell.
- `RouterModule.forRoot([])` sin rutas funcionales cargadas aun.
- Servicios core disponibles para evolucion:
  - `auth.service.ts`
  - `offline.service.ts`
  - `sync.service.ts`

## Estructura principal
- `src/app/core`: servicios base de auth/offline/sync.
- `src/app/shared`: componentes compartidos.
- `src/app/pages`: reservado para paginas funcionales.

## Configuracion API
Actualizar `src/environments/environment.ts` con endpoint backend.

## Nota operativa
El frontend principal productivo hoy es `frontend-admin-profesional/`; este cliente PWA requiere desarrollo adicional para paridad funcional completa.
