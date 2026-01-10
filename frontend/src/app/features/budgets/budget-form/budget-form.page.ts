import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonList,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonNote
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { saveOutline, addCircleOutline, trashOutline } from 'ionicons/icons';
import * as BudgetsActions from '../../../store/budgets/budgets.actions';
import * as PatientsActions from '../../../store/patients/patients.actions';
import { selectSelectedBudget, selectBudgetsLoading, selectBudgetsError } from '../../../store/budgets/budgets.selectors';
import { selectAllPatients } from '../../../store/patients/patients.selectors';
import { BudgetCreate, BudgetUpdate } from '../../../models/budget.model';

@Component({
  selector: 'app-budget-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonText,
    IonList,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonNote
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/budgets"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ isEdit ? 'Editar' : 'Nuevo' }} Presupuesto</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="save()" [disabled]="!form.valid || items.length === 0 || (loading$ | async)">
            <ion-icon slot="icon-only" name="save-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (loading$ | async) {
        <div class="ion-text-center ion-padding">
          <ion-spinner name="crescent"></ion-spinner>
          <p>{{ isEdit ? 'Cargando...' : 'Guardando...' }}</p>
        </div>
      } @else {
        <div class="form-container">
          <form [formGroup]="form">
            <div class="form-grid">
              <!-- Left Column - Basic Info -->
              <div class="form-column">
                <!-- Información Básica -->
                <div class="form-section">
                  <h3 class="section-title">Información Básica</h3>
                  <div class="form-row">
                    <div class="form-field full-width">
                      <ion-item>
                        <ion-input
                          formControlName="title"
                          label="Título *"
                          labelPlacement="stacked"
                          placeholder="Ej: Tratamiento dental completo"
                        ></ion-input>
                      </ion-item>
                      @if (form.get('title')?.invalid && form.get('title')?.touched) {
                        <ion-note color="danger">El título es requerido</ion-note>
                      }
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-field full-width">
                      <ion-item>
                        <ion-select
                          formControlName="patient_id"
                          label="Paciente *"
                          labelPlacement="stacked"
                          placeholder="Seleccione paciente"
                        >
                          @for (patient of patients$ | async; track patient.id) {
                            <ion-select-option [value]="patient.id">
                              {{ patient.first_name }} {{ patient.last_name }}
                            </ion-select-option>
                          }
                        </ion-select>
                      </ion-item>
                      @if (form.get('patient_id')?.invalid && form.get('patient_id')?.touched) {
                        <ion-note color="danger">El paciente es requerido</ion-note>
                      }
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-field full-width">
                      <ion-item>
                        <ion-textarea
                          formControlName="description"
                          label="Descripción"
                          labelPlacement="stacked"
                          placeholder="Descripción detallada del presupuesto"
                          [autoGrow]="true"
                          rows="3"
                        ></ion-textarea>
                      </ion-item>
                    </div>
                  </div>
                </div>

                <!-- Configuración -->
                <div class="form-section">
                  <h3 class="section-title">Configuración</h3>
                  <div class="form-row">
                    <div class="form-field">
                      <ion-item>
                        <ion-select
                          formControlName="currency"
                          label="Moneda"
                          labelPlacement="stacked"
                        >
                          <ion-select-option value="PYG">PYG - Guaraní Paraguayo</ion-select-option>
                          <ion-select-option value="USD">USD - Dólar Estadounidense</ion-select-option>
                          <ion-select-option value="EUR">EUR - Euro</ion-select-option>
                          <ion-select-option value="ARS">ARS - Peso Argentino</ion-select-option>
                          <ion-select-option value="BRL">BRL - Real Brasileño</ion-select-option>
                        </ion-select>
                      </ion-item>
                    </div>
                    <div class="form-field">
                      <ion-item>
                        <ion-input
                          formControlName="valid_until"
                          type="date"
                          label="Válido hasta"
                          labelPlacement="stacked"
                        ></ion-input>
                      </ion-item>
                    </div>
                  </div>
                </div>

                <!-- Total Card (visible on mobile at bottom, on desktop in sidebar) -->
                <div class="total-card-mobile">
                  <ion-card color="primary">
                    <ion-card-content>
                      <div class="total-section">
                        <span>TOTAL</span>
                        <span class="total-amount">{{ grandTotal | currency:selectedCurrency:'symbol':'1.2-2' }}</span>
                      </div>
                    </ion-card-content>
                  </ion-card>
                </div>
              </div>

              <!-- Right Column - Items -->
              <div class="form-column items-column">
                <!-- Items -->
                <div class="form-section items-section">
                  <div class="section-header">
                    <h3 class="section-title">Ítems del Presupuesto</h3>
                    <ion-button fill="clear" size="small" (click)="addItem()">
                      <ion-icon slot="start" name="add-circle-outline"></ion-icon>
                      Agregar
                    </ion-button>
                  </div>

                  <div formArrayName="items">
                    @if (items.length === 0) {
                      <ion-text color="medium">
                        <p class="ion-text-center">No hay ítems. Agregue al menos uno.</p>
                      </ion-text>
                    }

                    @for (item of items.controls; track trackByItemId($index, item); let i = $index) {
                      <div class="item-row" [formGroupName]="i">
                        <div class="item-header">
                          <span class="item-number">Ítem {{ i + 1 }}</span>
                          <ion-button fill="clear" color="danger" size="small" (click)="removeItem(i)">
                            <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
                          </ion-button>
                        </div>
                        <ion-item>
                          <ion-input
                            formControlName="description"
                            label="Descripción *"
                            labelPlacement="stacked"
                            placeholder="Ej: Consulta inicial"
                          ></ion-input>
                        </ion-item>
                        <div class="item-numbers">
                          <ion-item>
                            <ion-input
                              type="text"
                              inputmode="numeric"
                              label="Cantidad *"
                              labelPlacement="stacked"
                              placeholder="1"
                              [value]="getItemQuantity(i)"
                              (ionInput)="onQuantityInput($event, i)"
                            ></ion-input>
                          </ion-item>
                          <ion-item>
                            <ion-input
                              type="text"
                              inputmode="decimal"
                              label="Precio Unit. *"
                              labelPlacement="stacked"
                              placeholder="0.00"
                              [value]="getItemUnitPrice(i)"
                              (ionInput)="onUnitPriceInput($event, i)"
                            ></ion-input>
                          </ion-item>
                          <div class="item-total">
                            <span class="item-total-label">Total</span>
                            <span class="item-total-value">{{ getItemTotal(i) | currency:selectedCurrency:'symbol':'1.2-2' }}</span>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                </div>

                <!-- Total Card (visible on desktop only) -->
                <div class="total-card-desktop">
                  <ion-card color="primary">
                    <ion-card-content>
                      <div class="total-section">
                        <span>TOTAL</span>
                        <span class="total-amount">{{ grandTotal | currency:selectedCurrency:'symbol':'1.2-2' }}</span>
                      </div>
                    </ion-card-content>
                  </ion-card>
                </div>
              </div>
            </div>

            @if (error$ | async; as error) {
              <ion-text color="danger">
                <p class="ion-padding">{{ error }}</p>
              </ion-text>
            }

            <!-- Botón de guardar -->
            <div class="save-button-container">
              <button
                type="button"
                class="save-button"
                (click)="onSaveClick()"
              >
                {{ isEdit ? 'Actualizar' : 'Crear' }} Presupuesto
              </button>
            </div>

          </form>
        </div>
      }
    </ion-content>
  `,
  styles: [`
    .form-container {
      max-width: 1400px;
      margin: 0 auto;
    }

    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .form-column {
      width: 100%;
    }

    .form-section {
      background: var(--ion-card-background);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }

    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--ion-color-primary);
      margin: 0 0 16px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--ion-color-primary);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .section-header .section-title {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }

    .form-row {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .form-field {
      flex: 1;
      min-width: 0;
    }

    .form-field.full-width {
      width: 100%;
    }

    .form-field ion-item {
      --background: transparent;
      --padding-start: 0;
    }

    ion-note {
      display: block;
      font-size: 12px;
      margin: 4px 0 8px 0;
      padding-left: 4px;
    }

    /* Items Section */
    .items-section {
      min-height: 300px;
    }

    .item-row {
      background: var(--ion-color-light);
      border-radius: 8px;
      margin-bottom: 12px;
      padding: 12px;
    }

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .item-number {
      font-weight: 600;
      color: var(--ion-color-primary);
      font-size: 14px;
    }

    .item-row ion-item {
      --background: transparent;
      --padding-start: 0;
    }

    .item-numbers {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
      margin-top: 8px;
    }

    .item-total {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 8px;
      background: var(--ion-color-light-shade);
      border-radius: 4px;
    }

    .item-total-label {
      font-size: 12px;
      color: var(--ion-color-medium);
    }

    .item-total-value {
      font-size: 16px;
      font-weight: 600;
      color: var(--ion-color-primary);
    }

    /* Total Section */
    .total-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 18px;
      font-weight: bold;
    }

    .total-amount {
      font-size: 24px;
    }

    .total-card-desktop {
      display: none;
    }

    .total-card-mobile {
      display: block;
    }

    /* Save Button */
    .save-button-container {
      padding: 16px 0 32px;
    }

    .save-button {
      width: 100%;
      padding: 16px 24px;
      font-size: 16px;
      font-weight: 600;
      color: white;
      background: var(--ion-color-primary);
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .save-button:hover {
      background: var(--ion-color-primary-shade);
    }

    .save-button:active {
      background: var(--ion-color-primary-tint);
    }

    ion-card-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    @media (min-width: 768px) {
      .form-grid {
        flex-direction: row;
        gap: 24px;
      }

      .form-column {
        flex: 1;
        min-width: 0;
      }

      .items-column {
        flex: 1.2;
      }

      .form-row {
        flex-direction: row;
        gap: 16px;
      }

      .form-field.full-width {
        flex: 1 1 100%;
      }

      .total-card-desktop {
        display: block;
      }

      .total-card-mobile {
        display: none;
      }
    }

    @media (min-width: 1200px) {
      .form-section {
        padding: 20px;
      }

      .item-row {
        padding: 16px;
      }
    }
  `]
})
export class BudgetFormPage implements OnInit {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  budget$ = this.store.select(selectSelectedBudget);
  loading$ = this.store.select(selectBudgetsLoading);
  error$ = this.store.select(selectBudgetsError);
  patients$ = this.store.select(selectAllPatients);

  form: FormGroup;
  isEdit = false;
  budgetId?: number;

  // Cached totals for each item and grand total
  itemTotals: number[] = [];
  grandTotal = 0;
  private itemIdCounter = 0;

  constructor() {
    addIcons({ saveOutline, addCircleOutline, trashOutline });

    this.form = this.fb.group({
      title: ['', Validators.required],
      patient_id: [null, Validators.required],
      description: [''],
      currency: ['PYG'],
      valid_until: [''],
      items: this.fb.array([])
    });
  }

  get selectedCurrency(): string {
    return this.form.get('currency')?.value || 'PYG';
  }

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  getItemFormGroup(index: number): FormGroup {
    return this.items.at(index) as FormGroup;
  }

  ngOnInit(): void {
    // Load patients for select
    this.store.dispatch(PatientsActions.loadPatients());

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.budgetId = parseInt(id, 10);
      this.store.dispatch(BudgetsActions.loadBudget({ id: this.budgetId }));

      this.budget$.subscribe(budget => {
        if (budget) {
          this.form.patchValue({
            title: budget.title,
            patient_id: budget.patient_id,
            description: budget.description || '',
            currency: budget.currency,
            valid_until: budget.valid_until || ''
          });

          // Clear and add items
          while (this.items.length) {
            this.items.removeAt(0);
          }
          this.itemTotals = [];
          this.grandTotal = 0;

          if (budget.items) {
            budget.items.forEach(item => {
              this.addItemWithValues(
                item.description,
                this.getNumber(item.quantity),
                this.getNumber(item.unit_price)
              );
            });
          }

          // Force change detection after loading items
          this.cdr.detectChanges();
        }
      });
    } else {
      // Check for patient_id in query params (when coming from patient detail)
      const patientId = this.route.snapshot.queryParamMap.get('patient_id');
      if (patientId) {
        this.form.patchValue({ patient_id: parseInt(patientId, 10) });
      }
      // Add one empty item by default
      this.addItem();
    }
  }

  addItem(): void {
    const itemGroup = this.fb.group({
      _id: [++this.itemIdCounter],
      description: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unit_price: [0, [Validators.required, Validators.min(0)]]
    });
    this.items.push(itemGroup);
    this.itemTotals.push(0);
    this.recalculateTotals();
  }

  private addItemWithValues(description: string, quantity: number, unitPrice: number): void {
    const itemGroup = this.fb.group({
      _id: [++this.itemIdCounter],
      description: [description, Validators.required],
      quantity: [quantity, [Validators.required, Validators.min(1)]],
      unit_price: [unitPrice, [Validators.required, Validators.min(0)]]
    });
    this.items.push(itemGroup);
    const itemTotal = quantity * unitPrice;
    this.itemTotals.push(itemTotal);
    this.grandTotal += itemTotal;
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
    this.itemTotals.splice(index, 1);
    this.recalculateTotals();
  }

  trackByItemId(index: number, item: any): number {
    return item.get('_id')?.value ?? index;
  }

  getNumber(value: any): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    if (typeof value === 'number') {
      return value;
    }
    // Replace comma with dot for decimal separator
    const normalized = String(value).replace(',', '.');
    return parseFloat(normalized) || 0;
  }

  getItemTotal(index: number): number {
    return this.itemTotals[index] ?? 0;
  }

  getItemQuantity(index: number): string {
    const item = this.items.at(index);
    const value = item?.get('quantity')?.value;
    return value !== null && value !== undefined ? String(value) : '1';
  }

  getItemUnitPrice(index: number): string {
    const item = this.items.at(index);
    const value = item?.get('unit_price')?.value;
    return value !== null && value !== undefined ? String(value) : '0';
  }

  onQuantityInput(event: any, index: number): void {
    const value = event.detail.value;
    const numValue = this.getNumber(value);
    const item = this.items.at(index);
    item.get('quantity')?.setValue(numValue, { emitEvent: false });
    this.recalculateTotals();
  }

  onUnitPriceInput(event: any, index: number): void {
    const value = event.detail.value;
    const numValue = this.getNumber(value);
    const item = this.items.at(index);
    item.get('unit_price')?.setValue(numValue, { emitEvent: false });
    this.recalculateTotals();
  }

  onItemValueChange(): void {
    this.recalculateTotals();
  }

  recalculateTotals(): void {
    this.grandTotal = 0;
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items.at(i);
      const quantity = this.getNumber(item.get('quantity')?.value);
      const unitPrice = this.getNumber(item.get('unit_price')?.value);
      const itemTotal = quantity * unitPrice;
      this.itemTotals[i] = itemTotal;
      this.grandTotal += itemTotal;
    }
    this.cdr.detectChanges();
  }

  calculateTotal(): number {
    return this.grandTotal;
  }

  onSaveClick(): void {
    console.log('=== BOTON PRESIONADO ===');
    console.log('Form valid:', this.form.valid);
    console.log('Form value:', this.form.value);
    console.log('Items length:', this.items.length);

    // Mark all controls as touched to show validation errors
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      console.log('Form errors:', this.getFormValidationErrors());
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    if (this.items.length === 0) {
      alert('Debe agregar al menos un item');
      return;
    }

    console.log('Calling save()...');
    this.save();
  }

  getFormValidationErrors(): any[] {
    const errors: any[] = [];
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      if (control?.errors) {
        errors.push({ field: key, errors: control.errors });
      }
    });
    // Check items
    this.items.controls.forEach((item, index) => {
      const group = item as FormGroup;
      Object.keys(group.controls).forEach(key => {
        const ctrl = group.get(key);
        if (ctrl?.errors) {
          errors.push({ field: `items[${index}].${key}`, errors: ctrl.errors });
        }
      });
    });
    return errors;
  }

  save(): void {
    console.log('=== SAVE CALLED ===');
    if (this.form.invalid || this.items.length === 0) {
      console.log('Save aborted - invalid form or no items');
      return;
    }

    const formValue = this.form.value;
    const itemsWithTotal = formValue.items.map((item: any) => ({
      description: item.description,
      quantity: parseFloat(item.quantity) || 0,
      unit_price: parseFloat(item.unit_price) || 0,
      total: (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)
    }));

    if (this.isEdit && this.budgetId) {
      const budget: BudgetUpdate = {
        title: formValue.title,
        patient_id: formValue.patient_id,
        description: formValue.description || undefined,
        currency: formValue.currency,
        valid_until: formValue.valid_until || undefined,
        items: itemsWithTotal,
        total_amount: this.calculateTotal()
      };
      console.log('Dispatching updateBudget:', budget);
      this.store.dispatch(BudgetsActions.updateBudget({ id: this.budgetId, budget }));
    } else {
      const budget: BudgetCreate = {
        title: formValue.title,
        patient_id: formValue.patient_id,
        description: formValue.description || undefined,
        currency: formValue.currency,
        valid_until: formValue.valid_until || undefined,
        items: itemsWithTotal,
        total_amount: this.calculateTotal()
      };
      console.log('Dispatching createBudget:', budget);
      this.store.dispatch(BudgetsActions.createBudget({ budget }));
    }
    console.log('=== DISPATCH DONE ===');
  }
}
