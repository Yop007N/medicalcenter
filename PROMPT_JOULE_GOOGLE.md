# Prompt para Trabajar con Joule de Google

## 🎯 Contexto del Proyecto

**Nombre del Proyecto:** Medical Services Platform  
**Tecnologías Principales:**
- **Backend:** NestJS, TypeScript, PostgreSQL, TypeORM
- **Frontend:** Angular 18, TypeScript, RxJS
- **Infraestructura:** Docker, Docker Compose
- **Testing:** Jest, Playwright (E2E)

**Descripción:** Plataforma integral de gestión médica que incluye gestión de pacientes, historias clínicas, citas médicas, facturación y análisis de datos.

---

## 📋 Instrucciones Generales para Joule

### Estilo de Comunicación
- Responde en **español** de manera clara y profesional
- Sé **conciso** pero completo en tus explicaciones
- Proporciona **ejemplos de código** cuando sea relevante
- Usa **formato markdown** para mejor legibilidad
- Incluye **emojis** para mejorar la experiencia visual

### Principios de Desarrollo
1. **Clean Code:** Código limpio, legible y mantenible
2. **SOLID:** Aplicar principios SOLID en todo el código
3. **DRY:** No repetir código (Don't Repeat Yourself)
4. **Testing:** Siempre considerar la testabilidad del código
5. **Documentación:** Documentar funciones y componentes complejos
6. **Seguridad:** Validar inputs, sanitizar datos, proteger endpoints

### Convenciones de Código

#### TypeScript/NestJS (Backend)
```typescript
// Nombres de clases: PascalCase
export class PatientService { }

// Nombres de métodos/variables: camelCase
async findPatientById(id: string): Promise<Patient> { }

// Constantes: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;

// Interfaces: PascalCase con prefijo 'I' opcional
interface IPatientData { }
```

#### Angular (Frontend)
```typescript
// Componentes: kebab-case en archivos, PascalCase en clases
// patient-list.component.ts
export class PatientListComponent { }

// Servicios: kebab-case en archivos, PascalCase con sufijo 'Service'
// patient.service.ts
export class PatientService { }

// Observables: sufijo '$'
patients$: Observable<Patient[]>;
```

---

## 🔧 Tareas Comunes

### 1. Crear un Nuevo Endpoint en el Backend

**Prompt Ejemplo:**
```
Necesito crear un nuevo endpoint en el backend para [DESCRIPCIÓN].

Requisitos:
- Método HTTP: [GET/POST/PUT/DELETE/PATCH]
- Ruta: /api/[recurso]/[acción]
- Autenticación: [Sí/No] - Roles permitidos: [admin, doctor, patient]
- Validación: [Describir validaciones necesarias]
- Respuesta esperada: [Describir estructura de respuesta]

Por favor, genera:
1. El DTO (Data Transfer Object) con validaciones
2. El método en el servicio
3. El endpoint en el controlador
4. Tests unitarios básicos
```

### 2. Crear un Nuevo Componente en Angular

**Prompt Ejemplo:**
```
Necesito crear un componente Angular para [DESCRIPCIÓN].

Especificaciones:
- Nombre: [nombre-del-componente]
- Módulo: [nombre del módulo]
- Funcionalidad: [Describir funcionalidad]
- Inputs: [Listar @Input() si aplica]
- Outputs: [Listar @Output() si aplica]
- Servicios necesarios: [Listar servicios a inyectar]

Por favor, genera:
1. El componente TypeScript con lógica
2. El template HTML
3. Los estilos CSS/SCSS
4. El test spec básico
```

### 3. Debugging y Resolución de Errores

**Prompt Ejemplo:**
```
Estoy teniendo el siguiente error:

[COPIAR ERROR COMPLETO]

Contexto:
- Archivo: [ruta del archivo]
- Línea: [número de línea]
- Acción que genera el error: [describir qué estabas haciendo]
- Stack trace: [si está disponible]

¿Puedes ayudarme a identificar la causa y proponer una solución?
```

### 4. Refactorización de Código

**Prompt Ejemplo:**
```
Necesito refactorizar el siguiente código para mejorar [legibilidad/performance/mantenibilidad]:

[PEGAR CÓDIGO]

Objetivos:
- Aplicar principios SOLID
- Mejorar la testabilidad
- Reducir complejidad ciclomática
- [Otros objetivos específicos]

Por favor, proporciona la versión refactorizada con explicación de los cambios.
```

### 5. Implementar Tests

**Prompt Ejemplo:**
```
Necesito crear tests para [componente/servicio/controlador]:

[PEGAR CÓDIGO A TESTEAR]

Tipo de tests:
- [ ] Unitarios (Jest)
- [ ] Integración
- [ ] E2E (Playwright)

Casos a cubrir:
1. [Caso de éxito]
2. [Caso de error]
3. [Casos edge]

Por favor, genera los tests con mocks apropiados.
```

### 6. Optimización de Consultas a Base de Datos

**Prompt Ejemplo:**
```
Tengo la siguiente consulta que está siendo lenta:

[PEGAR CÓDIGO DE LA CONSULTA]

Contexto:
- Tabla(s) involucrada(s): [nombres]
- Volumen de datos: [aproximado]
- Tiempo actual: [X segundos]
- Objetivo: [Y segundos]

¿Puedes sugerir optimizaciones? Considera:
- Índices necesarios
- Uso de joins vs queries separadas
- Paginación
- Caching
```

### 7. Implementar Validaciones

**Prompt Ejemplo:**
```
Necesito implementar validaciones para [formulario/endpoint]:

Campos a validar:
- [campo1]: [tipo] - [reglas de validación]
- [campo2]: [tipo] - [reglas de validación]

Validaciones necesarias:
- Frontend (Angular Reactive Forms)
- Backend (class-validator)

Por favor, genera ambas implementaciones.
```

---

## 🎨 Patrones de Diseño Preferidos

### Backend (NestJS)
- **Repository Pattern:** Para acceso a datos
- **Service Layer:** Lógica de negocio separada
- **DTO Pattern:** Para transferencia de datos
- **Dependency Injection:** Usar el sistema DI de NestJS
- **Guards:** Para autenticación y autorización
- **Interceptors:** Para logging, transformación de respuestas
- **Pipes:** Para validación y transformación

### Frontend (Angular)
- **Smart/Dumb Components:** Separar componentes contenedores de presentacionales
- **Observable Pattern:** Usar RxJS para manejo de estado asíncrono
- **Service Pattern:** Servicios para lógica de negocio y comunicación HTTP
- **Reactive Forms:** Para formularios complejos
- **Route Guards:** Para protección de rutas
- **Interceptors:** Para manejo de tokens, errores HTTP

---

## 📚 Documentación de Referencia

Cuando necesites consultar documentación oficial, menciona:
- NestJS: https://docs.nestjs.com/
- Angular: https://angular.dev/
- TypeORM: https://typeorm.io/
- RxJS: https://rxjs.dev/
- Playwright: https://playwright.dev/

---

## 🚀 Workflow de Desarrollo

### Para Nuevas Features
```
1. Analizar requisitos
2. Diseñar solución (arquitectura, modelos, flujos)
3. Implementar backend (modelos, servicios, controladores)
4. Implementar frontend (servicios, componentes, rutas)
5. Crear tests
6. Documentar
7. Code review
```

### Para Bugs
```
1. Reproducir el error
2. Identificar causa raíz
3. Proponer solución
4. Implementar fix
5. Crear test de regresión
6. Verificar que no rompe funcionalidad existente
```

---

## 💡 Tips para Mejores Resultados

1. **Sé específico:** Cuanto más contexto proporciones, mejor será la respuesta
2. **Incluye código:** Pega el código relevante cuando hagas preguntas
3. **Menciona restricciones:** Si hay limitaciones (tiempo, recursos, tecnología), menciónalo
4. **Pide explicaciones:** No dudes en pedir que se explique el "por qué" de una solución
5. **Itera:** Si la primera respuesta no es exactamente lo que necesitas, refina tu pregunta
6. **Valida sugerencias:** Siempre revisa y entiende el código antes de aplicarlo

---

## 🎯 Ejemplo de Prompt Completo

```
Hola Joule 👋

Estoy trabajando en el proyecto Medical Services Platform y necesito tu ayuda con lo siguiente:

**Contexto:**
Estoy implementando la funcionalidad de gestión de citas médicas. Ya tengo el modelo de datos y el CRUD básico funcionando.

**Objetivo:**
Necesito agregar una funcionalidad para enviar recordatorios automáticos de citas por email 24 horas antes de la cita.

**Requisitos técnicos:**
- Backend: NestJS con TypeORM
- Usar un sistema de colas (Bull/BullMQ)
- Integrar con servicio de email (NodeMailer)
- Crear un cron job que se ejecute cada hora
- Registrar logs de emails enviados

**Entregables esperados:**
1. Configuración del módulo de colas
2. Servicio de emails con template
3. Cron job para verificar citas próximas
4. Job processor para enviar emails
5. Tests unitarios básicos

**Restricciones:**
- Debe ser escalable (preparado para muchas citas)
- Manejo de errores robusto (reintentos, dead letter queue)
- No enviar duplicados

¿Puedes ayudarme con la implementación paso a paso?
```

---

## 📝 Plantilla Rápida

```
**Tarea:** [Describir brevemente]

**Contexto:** [Información relevante del proyecto]

**Requisitos:**
- [Requisito 1]
- [Requisito 2]
- [Requisito 3]

**Código actual (si aplica):**
[Pegar código]

**Resultado esperado:**
[Describir qué esperas obtener]

**Restricciones/Consideraciones:**
[Limitaciones o puntos importantes]
```

---

## 🔐 Seguridad y Mejores Prácticas

Siempre considera:
- ✅ Validación de inputs
- ✅ Sanitización de datos
- ✅ Autenticación y autorización
- ✅ Protección contra SQL Injection
- ✅ Protección contra XSS
- ✅ Rate limiting
- ✅ CORS configurado correctamente
- ✅ Secrets en variables de entorno
- ✅ Logging apropiado (sin exponer datos sensibles)
- ✅ Manejo de errores sin exponer detalles internos

---

**Última actualización:** 2026-01-10  
**Versión:** 1.0  
**Autor:** Medical Services Team
