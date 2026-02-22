# SEC-02 - Hardening de Headers HTTP

Estado: `ready`
Fecha: 2026-02-14

## Problema
No hay politica explicita y centralizada de headers de seguridad para respuestas HTTP.

## Objetivo
Aplicar baseline de hardening compatible con frontend web/pwa.

## Alcance
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` (o `SAMEORIGIN` segun necesidad)
- `Referrer-Policy`
- `Content-Security-Policy` inicial
- `Strict-Transport-Security` en prod con TLS

## Criterios de aceptacion
- Headers presentes en respuestas API.
- Entorno productivo con politica mas estricta que desarrollo.
- Validacion automatizada en tests de integracion.

## Dependencias
- Definicion final de CSP por frontend.
- Confirmacion de terminacion TLS en nginx/proxy.

