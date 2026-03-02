import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,

  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSpinner,
  IonText,
  IonBadge,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  createOutline,
  trashOutline,
  cashOutline,
  walletOutline,
  checkmarkCircleOutline,
  calendarOutline,
  cardOutline,
  documentTextOutline,
  chevronForwardOutline,
  chevronBackOutline
} from 'ionicons/icons';
import * as PaymentsActions from '../../../store/payments/payments.actions';
import { selectSelectedPayment, selectPaymentsLoading, selectPaymentsError } from '../../../store/payments/payments.selectors';
import { PaymentStatus, PaymentMethod } from '../../../models/budget.model';

@Component({
  selector: 'app-payment-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,

    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonSpinner,
    IonText,
    IonBadge
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button fill="clear" [routerLink]="['/payments']" [queryParams]="scopeQueryParams" aria-label="Volver a pagos">
            <ion-icon slot="icon-only" name="chevron-back-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Detalle de Pago</ion-title>
        <ion-buttons slot="end">
          @if (payment$ | async; as payment) {
            @if (payment.payment_status === 'pending') {
              <!-- Mobile: solo iconos -->
              <ion-button [routerLink]="['/payments', payment.id, 'edit']" [queryParams]="scopeQueryParams" class="hide-desktop">
                <ion-icon slot="icon-only" name="create-outline"></ion-icon>
              </ion-button>
              <!-- Desktop: con texto -->
              <ion-button [routerLink]="['/payments', payment.id, 'edit']" [queryParams]="scopeQueryParams" fill="outline" class="hide-mobile">
                <ion-icon slot="start" name="create-outline"></ion-icon>
                Editar
              </ion-button>
            }
            <!-- Mobile: solo iconos -->
            <ion-button color="danger" (click)="confirmDelete(payment.id)" class="hide-desktop">
              <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
            </ion-button>
            <!-- Desktop: con texto -->
            <ion-button color="danger" fill="outline" (click)="confirmDelete(payment.id)" class="hide-mobile">
              <ion-icon slot="start" name="trash-outline"></ion-icon>
              Eliminar
            </ion-button>
          }
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (loading$ | async) {
        <div class="ion-text-center ion-padding">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Cargando pago...</p>
        </div>
      } @else if (error$ | async; as error) {
        <ion-text color="danger">
          <p>{{ error }}</p>
        </ion-text>
      } @else if (payment$ | async; as payment) {
        <div class="detail-page-container">
          <div class="detail-layout">
            <!-- Main Column -->
            <div class="detail-layout__main">
              <!-- Payment Amount Header -->
              <ion-card color="primary" class="amount-card">
                <ion-card-content>
                  <div class="amount-section">
                    <ion-icon name="cash-outline"></ion-icon>
                    <span class="amount">{{ payment.amount | currency:payment.currency:'symbol':'1.2-2' }}</span>
                  </div>
                  <div class="status-badge">
                    <ion-badge [color]="getStatusBadgeColor(payment.payment_status)">
                      {{ getStatusLabel(payment.payment_status) }}
                    </ion-badge>
                  </div>
                </ion-card-content>
              </ion-card>

              <!-- Payment Info -->
              <ion-card>
                <ion-card-header>
                  <ion-card-title>
                    <ion-icon name="wallet-outline"></ion-icon>
                    Información del Pago
                  </ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <div class="info-grid">
                    <div class="info-item">
                      <ion-icon name="card-outline" color="primary"></ion-icon>
                      <div class="info-content">
                        <span class="info-label">Método de Pago</span>
                        <span class="info-value">{{ getPaymentMethodLabel(payment.payment_method) }}</span>
                      </div>
                    </div>
                    <div class="info-item">
                      <ion-icon name="calendar-outline" color="tertiary"></ion-icon>
                      <div class="info-content">
                        <span class="info-label">Fecha de Pago</span>
                        <span class="info-value">{{ payment.payment_date | date:'dd/MM/yyyy HH:mm' }}</span>
                      </div>
                    </div>
                    @if (payment.transaction_reference) {
                      <div class="info-item">
                        <ion-icon name="document-text-outline" color="medium"></ion-icon>
                        <div class="info-content">
                          <span class="info-label">Referencia</span>
                          <span class="info-value">{{ payment.transaction_reference }}</span>
                        </div>
                      </div>
                    }
                    @if (payment.notes) {
                      <div class="info-item full-width">
                        <div class="info-content">
                          <span class="info-label">Notas</span>
                          <span class="info-value text-wrap">{{ payment.notes }}</span>
                        </div>
                      </div>
                    }
                  </div>
                </ion-card-content>
              </ion-card>
            </div>

            <!-- Side Column -->
            <div class="detail-layout__side">
              <!-- Budget Association -->
              @if (payment.budget_id) {
                <ion-card class="budget-link-card" [routerLink]="['/budgets', payment.budget_id]" [queryParams]="scopeQueryParams">
                  <ion-card-header>
                    <ion-card-title>
                      <ion-icon name="wallet-outline"></ion-icon>
                      Presupuesto
                    </ion-card-title>
                  </ion-card-header>
                  <ion-card-content>
                    <div class="budget-link">
                      <span>Ver Presupuesto #{{ payment.budget_id }}</span>
                      <ion-icon name="chevron-forward-outline"></ion-icon>
                    </div>
                  </ion-card-content>
                </ion-card>
              }

              <!-- Actions -->
              @if (payment.payment_status === 'pending') {
                <ion-card class="actions-card">
                  <ion-card-header>
                    <ion-card-title>Acciones</ion-card-title>
                  </ion-card-header>
                  <ion-card-content>
                    <ion-button expand="block" color="success" (click)="processPayment(payment.id)">
                      <ion-icon slot="start" name="checkmark-circle-outline"></ion-icon>
                      Marcar como Completado
                    </ion-button>
                  </ion-card-content>
                </ion-card>
              }
            </div>
          </div>
        </div>
      }
    </ion-content>
  `,
  styles: [`
    ion-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
    }

    /* Amount Card */
    .amount-card ion-card-content {
      padding: 24px 16px;
    }

    .amount-section {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }

    .amount-section ion-icon {
      font-size: 36px;
    }

    .amount {
      font-size: 36px;
      font-weight: bold;
    }

    .status-badge {
      text-align: center;
      margin-top: 12px;
    }

    .status-badge ion-badge {
      font-size: 13px;
      padding: 6px 12px;
    }

    /* Info Grid */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .info-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .info-item ion-icon {
      font-size: 22px;
      min-width: 22px;
    }

    .info-content {
      display: flex;
      flex-direction: column;
    }

    .info-label {
      font-size: 12px;
      color: var(--ion-color-medium);
      text-transform: uppercase;
    }

    .info-value {
      font-size: 15px;
      font-weight: 500;
    }

    .info-value.text-wrap {
      white-space: pre-wrap;
    }

    /* Budget Link Card */
    .budget-link-card {
      cursor: pointer;
    }

    .budget-link-card:hover {
      --background: var(--ion-color-light);
    }

    .budget-link {
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: var(--ion-color-primary);
      font-weight: 500;
    }

    .budget-link ion-icon {
      font-size: 20px;
    }

    /* Actions Card */
    .actions-card ion-button {
      margin-bottom: 8px;
    }

    .actions-card ion-button:last-child {
      margin-bottom: 0;
    }

    .hide-mobile {
      display: none;
    }

    .hide-desktop {
      display: inline-flex;
    }

    @media (min-width: 768px) {
      .info-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .info-item.full-width {
        grid-column: 1 / -1;
      }

      .hide-mobile {
        display: inline-flex;
      }

      .hide-desktop {
        display: none;
      }
    }
  `]
})
export class PaymentDetailPage implements OnInit {
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private alertController = inject(AlertController);

  payment$ = this.store.select(selectSelectedPayment);
  loading$ = this.store.select(selectPaymentsLoading);
  error$ = this.store.select(selectPaymentsError);
  currentBudgetId?: number;
  currentPatientId?: number;
  currentSpecialtyKey?: string;

  constructor() {
    addIcons({
      createOutline,
      trashOutline,
      cashOutline,
      walletOutline,
      checkmarkCircleOutline,
      calendarOutline,
      cardOutline,
      documentTextOutline,
      chevronForwardOutline,
      chevronBackOutline
    });
  }

  ngOnInit(): void {
    this.currentBudgetId = this.parseNumberParam(this.route.snapshot.queryParamMap.get('budget_id'));
    this.currentPatientId = this.parseNumberParam(this.route.snapshot.queryParamMap.get('patient_id'));
    this.currentSpecialtyKey = this.route.snapshot.queryParamMap.get('specialty_key') || undefined;
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.store.dispatch(PaymentsActions.loadPayment({ id: parseInt(id, 10) }));
    }
  }

  getStatusColor(status: PaymentStatus): string {
    switch (status) {
      case 'pending': return 'warning';
      case 'completed': return 'success';
      case 'failed': return 'danger';
      case 'refunded': return 'medium';
      default: return 'medium';
    }
  }

  getStatusBadgeColor(status: PaymentStatus): string {
    switch (status) {
      case 'pending': return 'warning';
      case 'completed': return 'light';
      case 'failed': return 'danger';
      case 'refunded': return 'medium';
      default: return 'light';
    }
  }

  getStatusLabel(status: PaymentStatus): string {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'completed': return 'Completado';
      case 'failed': return 'Fallido';
      case 'refunded': return 'Reembolsado';
      default: return status;
    }
  }

  getPaymentMethodLabel(method?: PaymentMethod): string {
    switch (method) {
      case 'cash': return 'Efectivo';
      case 'card': return 'Tarjeta';
      case 'transfer': return 'Transferencia';
      case 'check': return 'Cheque';
      case 'other': return 'Otro';
      default: return 'No especificado';
    }
  }

  async confirmDelete(id: number): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: '¿Está seguro de eliminar este pago?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.store.dispatch(PaymentsActions.deletePayment({
              id,
              navigationQueryParams: this.scopeQueryParams
            }));
          }
        }
      ]
    });
    await alert.present();
  }

  processPayment(id: number): void {
    this.store.dispatch(PaymentsActions.processPayment({
      id,
      budgetId: this.currentBudgetId,
      navigationQueryParams: this.scopeQueryParams
    }));
  }

  get scopeQueryParams(): { budget_id?: number; patient_id?: number; specialty_key?: string } {
    return {
      budget_id: this.currentBudgetId,
      patient_id: this.currentPatientId,
      specialty_key: this.currentSpecialtyKey
    };
  }

  private parseNumberParam(rawValue: string | null): number | undefined {
    if (!rawValue) {
      return undefined;
    }

    const parsed = Number.parseInt(rawValue, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
}
