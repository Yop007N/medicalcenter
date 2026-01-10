# Medical Services - Guía de Continuación del Proyecto

## Estado Actual del Proyecto

Sistema de gestión médica con:
- **Backend**: Flask + SQLAlchemy + PostgreSQL
- **Frontend**: Angular 17 + Ionic 8 + NgRx

### Funcionalidades Implementadas ✅
- [x] Autenticación JWT con refresh tokens
- [x] Gestión de Pacientes (CRUD completo)
- [x] Gestión de Profesionales (CRUD completo)
- [x] Gestión de Citas/Appointments (CRUD completo)
- [x] Gestión de Presupuestos/Budgets (CRUD completo)
- [x] Notificación de sesión por expirar
- [x] Paginación en listados
- [x] Módulo de Odontología
- [x] Módulo de Psicología
- [x] Módulo de Psicopedagogía
- [x] Módulo de Registros Médicos
- [x] Módulo de Archivos/Files
- [x] Módulo de Pagos/Payments
- [x] Módulo de Auditoría
- [x] Módulo de Reportes
- [x] **Historia Clínica Odontológica (estructura base):**
  - [x] Backend: Modelos, Schemas, Endpoints REST
  - [x] Frontend: Página principal + 9 pestañas
  - [x] Servicio HTTP creado
  - [x] **Migración de BD ejecutada** (2025-12-05)
  - [x] **Componentes conectados con API** (2025-12-05)
    - evolutions-tab, anamnesis-tab, history-tab
    - prescriptions-tab, documents-tab, consents-tab

### Problemas Pendientes:

#### 1. Totales en formulario de presupuestos ✅ RESUELTO
**SOLUCION APLICADA (2025-12-05):**
- Cambiado inputs de `type="number"` a `type="text"` con `inputmode="numeric/decimal"`
- Usando `[value]` binding explícito en lugar de solo `formControlName`
- Manejo manual de eventos `ionInput` para actualizar el formulario y recalcular
- Los totales ahora se muestran correctamente al crear y editar presupuestos

#### 2. Historia Clínica - Estado actual ✅ COMPLETADO
- [x] ~~Ejecutar migración de BD para historia clínica~~ ✅
- [x] ~~Conectar componentes frontend con el servicio HTTP~~ ✅
- [x] ~~Implementar firma digital~~ ✅ (componente SignaturePad creado)
- [x] ~~Integrar subida de archivos con módulo Files~~ ✅ (endpoint upload con FormData)
- [x] ~~Implementar periodontograma interactivo~~ ✅ (SVG con color coding)
- [x] ~~Integrar odontograma visual~~ ✅ (conectado con OdontogramService)
- [x] Ver detalles en: `CLINICAL_HISTORY_IMPLEMENTATION.md`

---

## Instrucciones de Inicialización

### 1. Iniciar Docker (PostgreSQL)

```powershell
# Abrir Docker Desktop primero (si no está corriendo)
# Luego en terminal:
cd C:\pgxDev\medical-services
docker-compose up -d
```

Verificar que el contenedor está corriendo:
```powershell
docker ps
```

Debe mostrar el contenedor `medical-services-postgres` corriendo en el puerto 5433.

### 2. Iniciar Backend (Flask)

```powershell
cd C:\pgxDev\medical-services\backend
.\venv\Scripts\activate
python -m flask run --host=127.0.0.1 --port=5000
```

El backend estará disponible en: `http://127.0.0.1:5000`

### 3. Iniciar Frontend (Angular/Ionic)

```powershell
cd C:\pgxDev\medical-services\frontend
npm run start
```

El frontend estará disponible en: `http://localhost:4200`

---

## Credenciales de Prueba

- **Usuario**: admin@medical.com
- **Contraseña**: admin123

---

## Estructura del Proyecto

```
C:\pgxDev\medical-services\
├── backend\
│   ├── app\
│   │   ├── __init__.py (configuración Flask)
│   │   ├── models\ (modelos SQLAlchemy)
│   │   └── routes\ (endpoints API)
│   ├── venv\ (entorno virtual Python)
│   └── requirements.txt
├── frontend\
│   ├── src\
│   │   └── app\
│   │       ├── features\ (páginas por módulo)
│   │       ├── store\ (NgRx: actions, effects, reducers, selectors)
│   │       ├── models\ (interfaces TypeScript)
│   │       └── core\ (servicios compartidos)
│   └── package.json
└── docker-compose.yml
```

---

## Tarea Pendiente Principal

### Arreglar cálculo de totales en edición de presupuestos

**Archivo a modificar**:
`C:\pgxDev\medical-services\frontend\src\app\features\budgets\budget-form\budget-form.page.ts`

**Problema**:
- Los inputs de tipo number no actualizan correctamente la vista
- Los valores están en el formulario pero no se reflejan en el cálculo del template

**Posibles soluciones a probar**:
1. Usar `[value]` binding además de formControlName
2. Cambiar de type="number" a type="text" con inputmode="decimal"
3. Usar trackBy con un identificador único en lugar de $index
4. Forzar la detección de cambios con un enfoque diferente

**Código actual del cálculo**:
```typescript
calculateItemTotal(index: number): number {
  const item = this.items.at(index);
  const quantity = this.getNumber(item.get('quantity')?.value);
  const unitPrice = this.getNumber(item.get('unit_price')?.value);
  return quantity * unitPrice;
}
```

---

## Prompt para Claude Code

```
Continúo trabajando en el proyecto medical-services. El problema actual es que en el formulario de edición de presupuestos (budget-form.page.ts), los totales muestran 0 aunque los campos tienen valores.

Archivos relevantes:
- C:\pgxDev\medical-services\frontend\src\app\features\budgets\budget-form\budget-form.page.ts

El problema específico:
1. Al editar un presupuesto existente, los campos de cantidad y precio unitario tienen valores pero los totales muestran 0
2. Los inputs type="number" con formControlName no parecen actualizar la vista correctamente en Ionic

Por favor revisa el archivo y arregla el cálculo de totales para que funcione correctamente tanto al crear como al editar presupuestos.
```

---

## Comandos Útiles

### Ver logs del backend
```powershell
# Los logs aparecen en la misma terminal donde corre Flask
```

### Ver logs de Docker
```powershell
docker logs medical-services-postgres
```

### Reiniciar todo
```powershell
# Detener frontend: Ctrl+C en su terminal
# Detener backend: Ctrl+C en su terminal
# Reiniciar Docker:
docker-compose down
docker-compose up -d
```

### Ejecutar migraciones de BD (si es necesario)
```powershell
cd C:\pgxDev\medical-services\backend
.\venv\Scripts\activate
.\venv\Scripts\alembic upgrade head
```
