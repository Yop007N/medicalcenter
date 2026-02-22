# T120 - Checklist Manual de Smoke (Frontend Principal)

Fecha: 2026-02-15
Ambito: `frontend/` (Angular + Ionic)

## 1. Precondiciones
- Backend API operativo y accesible desde frontend.
- Usuario de prueba disponible:
  - `admin`
  - `professional`
- Build reciente sin errores:
  - `npm --prefix frontend run lint`
  - `npm --prefix frontend run build`

## 2. Criterio de ejecucion
- Marcar cada item como `PASS`, `FAIL` o `N/A`.
- Si hay `FAIL`, registrar:
  - pantalla/ruta
  - pasos de reproduccion
  - evidencia breve (mensaje visible)

## 3. Smoke Core (Admin)
- Login:
  - Acceso a `/auth/login`.
  - Login exitoso con credenciales validas.
  - Redireccion a dashboard.
- Dashboard:
  - Carga de cards de metricas sin error visual.
  - Refresco manual no rompe la vista.
- Pacientes:
  - Lista carga sin errores.
  - Busqueda filtra resultados.
  - Detalle abre desde card.
- Profesionales:
  - Lista visible y navegable.
  - Alta rapida con datos minimos validos.
- Citas:
  - Lista visible.
  - Calendario abre y navega mes/semana.
  - Detalle de cita abre desde lista o calendario.
- Historiales medicos:
  - Lista carga.
  - Detalle abre.
  - Alta/edicion basica no rompe UI.
- Presupuestos:
  - Lista carga.
  - Detalle abre.
- Pagos:
  - Lista carga.
  - Alta basica desde formulario.
- Reportes (admin):
  - Pantalla carga sin errores.
  - Acciones principales no generan excepcion visible.
- Auditoria (admin):
  - Pantalla carga.
  - Filtro/listado responde.

## 4. Smoke Core (Professional)
- Login exitoso con rol `professional`.
- Rutas permitidas visibles:
  - dashboard, patients, professionals, appointments, medical-records, budgets, payments, odontology, psychology, psychopedagogy.
- Rutas restringidas no visibles o bloqueadas:
  - reports, audit.

## 5. Validaciones de calidad visual rapidas
- Sin texto corrupto (mojibake) visible en flujos core.
- Estados de error muestran mensaje legible.
- Botones icon-only relevantes con nombre accesible (lector de pantalla).
- Layout usable en mobile y desktop.

## 6. Resultado final
- `GO` si todos los items criticos core estan `PASS`.
- `NO-GO` si falla login, dashboard, patients o appointments.
