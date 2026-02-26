import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { saveOutline } from 'ionicons/icons';
import * as PaymentsActions from '../../../store/payments/payments.actions';
import { selectSelectedPayment, selectPaymentsLoading, selectPaymentsError } from '../../../store/payments/payments.selectors';
import { PaymentCreate, PaymentUpdate } from '../../../models/budget.model';

@Component({
  selector: 'app-payment-form',
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
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonText
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/payments"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ isEdit ? 'Editar' : 'Nuevo' }} Pago</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="save()" [disabled]="!form.valid || (loading$ | async)">
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
              <!-- Left Column -->
              <div class="form-column">
                <!-- Monto y Moneda -->
                <div class="form-section">
                  <h3 class="section-title">Información del Pago</h3>
                  <div class="form-row">
                    <div class="form-field">
                      <ion-item>
                        <ion-input
                          formControlName="amount"
                          type="number"
                          label="Monto *"
                          labelPlacement="stacked"
                          placeholder="0.00"
                          [min]="0.01"
                          step="0.01"
                        ></ion-input>
                      </ion-item>
                      @if (form.get('amount')?.invalid && form.get('amount')?.touched) {
                        <ion-text color="danger">
                          <small>El monto es requerido y debe ser mayor a 0</small>
                        </ion-text>
                      }
                    </div>
                    <div class="form-field">
                      <ion-item>
                        <ion-select
                          formControlName="currency"
                          label="Moneda"
                          labelPlacement="stacked"
                        >
                          <ion-select-option value="PYG">PYG - Guaraní Paraguayo</ion-select-option>
                          <ion-select-option value="USD">USD - Dólar</ion-select-option>
                          <ion-select-option value="EUR">EUR - Euro</ion-select-option>
                          <ion-select-option value="ARS">ARS - Peso Argentino</ion-select-option>
                          <ion-select-option value="BRL">BRL - Real Brasileño</ion-select-option>
                        </ion-select>
                      </ion-item>
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-field">
                      <ion-item>
                        <ion-select
                          formControlName="payment_method"
                          label="Método de Pago *"
                          labelPlacement="stacked"
                          placeholder="Seleccione método"
                        >
                          <ion-select-option value="cash">Efectivo</ion-select-option>
                          <ion-select-option value="card">Tarjeta</ion-select-option>
                          <ion-select-option value="transfer">Transferencia</ion-select-option>
                          <ion-select-option value="check">Cheque</ion-select-option>
                          <ion-select-option value="other">Otro</ion-select-option>
                        </ion-select>
                      </ion-item>
                      @if (form.get('payment_method')?.invalid && form.get('payment_method')?.touched) {
                        <ion-text color="danger">
                          <small>El método de pago es requerido</small>
                        </ion-text>
                      }
                    </div>
                    <div class="form-field">
                      <ion-item>
                        <ion-input
                          formControlName="payment_date"
                          type="datetime-local"
                          label="Fecha de Pago"
                          labelPlacement="stacked"
                        ></ion-input>
                      </ion-item>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right Column -->
              <div class="form-column">
                <!-- Referencia y Asociación -->
                <div class="form-section">
                  <h3 class="section-title">Detalles Adicionales</h3>
                  <div class="form-row">
                    <div class="form-field full-width">
                      <ion-item>
                        <ion-input
                          formControlName="transaction_reference"
                          label="Referencia de Transacción"
                          labelPlacement="stacked"
                          placeholder="Ej: TRX-12345"
                        ></ion-input>
                      </ion-item>
                    </div>
                  </div>

                  @if (!isEdit) {
                    <div class="form-row">
                      <div class="form-field full-width">
                        <ion-item>
                          <ion-input
                            formControlName="budget_id"
                            type="number"
                            label="ID de Presupuesto"
                            labelPlacement="stacked"
                            placeholder="Opcional - ID del presupuesto asociado"
                          ></ion-input>
                        </ion-item>
                      </div>
                    </div>
                  }

                  <div class="form-row">
                    <div class="form-field full-width">
                      <ion-item>
                        <ion-textarea
                          formControlName="notes"
                          label="Notas"
                          labelPlacement="stacked"
                          placeholder="Notas adicionales sobre el pago"
                          [autoGrow]="true"
                          rows="4"
                        ></ion-textarea>
                      </ion-item>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            @if (error$ | async; as error) {
              <ion-text color="danger">
                <p class="ion-padding">{{ error }}</p>
              </ion-text>
            }

            <ion-button expand="block" (click)="save()" [disabled]="!form.valid" class="ion-margin-top">
              <ion-icon slot="start" name="save-outline"></ion-icon>
              {{ isEdit ? 'Actualizar' : 'Registrar' }} Pago
            </ion-button>
          </form>
        </div>
      }
    </ion-content>
  `,
  styles: [`
    .form-container {
      max-width: 1200px;
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

    ion-text small {
      display: block;
      font-size: 12px;
      margin: 4px 0 8px 4px;
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

      .form-row {
        flex-direction: row;
        gap: 16px;
      }

      .form-field.full-width {
        flex: 1 1 100%;
      }
    }

    @media (min-width: 1200px) {
      .form-section {
        padding: 20px;
      }
    }
  `]
})
export class PaymentFormPage implements OnInit {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private route = inject(ActivatedRoute);

  payment$ = this.store.select(selectSelectedPayment);
  loading$ = this.store.select(selectPaymentsLoading);
  error$ = this.store.select(selectPaymentsError);

  form: FormGroup;
  isEdit = false;
  paymentId?: number;
  private budgetIdFromRoute?: number;

  constructor() {
    addIcons({ saveOutline });

    this.form = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01)]],
      currency: ['PYG'],
      payment_method: [null, Validators.required],
      payment_date: [this.getCurrentDateTime()],
      transaction_reference: [''],
      budget_id: [null],
      notes: ['']
    });
  }

  ngOnInit(): void {
    // Check for budget_id in query params (when coming from budget detail)
    const budgetId = this.route.snapshot.queryParamMap.get('budget_id');
    if (budgetId) {
      this.budgetIdFromRoute = parseInt(budgetId, 10);
      this.form.patchValue({ budget_id: this.budgetIdFromRoute });
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.paymentId = parseInt(id, 10);
      this.store.dispatch(PaymentsActions.loadPayment({ id: this.paymentId }));

      this.payment$.subscribe(payment => {
        if (payment) {
          this.form.patchValue({
            amount: payment.amount,
            currency: payment.currency,
            payment_method: payment.payment_method,
            payment_date: this.formatDateTime(payment.payment_date),
            transaction_reference: payment.transaction_reference || payment.transaction_id || '',
            notes: payment.notes || ''
          });
        }
      });
    }
  }

  private getCurrentDateTime(): string {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  }

  private formatDateTime(dateStr?: string): string {
    if (!dateStr) return this.getCurrentDateTime();
    const date = new Date(dateStr);
    return date.toISOString().slice(0, 16);
  }

  save(): void {
    if (this.form.invalid) return;

    const formValue = this.form.value;

    if (this.isEdit && this.paymentId) {
      const payment: PaymentUpdate = {
        amount: formValue.amount,
        currency: formValue.currency,
        payment_method: formValue.payment_method,
        payment_date: formValue.payment_date ? new Date(formValue.payment_date).toISOString() : undefined,
        transaction_reference: formValue.transaction_reference || undefined,
        notes: formValue.notes || undefined
      };
      this.store.dispatch(PaymentsActions.updatePayment({ id: this.paymentId, payment }));
    } else {
      const payment: PaymentCreate = {
        amount: formValue.amount,
        currency: formValue.currency,
        payment_method: formValue.payment_method,
        payment_date: formValue.payment_date ? new Date(formValue.payment_date).toISOString() : undefined,
        transaction_reference: formValue.transaction_reference || undefined,
        budget_id: formValue.budget_id || undefined,
        notes: formValue.notes || undefined
      };
      this.store.dispatch(PaymentsActions.createPayment({
        payment,
        autoProcessOnCreate: !!this.budgetIdFromRoute,
        navigateToBudgetOnSuccess: !!this.budgetIdFromRoute
      }));
    }
  }
}
