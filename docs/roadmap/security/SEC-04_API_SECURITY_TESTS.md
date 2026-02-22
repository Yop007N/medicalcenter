# SEC-04 - Suite de Pruebas de Seguridad API

Estado: `ready`
Fecha: 2026-02-14

## Problema
La cobertura actual valida flujos funcionales principales, pero falta una suite dedicada de seguridad API.

## Objetivo
Agregar pruebas automatizadas de seguridad para controles de authn/authz, validaciones y errores.

## Alcance
- JWT ausente/invalido/expirado.
- RBAC por endpoint administrativo.
- Input fuzz basico en endpoints criticos.
- Verificacion de mensajes sanitizados en errores internos.

## Criterios de aceptacion
- Suite ejecutable en CI con reporte estable.
- Casos de regresion de RBAC y validaciones cubiertos.
- Baseline documentado por modulo.

## Dependencias
- Matriz de endpoints criticos priorizados.
- Entorno de test con fixtures de roles.

