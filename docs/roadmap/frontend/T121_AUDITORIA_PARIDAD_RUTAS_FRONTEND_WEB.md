# T121 - Auditoria de Paridad de Rutas (`frontend-web` vs `frontend`)

Fecha: 2026-02-15

## Fuente auditada
- `frontend/src/app/app.routes.ts`
- `frontend-web/src/app/app.routes.ts`

## Resumen ejecutivo
- `frontend` (principal) expone rutas completas por dominio y control de acceso por rol.
- `frontend-web` cubre solo un subconjunto basico de rutas y no incluye guardias/rbac equivalentes.
- Brecha de paridad identificada y priorizada para `T122-T130`.

## Matriz de paridad
| Ruta base | frontend | frontend-web | Estado |
| --- | --- | --- | --- |
| `auth/login` | Si (via `auth/*`) | Si | Parcial |
| `auth/register` | Si | No | Faltante |
| `dashboard` | Si | Si | OK |
| `patients` | Si | Si | Parcial |
| `professionals` | Si | Si | Parcial |
| `appointments` | Si | Si | Parcial |
| `medical-records` | Si | Si | Parcial |
| `budgets` | Si | Si | Parcial |
| `payments` | Si | No | Faltante |
| `odontology` | Si | No | Faltante |
| `psychology` | Si | No | Faltante |
| `psychopedagogy` | Si | No | Faltante |
| `reports` | Si (admin) | No | Faltante |
| `audit` | Si (admin) | No | Faltante |

## Hallazgos tecnicos
- `frontend-web` no replica estructura `auth` modular (`auth.routes`) ni flujo de registro.
- No hay equivalencia de `authGuard`/`roleGuard` en `frontend-web`.
- En `frontend-web` faltan rutas funcionales para pagos/reportes/auditoria y especialidades.
- Rutas existentes en `frontend-web` son de nivel pagina unico (sin subrutas de detalle/formulario).

## Recomendaciones de continuidad
- `T122`: implementar auth real y guardias en `frontend-web`.
- `T123-T128`: completar dominios faltantes con prioridad:
  - patients/professionals/appointments (detalle + formularios basicos)
  - medical-records/budgets/payments
  - reports (alcance minimo)
- `T130`: definir alcance final de soporte para release.
