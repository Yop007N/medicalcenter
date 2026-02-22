# T119 - Correccion de Textos y Encoding UI

Fecha: 2026-02-15

## Objetivo
Eliminar inconsistencias de encoding (mojibake) en textos de UI.

## Cambios aplicados
- `frontend/src/app/store/auth/auth.effects.ts`
  - Correccion de comentario y mensaje de registro con texto corrupto.
- `frontend/src/app/store/psychology/psychology.effects.ts`
  - Normalizacion de mensajes de notificacion con caracteres corruptos.
- `frontend/src/app/store/psychopedagogy/psychopedagogy.effects.ts`
  - Normalizacion de mensajes de notificacion con caracteres corruptos.

## Verificacion de limpieza
- `rg --line-number \"Ã|Â|â€¢|â\" frontend/src/app -g \"*.ts\"` -> sin coincidencias.

## Validacion
- `npm --prefix frontend run lint` -> `All files pass linting`.
- `npm --prefix frontend run build *> docs/roadmap/reports/t119-build.log` -> build `OK`.

## Nota de entorno
- Node detectado: `v25.2.1` (non-LTS).
