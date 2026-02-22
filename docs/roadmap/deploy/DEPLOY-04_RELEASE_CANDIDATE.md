# DEPLOY-04 - Release Candidate de Despliegue

Estado: `ready`
Fecha: 2026-02-14

## Problema
Falta un ticket unificado de salida a release candidate que consolide precondiciones tecnicas, evidencia de validacion y criterio de go/no-go.

## Objetivo
Definir la plantilla operativa de release candidate para Medical Services con gates tecnicos y evidencia repetible.

## Alcance
- Gate de infraestructura:
  - compose de app y DB en verde
  - persistencia de volumenes validada
  - backup/restore auditado y rollback documentado
- Gate de aplicacion:
  - API `/health` en `healthy`
  - login y flujo core en humo
- Gate de calidad:
  - suites QA diarias en PASS
  - reporte de estado generado automaticamente
- Gate documental:
  - trazabilidad de tickets actualizada
  - snapshot de roadmap y KPI actualizados

## Criterios de aceptacion
1. Checklist RC completo con evidencia por comando/archivo.
2. Riesgos abiertos catalogados con owner y fecha objetivo.
3. Decision de salida (`GO` / `NO-GO`) documentada con fecha/hora.
4. Rollback verificado y tiempo objetivo de recuperacion definido.

## Dependencias
- `DEPLOY-02` (hardening nginx) preparado.
- `DEPLOY-03` (monitoreo/alertas) preparado.
- `T064` (suite de regresion backend core) y `T067` (matriz E2E) para robustecer salida final.

## Checklist operativo sugerido
1. `docker compose -f docker-compose.yml up -d` y verificacion `ps`.
2. `curl http://localhost:5000/health` -> `200`.
3. Validacion de frontends esperados (`4200/4201`, `8100`).
4. Ejecucion QA diaria (`tools.autonomy.cli qa-report --run-tests`).
5. Actualizacion snapshot (`tools.autonomy.cli snapshot`).
6. Registro final en `TRAZABILIDAD_TICKETS.md`.

