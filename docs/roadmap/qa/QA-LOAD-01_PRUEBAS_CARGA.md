# QA-LOAD-01 - Pruebas de Carga Backend API

Estado: `ready`
Fecha: 2026-02-15

## Problema
No existe una estrategia formal de carga para validar estabilidad bajo concurrencia en endpoints core.

## Objetivo
Definir plan de pruebas de carga incremental para API backend con umbrales operativos.

## Alcance
- Endpoints iniciales:
  - `POST /api/auth/login`
  - `GET /api/patients`
  - `GET /api/appointments`
  - `GET /api/reports/quick/stats`
- Escenarios:
  - carga base (50 usuarios virtuales)
  - carga nominal (100 usuarios virtuales)
  - estres corto (pico 200 usuarios virtuales)
- Metricas:
  - latencia p50/p95
  - tasa de error
  - throughput
  - consumo CPU/RAM del backend

## Criterios de aceptacion
1. Script de carga reproducible y versionado.
2. Umbrales iniciales documentados por endpoint.
3. Informe de resultados con recomendaciones de tuning.

## Dependencias
- Matriz E2E core preparada (`QA-E2E-CORE-01`).
- Monitoreo/alertas de deploy preparado (`DEPLOY-03`).

