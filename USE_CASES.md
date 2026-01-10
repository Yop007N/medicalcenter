# Casos de Uso - Medical Services

## Sistema Integral de Gestión Clínica Odontológica

**Versión:** 1.0  
**Fecha:** 2025-12-05  
**Proyecto:** Medical-Services

---

## Tabla de Contenidos

- [1. Introducción](#1-introducción)
- [2. Actores del Sistema](#2-actores-del-sistema)
- [3. Casos de Uso - Administrador](#3-casos-de-uso---administrador)
- [4. Casos de Uso - Profesional Odontólogo](#4-casos-de-uso---profesional-odontólogo)
- [5. Diagrama de Casos de Uso](#5-diagrama-de-casos-de-uso)

---

## 1. Introducción

Este documento describe los casos de uso del sistema Medical-Services para los roles de **Administrador** y **Profesional Odontólogo**. El sistema implementa una arquitectura híbrida (nube-local) con funcionalidades completas de gestión clínica, historia clínica electrónica, y portal para pacientes.

---

## 2. Actores del Sistema

| Actor | Descripción | Permisos |
|-------|-------------|----------|
| **Administrador** | Usuario con permisos completos de configuración y gestión del sistema | Acceso total a configuración, usuarios, reportes, auditoría |
| **Profesional Odontólogo** | Profesional de salud que atiende pacientes y gestiona historias clínicas | Acceso a pacientes, agenda, historia clínica, presupuestos |
| **Paciente** | Usuario final que accede al portal PWA | Consulta de turnos, historial, presupuestos (no cubierto en este documento) |

---

## 3. Casos de Uso - Administrador

### CU-ADM-01: Gestionar Usuarios del Sistema

**Actor:** Administrador  
**Precondiciones:** Usuario autenticado con rol de Administrador  
**Postcondiciones:** Usuarios creados, modificados o eliminados en el sistema

**Flujo Principal:**
1. El administrador accede al módulo de Gestión de Usuarios
2. El sistema muestra el listado de usuarios con paginación
3. El administrador selecciona una acción:
   - **Crear nuevo usuario:**
     - Ingresa datos: nombre, email, contraseña, rol (Admin, Profesional, Recepcionista)
     - El sistema valida los datos y crea el usuario
     - Se envía email de bienvenida con credenciales
   - **Editar usuario existente:**
     - Modifica datos del usuario
     - Cambia rol o permisos
     - Activa/desactiva cuenta
   - **Eliminar usuario:**
     - El sistema solicita confirmación
     - Se realiza eliminación lógica (soft delete)

**Flujos Alternativos:**
- **3a.** Email duplicado: El sistema muestra error y solicita otro email
- **3b.** Contraseña débil: El sistema solicita contraseña más segura (mín. 8 caracteres)

**Tecnologías:** Angular 17+, Flask JWT-Extended, PostgreSQL

---

### CU-ADM-02: Gestionar Profesionales

**Actor:** Administrador  
**Precondiciones:** Usuario autenticado con rol de Administrador  
**Postcondiciones:** Profesionales registrados con sus especialidades y horarios

**Flujo Principal:**
1. El administrador accede al módulo de Profesionales
2. El sistema muestra listado de profesionales activos
3. El administrador selecciona una acción:
   - **Crear profesional:**
     - Ingresa datos personales: nombre, apellido, documento, email, teléfono
     - Ingresa datos profesionales: matrícula, especialidad, título
     - Define horarios de atención por día de semana
     - Configura duración de consultas (15, 30, 45, 60 minutos)
   - **Editar profesional:**
     - Modifica datos personales o profesionales
     - Actualiza horarios de atención
     - Gestiona días de ausencia/vacaciones
   - **Desactivar profesional:**
     - El sistema verifica que no tenga citas futuras pendientes
     - Se desactiva el profesional

**Flujos Alternativos:**
- **3a.** Matrícula duplicada: El sistema muestra error
- **3b.** Horarios superpuestos: El sistema alerta sobre conflictos

**Tecnologías:** Angular Material, SQLAlchemy, PostgreSQL

---

### CU-ADM-03: Configurar Sistema

**Actor:** Administrador  
**Precondiciones:** Usuario autenticado con rol de Administrador  
**Postcondiciones:** Configuraciones del sistema actualizadas

**Flujo Principal:**
1. El administrador accede al módulo de Configuración
2. El sistema muestra las opciones de configuración:
   - **Configuración General:**
     - Nombre de la clínica
     - Logo y colores corporativos
     - Datos de contacto
   - **Configuración de Agenda:**
     - Duración predeterminada de turnos
     - Tiempo de anticipación para reservas
     - Recordatorios automáticos (SMS/Email)
   - **Configuración de Pagos:**
     - Métodos de pago aceptados
     - Moneda predeterminada
     - Configuración de facturación
   - **Configuración de Sincronización:**
     - Frecuencia de sincronización nube-local
     - Política de backups
     - Almacenamiento de archivos (local/nube)
3. El administrador modifica las configuraciones deseadas
4. El sistema valida y guarda los cambios

**Tecnologías:** Angular, Flask, Redis (cache de configuración)

---

### CU-ADM-04: Generar Reportes y Estadísticas

**Actor:** Administrador  
**Precondiciones:** Usuario autenticado con rol de Administrador  
**Postcondiciones:** Reportes generados y exportados

**Flujo Principal:**
1. El administrador accede al módulo de Reportes
2. El sistema muestra las opciones de reportes disponibles:
   - **Reporte de Facturación:**
     - Ingresos por período
     - Ingresos por profesional
     - Ingresos por tipo de servicio
   - **Reporte de Citas:**
     - Citas realizadas vs. canceladas
     - Tasa de ausentismo
     - Ocupación de agenda por profesional
   - **Reporte de Pacientes:**
     - Nuevos pacientes por período
     - Pacientes activos vs. inactivos
     - Distribución por edad/género
   - **Reporte de Servicios:**
     - Servicios más solicitados
     - Duración promedio de tratamientos
3. El administrador selecciona tipo de reporte, rango de fechas y filtros
4. El sistema genera el reporte con gráficos (Chart.js)
5. El administrador puede exportar en PDF o Excel

**Tecnologías:** Chart.js, Flask, PostgreSQL, Celery (reportes pesados)

---

### CU-ADM-05: Auditar Acciones del Sistema

**Actor:** Administrador  
**Precondiciones:** Usuario autenticado con rol de Administrador  
**Postcondiciones:** Registro de auditoría consultado

**Flujo Principal:**
1. El administrador accede al módulo de Auditoría
2. El sistema muestra el log de acciones con filtros:
   - Por usuario
   - Por tipo de acción (CREATE, UPDATE, DELETE, LOGIN)
   - Por módulo (Pacientes, Citas, Historia Clínica)
   - Por rango de fechas
3. El administrador aplica filtros deseados
4. El sistema muestra el listado de eventos de auditoría con:
   - Timestamp
   - Usuario que realizó la acción
   - Tipo de acción
   - Entidad afectada
   - Datos antes/después (para UPDATE)
   - IP de origen
5. El administrador puede exportar el log de auditoría

**Flujos Alternativos:**
- **3a.** Detección de actividad sospechosa: El sistema alerta al administrador

**Tecnologías:** PostgreSQL (tabla de auditoría), Angular Material Table

---

### CU-ADM-06: Gestionar Backups y Sincronización

**Actor:** Administrador  
**Precondiciones:** Usuario autenticado con rol de Administrador  
**Postcondiciones:** Backups configurados y sincronización verificada

**Flujo Principal:**
1. El administrador accede al módulo de Backups
2. El sistema muestra el estado de:
   - **Backups Automáticos:**
     - Último backup realizado
     - Próximo backup programado
     - Espacio utilizado
   - **Sincronización Nube-Local:**
     - Estado de sincronización
     - Última sincronización exitosa
     - Archivos pendientes de sincronizar
     - Conflictos detectados
3. El administrador puede:
   - Ejecutar backup manual
   - Restaurar desde backup
   - Forzar sincronización completa
   - Resolver conflictos de sincronización manualmente
4. El sistema ejecuta la acción y muestra el resultado

**Flujos Alternativos:**
- **3a.** Error en sincronización: El sistema muestra detalles del error y sugiere acciones
- **3b.** Conflicto de datos: El sistema permite elegir versión a mantener

**Tecnologías:** Celery, Redis, AWS S3/DigitalOcean Spaces, PostgreSQL

---

### CU-ADM-07: Gestionar Presupuestos y Servicios

**Actor:** Administrador  
**Precondiciones:** Usuario autenticado con rol de Administrador  
**Postcondiciones:** Catálogo de servicios actualizado

**Flujo Principal:**
1. El administrador accede al módulo de Servicios
2. El sistema muestra el catálogo de servicios odontológicos
3. El administrador puede:
   - **Crear servicio:**
     - Código del servicio
     - Nombre y descripción
     - Precio base
     - Categoría (Preventivo, Restaurador, Quirúrgico, Ortodóncico, etc.)
     - Duración estimada
   - **Editar servicio:**
     - Actualizar precios
     - Modificar descripción
     - Activar/desactivar servicio
   - **Crear paquetes de servicios:**
     - Combinar múltiples servicios
     - Aplicar descuentos por paquete
4. El sistema guarda los cambios y actualiza el catálogo

**Tecnologías:** Angular, Flask, Marshmallow (validación), PostgreSQL

---

## 4. Casos de Uso - Profesional Odontólogo

### CU-PRO-01: Gestionar Agenda de Citas

**Actor:** Profesional Odontólogo  
**Precondiciones:** Usuario autenticado con rol de Profesional  
**Postcondiciones:** Agenda actualizada con citas programadas

**Flujo Principal:**
1. El profesional accede al módulo de Agenda
2. El sistema muestra la vista de calendario con:
   - Vista día/semana/mes
   - Citas programadas con colores por estado (Confirmada, Pendiente, Cancelada)
   - Horarios disponibles
3. El profesional puede:
   - **Crear nueva cita:**
     - Selecciona paciente (busca por nombre/documento)
     - Selecciona fecha y hora disponible
     - Selecciona tipo de consulta
     - Agrega notas/motivo de consulta
     - El sistema valida disponibilidad y crea la cita
   - **Modificar cita existente:**
     - Cambia fecha/hora (reprogramar)
     - Actualiza estado (Confirmar, Cancelar)
     - Agrega notas
   - **Ver detalles de cita:**
     - Datos del paciente
     - Historial de citas previas
     - Presupuestos pendientes
4. El sistema sincroniza cambios en tiempo real (WebSockets)

**Flujos Alternativos:**
- **3a.** Horario no disponible: El sistema sugiere horarios alternativos
- **3b.** Paciente nuevo: El sistema permite crear el paciente desde la agenda

**Tecnologías:** Angular Material Calendar, WebSockets, Flask, PostgreSQL

---

### CU-PRO-02: Gestionar Pacientes

**Actor:** Profesional Odontólogo  
**Precondiciones:** Usuario autenticado con rol de Profesional  
**Postcondiciones:** Datos de pacientes actualizados

**Flujo Principal:**
1. El profesional accede al módulo de Pacientes
2. El sistema muestra el listado de pacientes con búsqueda y filtros
3. El profesional puede:
   - **Crear paciente:**
     - Datos personales: nombre, apellido, documento, fecha de nacimiento
     - Datos de contacto: teléfono, email, dirección
     - Datos médicos básicos: grupo sanguíneo, alergias, medicación actual
     - Contacto de emergencia
   - **Editar paciente:**
     - Actualizar datos personales o de contacto
     - Modificar datos médicos
   - **Ver ficha completa:**
     - Datos personales
     - Historial de citas
     - Historia clínica
     - Presupuestos y pagos
     - Documentos adjuntos
4. El sistema guarda los cambios

**Flujos Alternativos:**
- **3a.** Documento duplicado: El sistema alerta que el paciente ya existe

**Tecnologías:** Angular, NgRx (estado), Flask, PostgreSQL

---

### CU-PRO-03: Registrar Historia Clínica - Anamnesis

**Actor:** Profesional Odontólogo  
**Precondiciones:** Usuario autenticado, paciente seleccionado  
**Postcondiciones:** Anamnesis registrada en historia clínica

**Flujo Principal:**
1. El profesional accede a Historia Clínica del paciente
2. Selecciona la pestaña "Anamnesis"
3. El sistema muestra el formulario de anamnesis con secciones:
   - **Antecedentes Médicos:**
     - Enfermedades actuales
     - Cirugías previas
     - Alergias (medicamentos, materiales)
     - Medicación actual
   - **Antecedentes Odontológicos:**
     - Tratamientos previos
     - Experiencias negativas
     - Hábitos (bruxismo, tabaco)
   - **Motivo de Consulta:**
     - Descripción del problema actual
     - Síntomas
     - Tiempo de evolución
4. El profesional completa el formulario
5. El sistema valida y guarda la anamnesis
6. Se registra en el timeline de eventos

**Tecnologías:** Ionic 7+, Angular Forms, Flask, PostgreSQL

---

### CU-PRO-04: Registrar Evolución Clínica

**Actor:** Profesional Odontólogo  
**Precondiciones:** Usuario autenticado, paciente con historia clínica  
**Postcondiciones:** Evolución registrada y firmada

**Flujo Principal:**
1. El profesional accede a Historia Clínica del paciente
2. Selecciona la pestaña "Evoluciones"
3. El profesional crea nueva evolución:
   - Fecha y hora de la consulta
   - Motivo de consulta
   - Examen clínico realizado
   - Diagnóstico
   - Tratamiento realizado
   - Observaciones
   - Próxima cita sugerida
4. El profesional firma digitalmente la evolución
5. Opcionalmente, solicita firma del paciente
6. El sistema guarda la evolución con estado "signed"
7. Se registra en el timeline de eventos

**Flujos Alternativos:**
- **4a.** El profesional puede guardar como borrador sin firmar
- **6a.** El profesional puede anular una evolución (requiere motivo)

**Tecnologías:** SignaturePadComponent, Angular, Flask, PostgreSQL

---

### CU-PRO-05: Gestionar Odontograma

**Actor:** Profesional Odontólogo  
**Precondiciones:** Usuario autenticado, paciente seleccionado  
**Postcondiciones:** Odontograma actualizado

**Flujo Principal:**
1. El profesional accede a Historia Clínica del paciente
2. Selecciona la pestaña "Odontograma"
3. El sistema muestra el odontograma visual (notación FDI):
   - Dientes permanentes: 11-48
   - Dientes deciduos: 51-85
4. El profesional selecciona un diente
5. El sistema muestra opciones de registro:
   - Estado del diente (sano, cariado, obturado, ausente, etc.)
   - Caras afectadas (oclusal, mesial, distal, vestibular, lingual)
   - Tratamiento planificado
   - Tratamiento realizado
   - Observaciones
6. El profesional registra hallazgos y tratamientos
7. El sistema actualiza el odontograma visual con colores/símbolos
8. Se guarda el registro con timestamp

**Tecnologías:** Canvas/SVG para odontograma visual, Angular, PostgreSQL

---

### CU-PRO-06: Gestionar Periodontograma

**Actor:** Profesional Odontólogo  
**Precondiciones:** Usuario autenticado, paciente seleccionado  
**Postcondiciones:** Periodontograma registrado

**Flujo Principal:**
1. El profesional accede a Historia Clínica del paciente
2. Selecciona la pestaña "Periodontograma"
3. El sistema muestra la interfaz de periodontograma
4. Para cada diente, el profesional registra:
   - Profundidad de sondaje (6 puntos por diente)
   - Nivel de inserción clínica
   - Sangrado al sondaje
   - Movilidad dental
   - Furca (si aplica)
   - Placa bacteriana
5. El sistema calcula automáticamente:
   - Índice de placa
   - Índice de sangrado
   - Promedio de profundidad de sondaje
6. El profesional guarda el periodontograma
7. El sistema permite comparar con periodontogramas anteriores

**Tecnologías:** Angular, Chart.js (gráficos), PostgreSQL

---

### CU-PRO-07: Gestionar Documentos y Radiografías

**Actor:** Profesional Odontólogo  
**Precondiciones:** Usuario autenticado, paciente seleccionado  
**Postcondiciones:** Documentos subidos y organizados

**Flujo Principal:**
1. El profesional accede a Historia Clínica del paciente
2. Selecciona la pestaña "Documentos"
3. El profesional puede:
   - **Subir documento:**
     - Selecciona archivo (imagen, PDF, video)
     - Selecciona tipo (Radiografía, Fotografía, Estudio, Consentimiento, Otro)
     - Agrega descripción
     - El sistema sube el archivo al almacenamiento local/nube
   - **Ver documento:**
     - Visualizador integrado para imágenes y PDFs
     - Herramientas de zoom y anotación
   - **Eliminar documento:**
     - El sistema solicita confirmación
     - Se realiza eliminación lógica
4. El sistema organiza documentos por tipo y fecha

**Flujos Alternativos:**
- **3a.** Archivo muy grande: El sistema comprime automáticamente
- **3b.** Formato no soportado: El sistema muestra error

**Tecnologías:** File upload, AWS S3/Local Storage, Angular, Flask

---

### CU-PRO-08: Crear y Gestionar Presupuestos

**Actor:** Profesional Odontólogo  
**Precondiciones:** Usuario autenticado, paciente seleccionado  
**Postcondiciones:** Presupuesto creado y enviado al paciente

**Flujo Principal:**
1. El profesional accede al módulo de Presupuestos
2. Crea nuevo presupuesto para el paciente:
   - Selecciona servicios del catálogo
   - Para cada servicio indica:
     - Cantidad
     - Precio unitario (editable)
     - Descuento (opcional)
   - El sistema calcula automáticamente:
     - Subtotal por servicio
     - Total general
     - Descuentos aplicados
3. El profesional agrega:
   - Observaciones
   - Validez del presupuesto
   - Condiciones de pago
4. El profesional guarda el presupuesto
5. El sistema permite:
   - Imprimir presupuesto
   - Enviar por email al paciente
   - Generar link para acceso desde PWA
6. El paciente puede aceptar/rechazar desde el portal

**Flujos Alternativos:**
- **3a.** El profesional puede crear plantillas de presupuestos frecuentes

**Tecnologías:** Angular, Marshmallow (validación), PostgreSQL

---

### CU-PRO-09: Emitir Recetas Médicas

**Actor:** Profesional Odontólogo  
**Precondiciones:** Usuario autenticado, paciente seleccionado  
**Postcondiciones:** Receta emitida y registrada

**Flujo Principal:**
1. El profesional accede a Historia Clínica del paciente
2. Selecciona la pestaña "Recetas"
3. Crea nueva receta:
   - Fecha de emisión
   - Diagnóstico
   - Para cada medicamento:
     - Nombre del medicamento
     - Presentación
     - Dosis
     - Frecuencia
     - Duración del tratamiento
     - Indicaciones especiales
4. El profesional revisa la receta
5. El sistema genera la receta en formato imprimible con:
   - Datos del profesional (nombre, matrícula)
   - Datos del paciente
   - Medicamentos prescriptos
   - Firma digital del profesional
6. El profesional puede:
   - Imprimir receta
   - Enviar por email
   - Guardar en historia clínica
7. El sistema registra la receta en el timeline

**Flujos Alternativos:**
- **3a.** El profesional puede usar plantillas de recetas frecuentes
- **6a.** El profesional puede anular una receta (requiere motivo)

**Tecnologías:** Angular, PDF generation, PostgreSQL

---

### CU-PRO-10: Gestionar Consentimientos Informados

**Actor:** Profesional Odontólogo  
**Precondiciones:** Usuario autenticado, paciente seleccionado  
**Postcondiciones:** Consentimiento firmado y archivado

**Flujo Principal:**
1. El profesional accede a Historia Clínica del paciente
2. Selecciona la pestaña "Consentimientos"
3. Crea nuevo consentimiento:
   - Selecciona tipo de procedimiento
   - El sistema carga plantilla predefinida con:
     - Descripción del procedimiento
     - Riesgos y beneficios
     - Alternativas de tratamiento
     - Cuidados post-procedimiento
   - El profesional puede editar el contenido
4. El profesional solicita firma del paciente:
   - El paciente lee el consentimiento
   - El paciente firma digitalmente
   - El profesional firma como testigo
5. El sistema guarda el consentimiento con estado "signed"
6. Se genera PDF con las firmas
7. Se registra en el timeline

**Flujos Alternativos:**
- **4a.** El paciente rechaza el consentimiento: Se registra con estado "rejected"
- **5a.** El profesional puede anular un consentimiento

**Tecnologías:** SignaturePadComponent, PDF generation, PostgreSQL

---

### CU-PRO-11: Consultar Timeline de Eventos

**Actor:** Profesional Odontólogo  
**Precondiciones:** Usuario autenticado, paciente seleccionado  
**Postcondiciones:** Timeline consultado

**Flujo Principal:**
1. El profesional accede a Historia Clínica del paciente
2. Selecciona la pestaña "Historial"
3. El sistema muestra el timeline cronológico con todos los eventos:
   - Citas realizadas
   - Evoluciones clínicas
   - Presupuestos emitidos
   - Recetas prescriptas
   - Documentos subidos
   - Consentimientos firmados
   - Pagos realizados
4. Para cada evento se muestra:
   - Fecha y hora
   - Tipo de evento
   - Profesional responsable
   - Resumen del evento
   - Link para ver detalles
5. El profesional puede filtrar por:
   - Tipo de evento
   - Rango de fechas
   - Profesional

**Tecnologías:** Angular, Timeline component, PostgreSQL

---

### CU-PRO-12: Registrar Pagos

**Actor:** Profesional Odontólogo  
**Precondiciones:** Usuario autenticado, presupuesto aceptado  
**Postcondiciones:** Pago registrado en el sistema

**Flujo Principal:**
1. El profesional accede al módulo de Pagos
2. Selecciona el paciente y presupuesto
3. Registra el pago:
   - Monto
   - Método de pago (Efectivo, Tarjeta, Transferencia)
   - Fecha de pago
   - Número de comprobante (si aplica)
   - Observaciones
4. El sistema:
   - Actualiza el saldo del presupuesto
   - Genera recibo de pago
   - Registra en el timeline
5. El profesional puede:
   - Imprimir recibo
   - Enviar recibo por email

**Flujos Alternativos:**
- **3a.** Pago parcial: El sistema calcula saldo pendiente
- **3b.** Pago con descuento: El profesional aplica descuento y justifica

**Tecnologías:** Angular, Flask, PostgreSQL

---

## 5. Diagrama de Casos de Uso

> **Nota:** Si los diagramas Mermaid no se visualizan en Azure DevOps Wiki, consulte las tablas HTML a continuación que muestran la misma información.

### 5.1 Diagrama Mermaid - Administrador

::: mermaid
graph LR
    A[Administrador] --> B[Gestionar Usuarios]
    A --> C[Gestionar Profesionales]
    A --> D[Configurar Sistema]
    A --> E[Generar Reportes]
    A --> F[Auditar Acciones]
    A --> G[Gestionar Backups]
    A --> H[Gestionar Servicios]
:::

#### Tabla de Casos de Uso - Administrador (Azure DevOps Wiki)

<table>
<tr>
<td colspan="2" align="center" style="background-color:#e1f5ff; font-weight:bold; padding:10px;">
👤 ADMINISTRADOR
</td>
</tr>
<tr>
<td width="50%" valign="top">

**Gestión de Usuarios y Profesionales**
- 🔹 CU-ADM-01: Gestionar Usuarios del Sistema
- 🔹 CU-ADM-02: Gestionar Profesionales
- 🔹 CU-ADM-07: Gestionar Presupuestos y Servicios

</td>
<td width="50%" valign="top">

**Configuración y Monitoreo**
- 🔹 CU-ADM-03: Configurar Sistema
- 🔹 CU-ADM-04: Generar Reportes y Estadísticas
- 🔹 CU-ADM-05: Auditar Acciones del Sistema
- 🔹 CU-ADM-06: Gestionar Backups y Sincronización

</td>
</tr>
</table>

---

### 5.2 Diagrama Mermaid - Profesional Odontólogo

::: mermaid
graph LR
    P[Profesional Odontologo] --> A[Gestionar Agenda]
    P --> B[Gestionar Pacientes]
    P --> C[Registrar Anamnesis]
    P --> D[Registrar Evolucion]
    P --> E[Gestionar Odontograma]
    P --> F[Gestionar Periodontograma]
    P --> G[Gestionar Documentos]
    P --> H[Crear Presupuestos]
    P --> I[Emitir Recetas]
    P --> J[Gestionar Consentimientos]
    P --> K[Consultar Timeline]
    P --> L[Registrar Pagos]
:::

#### Tabla de Casos de Uso - Profesional Odontólogo (Azure DevOps Wiki)

<table>
<tr>
<td colspan="3" align="center" style="background-color:#e8f5e9; font-weight:bold; padding:10px;">
👨‍⚕️ PROFESIONAL ODONTÓLOGO
</td>
</tr>
<tr>
<td width="33%" valign="top">

**Gestión Administrativa**
- 🔹 CU-PRO-01: Gestionar Agenda de Citas
- 🔹 CU-PRO-02: Gestionar Pacientes
- 🔹 CU-PRO-08: Crear y Gestionar Presupuestos
- 🔹 CU-PRO-12: Registrar Pagos

</td>
<td width="33%" valign="top">

**Historia Clínica**
- 🔹 CU-PRO-03: Registrar Anamnesis
- 🔹 CU-PRO-04: Registrar Evolución Clínica
- 🔹 CU-PRO-05: Gestionar Odontograma
- 🔹 CU-PRO-06: Gestionar Periodontograma
- 🔹 CU-PRO-11: Consultar Timeline de Eventos

</td>
<td width="33%" valign="top">

**Documentación Clínica**
- 🔹 CU-PRO-07: Gestionar Documentos y Radiografías
- 🔹 CU-PRO-09: Emitir Recetas Médicas
- 🔹 CU-PRO-10: Gestionar Consentimientos Informados

</td>
</tr>
</table>

---

## Resumen de Casos de Uso

### Administrador (7 casos de uso)
1. Gestionar Usuarios del Sistema
2. Gestionar Profesionales
3. Configurar Sistema
4. Generar Reportes y Estadísticas
5. Auditar Acciones del Sistema
6. Gestionar Backups y Sincronización
7. Gestionar Presupuestos y Servicios

### Profesional Odontólogo (12 casos de uso)
1. Gestionar Agenda de Citas
2. Gestionar Pacientes
3. Registrar Historia Clínica - Anamnesis
4. Registrar Evolución Clínica
5. Gestionar Odontograma
6. Gestionar Periodontograma
7. Gestionar Documentos y Radiografías
8. Crear y Gestionar Presupuestos
9. Emitir Recetas Médicas
10. Gestionar Consentimientos Informados
11. Consultar Timeline de Eventos
12. Registrar Pagos

---

**Documento preparado para:**  
Medical-Services - Sistema Integral de Gestión Clínica  
DataBoost Paraguay  
Diciembre 2025
