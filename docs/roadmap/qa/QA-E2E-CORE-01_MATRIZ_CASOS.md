# QA-E2E-CORE-01 - Matriz de Casos E2E Core

Estado: `ready`
Fecha: 2026-02-15

## Objetivo
Definir la matriz minima E2E para validar los flujos core desde cliente hasta persistencia.

## Matriz de casos
| ID | Flujo | Precondicion | Validacion minima |
| --- | --- | --- | --- |
| E2E-CORE-01 | Login y sesion | Usuario valido activo | Login exitoso y acceso a rutas protegidas |
| E2E-CORE-02 | Alta paciente | Sesion valida | Paciente creado y visible en listado |
| E2E-CORE-03 | Alta profesional | Sesion admin | Profesional creado y editable |
| E2E-CORE-04 | Turno completo | Paciente y profesional existentes | Turno creado, actualizado y finalizado |
| E2E-CORE-05 | Historia/registro medico | Paciente con turno | Registro guardado y recuperable en detail |
| E2E-CORE-06 | Adjuntar archivo | Registro medico existente | Archivo sube, lista y descarga correctamente |
| E2E-CORE-07 | Presupuesto y pago | Paciente con prestacion | Presupuesto/pago reflejados en reportes |
| E2E-CORE-08 | Reporte operativo | Datos base cargados | Endpoint de reporte responde con contrato valido |

## Criterios de aceptacion
1. Cada flujo tiene precondicion y validacion observable.
2. La matriz cubre autenticacion, dominio clinico y dominio administrativo.
3. Se puede usar como base de automatizacion para `QA-E2E-02`.

## Dependencias
- Suite de regresion backend core lista (`QA-REG-CORE-01`).
- Entorno de deploy de pruebas saludable.

