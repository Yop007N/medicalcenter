# Tareas Pendientes - Medical Services

**Fecha:** 5 de Diciembre 2025

---

## 1. Bug: Odontograma no funciona

### Descripcion del problema
Al hacer clic en un diente del odontograma, aparece el error "Error interno del servidor".

### Logs del backend
```
127.0.0.1 - - [05/Dec/2025 17:03:09] "OPTIONS /api/odontograms/3/teeth/12 HTTP/1.1" 404 -
```

### Causa identificada
El frontend llama a `PUT /api/odontograms/{id}/teeth/{tooth_number}` (plural "teeth"), pero el backend originalmente solo tenia rutas con "tooth" (singular).

### Cambios ya realizados
Se agregaron rutas alternativas en `backend/app/resources/odontograms.py`:

1. **Rutas GET con "teeth" plural** (linea ~457):
```python
@blueprint.route('/<int:odontogram_id>/tooth/<int:tooth_number>', methods=['GET'])
@blueprint.route('/<int:odontogram_id>/teeth/<int:tooth_number>', methods=['GET'])
```

2. **Nuevo endpoint PUT** (linea ~492-587):
```python
@blueprint.route('/<int:odontogram_id>/tooth/<int:tooth_number>', methods=['PUT'])
@blueprint.route('/<int:odontogram_id>/teeth/<int:tooth_number>', methods=['PUT'])
def update_tooth(odontogram_id, tooth_number):
    # Actualiza o crea un diente
```

3. **Rutas DELETE con "teeth" plural** (linea ~590):
```python
@blueprint.route('/<int:odontogram_id>/tooth/<int:tooth_number>', methods=['DELETE'])
@blueprint.route('/<int:odontogram_id>/teeth/<int:tooth_number>', methods=['DELETE'])
```

### Proximos pasos para depurar
1. **Reiniciar el servidor Flask** - Asegurarse de que los cambios se cargaron
2. **Verificar logs del backend** - Ver si ahora responde 200 o sigue dando error
3. **Revisar el frontend** - Verificar que datos envia al hacer PUT:
   - Archivo: `frontend/src/app/store/odontology/odontology.effects.ts` (linea 73-88)
4. **Verificar autenticacion** - El endpoint requiere JWT, asegurar que el token se envia
5. **Probar con curl/Postman** - Testear el endpoint directamente:
```bash
curl -X PUT http://localhost:5000/api/odontograms/3/teeth/12 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "caries"}'
```

### Archivos relevantes
- Backend: `backend/app/resources/odontograms.py`
- Backend modelo: `backend/app/models/odontogram.py`
- Frontend effects: `frontend/src/app/store/odontology/odontology.effects.ts`
- Frontend componente: `frontend/src/app/features/odontology/`

---

## 2. Tests E2E Pendientes

### Ubicacion de tests
```
frontend/e2e/
```

### Comando para ejecutar tests
```bash
cd frontend
npx playwright test --config=e2e/playwright.config.ts --project=chromium
```

### Tests a crear/revisar

#### Modulo Odontologia
- [ ] Test de visualizacion del odontograma
- [ ] Test de click en diente y actualizacion de estado
- [ ] Test de creacion de nuevo odontograma
- [ ] Test de tratamientos dentales CRUD

#### Modulo Pacientes
- [ ] Test de lista de pacientes
- [ ] Test de creacion de paciente
- [ ] Test de edicion de paciente
- [ ] Test de detalle de paciente

#### Modulo Citas
- [ ] Test de calendario de citas
- [ ] Test de creacion de cita
- [ ] Test de edicion/cancelacion de cita

#### Modulo Presupuestos
- [ ] Test de lista de presupuestos
- [ ] Test de creacion de presupuesto
- [ ] Test de visualizacion de items

#### Modulo Pagos
- [ ] Test de registro de pago
- [ ] Test de lista de pagos

---

## 3. Mejoras de Formularios Completadas

Se actualizaron los siguientes formularios con layout de 2 columnas responsivo:

- [x] `payment-form.page.ts` - Moneda default: PYG
- [x] `budget-form.page.ts` - Moneda default: PYG
- [x] `budgets-list.page.ts` - Display en PYG
- [x] `treatment-form.page.ts` - Layout 2 columnas completo
- [x] `appointment-form.page.ts` - Inputs de fecha/hora clasicos

---

## 4. Notas Adicionales

### Servidor Backend
```bash
cd backend
.\venv\Scripts\activate
python -m flask run --host=127.0.0.1 --port=5000
```

### Servidor Frontend
```bash
cd frontend
npm run start
```

### Base de datos
- PostgreSQL
- Migraciones con Flask-Migrate

### Credenciales de prueba
- Email: admin@medical.com
- Password: (verificar en seed o .env)

---

## 5. Prioridades para manana

1. **ALTA** - Arreglar el bug del odontograma
2. **MEDIA** - Crear tests E2E basicos para flujos principales
3. **BAJA** - Revisar otros formularios que necesiten mejoras de layout
