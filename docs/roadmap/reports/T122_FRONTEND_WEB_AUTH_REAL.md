# T122 - Auth real en frontend-web

Fecha: 2026-02-15

## Objetivo
Habilitar autenticacion real en `frontend-web` con login funcional, proteccion de rutas privadas y estado de sesion visible en shell.

## Cambios aplicados
- `frontend-web/src/app/pages/auth-login.page.ts`
  - Reemplazo de vista placeholder por formulario real (`ReactiveForms`).
  - Integracion con `AuthService.login(email, password)`.
  - Manejo de `returnUrl` desde query param y redirect post-login.
  - Manejo de error de autenticacion para feedback en UI.
  - Redirect inmediato a `returnUrl` si ya existe sesion activa.
- `frontend-web/src/app/app.routes.ts`
  - Proteccion con `AuthGuard` en rutas privadas:
    - `/dashboard`
    - `/professionals`
    - `/patients`
    - `/appointments`
    - `/medical-records`
    - `/budgets`
- `frontend-web/src/app/app.config.ts`
  - Activacion de `tokenInterceptor` en `provideHttpClient`.
- `frontend-web/src/app/core/auth/token.interceptor.ts`
  - Inyeccion de `Authorization: Bearer` en requests autenticados.
  - Exclusiones para `/auth/login` y `/auth/refresh`.
- `frontend-web/src/app/app.component.ts`
  - Exposicion de estado auth reactivo (`currentUser$`, `isAuthenticated$`).
  - Accion `logout()` con redirect a login.
- `frontend-web/src/app/app.component.html`
  - Navbar visible solo para sesion autenticada.
  - Topbar con nombre de usuario y boton `Salir`.
  - Link `Login` visible solo sin sesion.
- `frontend-web/src/app/app.component.scss`
  - Estilos para bloque auth (`auth-actions`, `user-chip`, `logout-button`).

## Validacion
- `npm --prefix frontend-web run lint` -> sin target `lint` en este proyecto Angular.
- `npm --prefix frontend-web run build *> docs/roadmap/reports/t122-build.log` -> build `OK`.

## Nota de entorno
- Node detectado por Angular CLI: `v25.2.1` (non-LTS).
