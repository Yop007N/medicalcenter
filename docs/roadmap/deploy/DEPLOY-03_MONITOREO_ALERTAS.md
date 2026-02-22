# DEPLOY-03 - Monitoreo y Alertas Operativas

Estado: `ready`
Fecha: 2026-02-14

## Problema
No existe una definicion unica de observabilidad minima ni reglas de alerta para detectar degradacion del servicio antes de una caida total.

## Objetivo
Definir monitoreo operativo baseline y alertas accionables para backend, base de datos, redis, celery y nginx.

## Alcance
- SLI/SLO operativos base:
  - disponibilidad API (`/health`)
  - tasa de errores 5xx
  - latencia p95 de endpoints criticos
  - backlog de colas Celery
  - salud de PostgreSQL/Redis
- Inventario de senales:
  - healthchecks de compose/probes
  - logs estructurados backend/nginx
  - metricas de proceso y servicio
- Reglas de alerta por severidad:
  - `P1`: API down / DB down / Redis down
  - `P2`: 5xx sostenido, latencia alta, cola saturada
  - `P3`: degradaciones intermitentes o warning de capacidad
- Runbook de respuesta con propietario y tiempo objetivo de mitigacion.

## Criterios de aceptacion
1. Catalogo de alertas (nombre, umbral, severidad, canal, on-call) documentado.
2. Se valida disparo controlado de al menos una alerta por severidad.
3. Se documenta query/panel para diagnostico rapido por incidente.
4. Existe runbook de escalamiento ligado a `deployment/ROLLBACK_RUNBOOK.md`.

## Dependencias
- Hardening base de deploy y healthchecks (`T046-T052` completados).
- Definicion del stack de observabilidad (Prometheus/Grafana/Alertmanager u otro equivalente).
- Logs estructurados consistentes en backend y proxy.

## Riesgos y mitigaciones
- Riesgo: exceso de ruido (alert fatigue).
  - Mitigacion: usar umbrales por ventana y deduplicacion.
- Riesgo: falta de ownership para incidentes.
  - Mitigacion: asignar responsable por servicio y turno de guardia.

## Plan sugerido
1. Definir tablero operativo minimo (API, DB, Redis, Celery, Nginx).
2. Implementar alertas P1 y P2 primero.
3. Ejecutar simulacro de incidente y ajustar umbrales.
