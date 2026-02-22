# Tablero Autonomo - Fase Siguiente (100 Tareas)

Actualizado: 2026-02-15

Formato de estado: `done`, `in_progress`, `pending`
Estado agregado actual: `22 done`, `0 in_progress`, `78 pending`

| ID | Carril | Tarea | Estado |
| --- | --- | --- | --- |
| T101 | frontend | Limpiar imports no usados en componentes standalone prioritarios | done |
| T102 | frontend | Normalizar tipos en patient-detail y modulos relacionados | done |
| T103 | frontend | Reemplazar any remanente en forms de patients y professionals | done |
| T104 | frontend | Consolidar adaptadores de paginacion en efectos NgRx | done |
| T105 | frontend | Unificar manejo de errores API en efectos de store | done |
| T106 | frontend | Validar flujo create update delete de patients end-to-end | done |
| T107 | frontend | Validar flujo create update delete de professionals end-to-end | done |
| T108 | frontend | Validar flujo appointments list calendar detail end-to-end | done |
| T109 | frontend | Validar flujo medical-records y files end-to-end | done |
| T110 | frontend | Validar flujo budgets payments y reports end-to-end | done |
| T111 | frontend | Auditar warnings NG8113 y planificar limpieza por lotes | done |
| T112 | frontend | Limpiar warnings NG8113 lote 1 | done |
| T113 | frontend | Limpiar warnings NG8113 lote 2 | done |
| T114 | frontend | Limpiar warnings NG8113 lote 3 | done |
| T115 | frontend | Reducir tamano de bundle inicial del frontend principal | done |
| T116 | frontend | Mejorar performance de lista de patients | done |
| T117 | frontend | Mejorar performance de calendario de appointments | done |
| T118 | frontend | Revisar accesibilidad AA en pantallas core | done |
| T119 | frontend | Corregir textos e inconsistencias de encoding en UI | done |
| T120 | frontend | Crear checklist de smoke manual del frontend principal | done |
| T121 | frontend | Auditar paridad de rutas frontend-web vs frontend principal | done |
| T122 | frontend | Implementar auth real en frontend-web | done |
| T123 | frontend | Integrar patients list detail en frontend-web | pending |
| T124 | frontend | Integrar professionals list detail en frontend-web | pending |
| T125 | frontend | Integrar appointments list calendar en frontend-web | pending |
| T126 | frontend | Integrar medical-records en frontend-web | pending |
| T127 | frontend | Integrar budgets y payments en frontend-web | pending |
| T128 | frontend | Integrar reports en frontend-web | pending |
| T129 | frontend | Validar build frontend-web en limpio | pending |
| T130 | frontend | Definir alcance de soporte frontend-web para release | pending |
| T131 | frontend | Implementar routing base en frontend-pwa | pending |
| T132 | frontend | Implementar shell y navegacion tabs en frontend-pwa | pending |
| T133 | frontend | Integrar auth basica en frontend-pwa | pending |
| T134 | frontend | Integrar patients en modo lectura en frontend-pwa | pending |
| T135 | frontend | Integrar appointments en modo lectura en frontend-pwa | pending |
| T136 | frontend | Completar offline queue en sync.service de frontend-pwa | pending |
| T137 | frontend | Persistir cache de entidades core en IndexedDB de pwa | pending |
| T138 | frontend | Implementar reintentos de sync al recuperar conectividad | pending |
| T139 | frontend | Validar build frontend-pwa en limpio | pending |
| T140 | frontend | Preparar matriz de compatibilidad de dispositivos PWA | pending |
| T141 | backend-sync | Disenar migracion row_version por entidad core | pending |
| T142 | backend-sync | Implementar columnas de versionado en entidades core | pending |
| T143 | backend-sync | Exponer row_version en serializers de entidades core | pending |
| T144 | backend-sync | Extender /api/sync/pull con incremental por row_version | pending |
| T145 | backend-sync | Extender /api/sync/push con validacion client_version | pending |
| T146 | backend-sync | Implementar merge granular por campo configurable | pending |
| T147 | backend-sync | Registrar conflictos por campo en sync_logs | pending |
| T148 | backend-sync | Implementar estrategia retry segura para multi-nodo | pending |
| T149 | backend-sync | Asegurar idempotencia distribuida con nonce y lock | pending |
| T150 | backend-sync | Agregar tests de integracion para sync versionado | pending |
| T151 | backend-sync | Agregar tests de conflictos multi-entidad simultaneos | pending |
| T152 | backend-sync | Agregar tests de carga alta para lotes de sync | pending |
| T153 | backend-sync | Documentar contrato de sync v2 backend | pending |
| T154 | backend-sync | Publicar guia de migracion de clientes a sync v2 | pending |
| T155 | backend-sync | Validar compatibilidad retroactiva sync v1 y v2 | pending |
| T156 | deploy | Implementar healthcheck backend en docker-compose.yml | pending |
| T157 | deploy | Implementar healthcheck redis en docker-compose.yml | pending |
| T158 | deploy | Implementar healthcheck nginx en docker-compose.prod.yml | pending |
| T159 | deploy | Implementar healthcheck basico de celery worker | pending |
| T160 | deploy | Estandarizar red entre compose db app y prod | pending |
| T161 | deploy | Endurecer headers de seguridad en nginx de produccion | pending |
| T162 | deploy | Configurar redireccion HTTPS en nginx de produccion | pending |
| T163 | deploy | Definir limites y timeouts proxy por ruta | pending |
| T164 | deploy | Implementar logging estructurado en nginx | pending |
| T165 | deploy | Definir stack base de observabilidad deploy | pending |
| T166 | deploy | Crear dashboard runtime backend db redis celery | pending |
| T167 | deploy | Configurar alertas P1 de disponibilidad | pending |
| T168 | deploy | Configurar alertas P2 de latencia y error rate | pending |
| T169 | deploy | Ejecutar simulacro de incidente y rollback | pending |
| T170 | deploy | Validar checklist de release candidate deploy | pending |
| T171 | qa | Automatizar smoke API post-deploy en script | pending |
| T172 | qa | Automatizar smoke frontend principal en script | pending |
| T173 | qa | Crear suite e2e core login patient appointment | pending |
| T174 | qa | Crear suite e2e medical record y files | pending |
| T175 | qa | Crear suite e2e budgets y payments | pending |
| T176 | qa | Crear suite e2e reports con rol admin | pending |
| T177 | qa | Crear suite e2e basica para frontend-web | pending |
| T178 | qa | Crear suite e2e basica para frontend-pwa | pending |
| T179 | qa | Preparar escenario de carga login y patients | pending |
| T180 | qa | Ejecutar prueba de carga base con 50 usuarios virtuales | pending |
| T181 | qa | Ejecutar prueba de carga nominal con 100 usuarios virtuales | pending |
| T182 | qa | Ejecutar prueba de estres pico con 200 usuarios virtuales | pending |
| T183 | qa | Medir p95 throughput y error rate por endpoint core | pending |
| T184 | qa | Integrar resultados QA extendidos en reporte diario | pending |
| T185 | qa | Definir politica automatizada de GO NO-GO de calidad | pending |
| T186 | security | Implementar rate limiting configurable en /api/auth | pending |
| T187 | security | Implementar rate limiting configurable en /api/sync | pending |
| T188 | security | Aplicar security headers en capa backend app | pending |
| T189 | security | Definir y validar CSP de produccion para frontend | pending |
| T190 | security | Revisar permisos en endpoints admin adicionales | pending |
| T191 | security | Auditar exposicion de datos sensibles en logs | pending |
| T192 | security | Implementar playbook operativo de rotacion de secrets | pending |
| T193 | security | Integrar escaneo SCA de dependencias backend y frontend | pending |
| T194 | security | Integrar escaneo de vulnerabilidades de contenedores | pending |
| T195 | security | Ejecutar pentest interno de API fase inicial | pending |
| T196 | docs-product | Actualizar arquitectura con objetivos de fase siguiente | pending |
| T197 | docs-product | Consolidar decisiones tecnicas de fase siguiente | pending |
| T198 | docs-product | Generar informe ejecutivo semanal automatizado | pending |
| T199 | docs-product | Preparar plan de handover de fase siguiente | pending |
| T200 | docs-product | Definir objetivo de cierre para release candidate final | pending |
