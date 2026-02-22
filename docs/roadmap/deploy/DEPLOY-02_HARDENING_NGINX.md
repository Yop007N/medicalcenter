# DEPLOY-02 - Hardening de Nginx para Produccion

Estado: `ready`
Fecha: 2026-02-14

## Problema
El proxy Nginx actual es funcional pero no define una baseline formal de hardening para seguridad, resiliencia y trazabilidad operativa.

## Objetivo
Definir e implementar una configuracion Nginx endurecida para el stack productivo sin romper compatibilidad con frontend web/pwa ni API backend.

## Alcance
- Endurecimiento de headers HTTP en borde (alineado con `SEC-02`).
- Politica de TLS y redireccion HTTP->HTTPS.
- Limites y timeouts defensivos:
  - `client_max_body_size`
  - `keepalive_timeout`
  - `proxy_connect_timeout`
  - `proxy_read_timeout`
  - `proxy_send_timeout`
- Restriccion de metodos HTTP no usados en endpoints publicos.
- Rate limiting basico por IP para rutas sensibles (`/api/auth/*`).
- Logging estructurado para correlacion de incidentes (request id, upstream status, latencia).
- Cache-control explicito para assets estaticos y `no-store` para respuestas sensibles.

## Criterios de aceptacion
1. `nginx -t` pasa en imagen objetivo y en compose productivo.
2. Respuestas API incluyen baseline de headers de seguridad definidos.
3. HTTP redirige a HTTPS en entorno productivo.
4. Se validan limites/timeouts con pruebas manuales documentadas.
5. Se publica runbook operativo con rollback de configuracion Nginx.

## Dependencias
- Definicion final de CSP y headers de seguridad (`SEC-02`).
- Disponibilidad de certificados TLS y estrategia de renovacion.
- Validacion de rutas API/frontend finales para no bloquear trafico legitimo.

## Riesgos y mitigaciones
- Riesgo: politicas demasiado estrictas pueden romper frontend.
  - Mitigacion: rollout por etapas (modo observacion -> enforcement).
- Riesgo: timeout bajo en endpoints pesados.
  - Mitigacion: tuning por ruta con evidencia de latencia real.

## Plan sugerido
1. Baseline de configuracion hardening en `infrastructure/nginx/nginx.conf`.
2. Validacion en `docker-compose.prod.yml` con pruebas de humo.
3. Publicacion de checklist de despliegue y rollback.

