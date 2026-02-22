# Auditoria NG8113 y Plan por Lotes (T111)

Actualizado: 2026-02-15

## Objetivo
- Inventariar warnings `NG8113` actuales del `frontend/`.
- Definir plan de limpieza por lotes para `T112`, `T113`, `T114` sin superponer archivos.

## Metodo
1. Ejecutar compilacion del frontend y capturar salida:
   - `npm --prefix frontend run build *> frontend/ng8113-audit.log`
2. Parsear warnings `NG8113` para extraer:
   - componente
   - import no usado
   - archivo y linea
3. Exportar inventario estructurado:
   - `docs/roadmap/reports/ng8113-audit.json`
   - `docs/roadmap/reports/ng8113-audit.csv`

## Resultado de auditoria
- Total warnings `NG8113`: `57`
- Total archivos afectados: `21`
- Modulo con mayor concentracion: `patients-list` (`10`)
- Import mas repetido: `IonList` (`12`)

## Estado de ejecucion
- Baseline (`T111`): `57` warnings `NG8113`.
- Post `T112` (lote 1): `41` warnings `NG8113`.
- Validacion lote 1: `0` warnings remanentes en archivos de `T112`.
- Post `T113` (lote 2): `20` warnings `NG8113`.
- Validacion lote 2: `0` warnings remanentes en archivos de `T113`.
- Post `T114` (lote 3): `0` warnings `NG8113`.
- Validacion lote 3: `0` warnings remanentes en archivos de `T114`.

### Top archivos por cantidad
| Warnings | Archivo |
| --- | --- |
| 10 | `src/app/features/patients/patients-list/patients-list.page.ts` |
| 7 | `src/app/features/budgets/budgets-list/budgets-list.page.ts` |
| 5 | `src/app/features/odontology/clinical-history/tabs/periodontogram-tab/periodontogram-tab.component.ts` |
| 4 | `src/app/features/budgets/budget-form/budget-form.page.ts` |
| 3 | `src/app/features/odontology/treatment-detail/treatment-detail.page.ts` |
| 3 | `src/app/features/payments/payment-detail/payment-detail.page.ts` |
| 3 | `src/app/features/medical-records/medical-record-form/medical-record-form.page.ts` |

### Top imports no usados
| Warnings | Import |
| --- | --- |
| 12 | `IonList` |
| 7 | `IonLabel` |
| 6 | `IonCardTitle` |
| 6 | `IonItem` |
| 4 | `IonText` |

## Plan por lotes

### T112 - Lote 1 (16 warnings)
Enfoque: vistas core de acceso/listados de pacientes y formularios simples.

Archivos:
- `src/app/features/patients/patients-list/patients-list.page.ts` (10)
- `src/app/features/patients/patient-form/patient-form.page.ts` (1)
- `src/app/features/auth/login/login.page.ts` (2)
- `src/app/features/appointments/appointment-detail/appointment-detail.page.ts` (1)
- `src/app/features/audit/audit-logs/audit-logs.page.ts` (1)
- `src/app/features/professionals/professional-form/professional-form.page.ts` (1)

### T113 - Lote 2 (21 warnings)
Enfoque: dominio financiero y formulario medico vinculado.

Archivos:
- `src/app/features/budgets/budgets-list/budgets-list.page.ts` (7)
- `src/app/features/budgets/budget-form/budget-form.page.ts` (4)
- `src/app/features/budgets/budget-detail/budget-detail.page.ts` (2)
- `src/app/features/payments/payment-detail/payment-detail.page.ts` (3)
- `src/app/features/payments/payment-form/payment-form.page.ts` (2)
- `src/app/features/medical-records/medical-record-form/medical-record-form.page.ts` (3)

### T114 - Lote 3 (20 warnings)
Enfoque: odontology/clinical-history (tabs y detalle).

Archivos:
- `src/app/features/odontology/clinical-history/tabs/periodontogram-tab/periodontogram-tab.component.ts` (5)
- `src/app/features/odontology/treatment-detail/treatment-detail.page.ts` (3)
- `src/app/features/odontology/clinical-history/tabs/history-tab/history-tab.component.ts` (2)
- `src/app/features/odontology/clinical-history/tabs/prescriptions-tab/prescriptions-tab.component.ts` (2)
- `src/app/features/odontology/clinical-history/tabs/odontogram-tab/odontogram-tab.component.ts` (2)
- `src/app/features/odontology/clinical-history/tabs/evolutions-tab/evolutions-tab.component.ts` (2)
- `src/app/features/odontology/clinical-history/tabs/documents-tab/documents-tab.component.ts` (2)
- `src/app/features/odontology/clinical-history/clinical-history.page.ts` (1)
- `src/app/features/odontology/clinical-history/tabs/clinical-docs-tab/clinical-docs-tab.component.ts` (1)

## Criterio de cierre de cada lote
- Build `frontend` exitoso.
- Cero warnings `NG8113` en archivos incluidos en el lote objetivo.
- Sin regresiones funcionales en la pantalla del lote.

## Riesgos y notas de entorno
- Entorno detectado: `node v25.2.1` (non-LTS, impar). Conviene ejecutar limpieza y validaciones finales en LTS para release.
- Warning adicional no bloqueante detectado en build: `baseline-browser-mapping` desactualizado.
