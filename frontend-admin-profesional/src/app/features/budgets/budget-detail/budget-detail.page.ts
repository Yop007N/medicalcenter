import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  IonCardSubtitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonSpinner,
  IonText,
  IonBadge,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  createOutline,
  trashOutline,
  walletOutline,
  personOutline,
  sendOutline,
  checkmarkCircleOutline,
  cashOutline,
  receiptOutline,
  calendarOutline,
  cardOutline,
  checkmarkDoneOutline,
  chevronBackOutline
} from 'ionicons/icons';
import * as BudgetsActions from '../../../store/budgets/budgets.actions';
import { selectSelectedBudget, selectBudgetsLoading, selectBudgetsError } from '../../../store/budgets/budgets.selectors';
import { BudgetStatus } from '../../../models/budget.model';
import { PaymentsApiService } from '../../../core/services';
import { PatientsApiService } from '../../../core/services/patients-api.service';

@Component({
  selector: 'app-budget-detail',
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
    IonCardSubtitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonSpinner,
    IonText,
    IonBadge
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button fill="clear" [routerLink]="['/budgets']" [queryParams]="scopeQueryParams" aria-label="Volver a presupuestos">
            <ion-icon slot="icon-only" name="chevron-back-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Detalle de Presupuesto</ion-title>
        <ion-buttons slot="end">
          @if (budget$ | async; as budget) {
            <!-- Mobile: solo iconos -->
            <ion-button aria-label="Editar" [routerLink]="['/budgets', budget.id, 'edit']" [queryParams]="scopeQueryParams" class="hide-desktop">
              <ion-icon slot="icon-only" name="create-outline"></ion-icon>
            </ion-button>
            <ion-button aria-label="Eliminar" color="danger" (click)="confirmDelete(budget.id)" class="hide-desktop">
              <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
            </ion-button>
            <!-- Desktop: con texto -->
            <ion-button [routerLink]="['/budgets', budget.id, 'edit']" [queryParams]="scopeQueryParams" fill="outline" class="hide-mobile">
              <ion-icon slot="start" name="create-outline"></ion-icon>
              Editar
            </ion-button>
            <ion-button color="danger" fill="outline" (click)="confirmDelete(budget.id)" class="hide-mobile">
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
          <p>Cargando presupuesto...</p>
        </div>
      } @else if (error$ | async; as error) {
        <ion-text color="danger">
          <p>{{ error }}</p>
        </ion-text>
      } @else if (budget$ | async; as budget) {
        <div class="detail-page-container">
          <div class="detail-layout">
            <!-- Main Column -->
            <div class="detail-layout__main">
              <!-- Budget Header -->
              <ion-card>
                <ion-card-header>
                  <ion-card-title>
                    <ion-icon name="wallet-outline"></ion-icon>
                    {{ budget.title }}
                  </ion-card-title>
                  <ion-card-subtitle>
                    <ion-badge [color]="getStatusColor(budget.status)">
                      {{ getStatusLabel(budget.status) }}
                    </ion-badge>
                  </ion-card-subtitle>
                </ion-card-header>
                <ion-card-content>
                  <div class="info-grid">
                    <div class="info-item" [routerLink]="budget.patient_id ? ['/patients', budget.patient_id] : null" [queryParams]="scopeQueryParams" [class.clickable]="!!budget.patient_id">
                      <ion-icon name="person-outline" color="primary"></ion-icon>
                      <div class="info-content">
                        <span class="info-label">Paciente</span>
                        <span class="info-value">
                          @if (budget.patient) {
                            {{ budget.patient.first_name }} {{ budget.patient.last_name }}
                          } @else if (resolvedPatientName) {
                            {{ resolvedPatientName }}
                          } @else {
                            Paciente #{{ budget.patient_id }}
                          }
                        </span>
                      </div>
                    </div>
                    @if (budget.valid_until) {
                      <div class="info-item">
                        <ion-icon name="calendar-outline" color="warning"></ion-icon>
                        <div class="info-content">
                          <span class="info-label">Válido hasta</span>
                          <span class="info-value">{{ budget.valid_until | date:'dd/MM/yyyy' }}</span>
                        </div>
                      </div>
                    }
                    @if (budget.description) {
                      <div class="info-item full-width">
                        <div class="info-content">
                          <span class="info-label">Descripción</span>
                          <span class="info-value text-wrap">{{ budget.description }}</span>
                        </div>
                      </div>
                    }
                  </div>
                </ion-card-content>
              </ion-card>

              <!-- Items -->
              @if (budget.items && budget.items.length > 0) {
                <ion-card>
                  <ion-card-header>
                    <ion-card-title>Ítems del Presupuesto</ion-card-title>
                  </ion-card-header>
                  <ion-card-content>
                    <div class="items-table">
                      <div class="items-header">
                        <span class="item-desc">Descripción</span>
                        <span class="item-qty">Cant.</span>
                        <span class="item-price">Precio</span>
                        <span class="item-total">Total</span>
                      </div>
                      @for (item of budget.items; track $index) {
                        <div class="items-row">
                          <span class="item-desc">{{ item.description }}</span>
                          <span class="item-qty">{{ item.quantity }}</span>
                          <span class="item-price">{{ item.unit_price | currency:budget.currency:'symbol':'1.2-2' }}</span>
                          <span class="item-total">{{ item.total | currency:budget.currency:'symbol':'1.2-2' }}</span>
                        </div>
                      }
                    </div>
                  </ion-card-content>
                </ion-card>
              }

              <!-- Payments History -->
              <ion-card>
                <ion-card-header>
                  <div class="card-header-with-action">
                    <ion-card-title>
                      <ion-icon name="card-outline"></ion-icon>
                      Historial de Pagos
                    </ion-card-title>
                    @if (budget.status === 'accepted') {
                      <ion-button size="small" routerLink="/payments/new" [queryParams]="paymentQueryParams">
                        <ion-icon slot="start" name="cash-outline"></ion-icon>
                        Nuevo Pago
                      </ion-button>
                    }
                  </div>
                </ion-card-header>
                <ion-card-content>
                  @if (payments.length > 0) {
                    <ion-list lines="none" class="payments-list">
                      @for (payment of payments; track payment.id) {
                        <ion-item button [routerLink]="['/payments', payment.id]" [queryParams]="paymentQueryParams" detail="true">
                          <ion-icon name="card-outline" slot="start" [color]="getPaymentStatusColor(payment.payment_status)"></ion-icon>
                          <ion-label>
                            <h3>{{ payment.amount | currency:payment.currency:'symbol':'1.2-2' }}</h3>
                            <p>{{ getPaymentMethodLabel(payment.payment_method) }} - {{ payment.payment_date | date:'dd/MM/yyyy' }}</p>
                          </ion-label>
                          <ion-badge slot="end" [color]="getPaymentStatusColor(payment.payment_status)">
                            {{ getPaymentStatusLabel(payment.payment_status) }}
                          </ion-badge>
                        </ion-item>
                      }
                    </ion-list>
                  } @else {
                    <div class="empty-payments">
                      <ion-icon name="card-outline"></ion-icon>
                      <p>No hay pagos registrados</p>
                      @if (budget.status === 'accepted') {
                        <ion-button size="small" routerLink="/payments/new" [queryParams]="paymentQueryParams">
                          Registrar primer pago
                        </ion-button>
                      }
                    </div>
                  }
                </ion-card-content>
              </ion-card>
            </div>

            <!-- Side Column -->
            <div class="detail-layout__side">
              <!-- Financial Summary Card -->
              <ion-card class="financial-card">
                <ion-card-header>
                  <ion-card-title>
                    <ion-icon name="receipt-outline"></ion-icon>
                    Resumen
                  </ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <div class="financial-summary">
                    <div class="summary-row">
                      <span class="label">Total</span>
                      <span class="amount total">{{ budget.total_amount | currency:budget.currency:'symbol':'1.2-2' }}</span>
                    </div>
                    <div class="summary-row">
                      <span class="label">Pagado</span>
                      <span class="amount paid">{{ getTotalPaid(budget) | currency:budget.currency:'symbol':'1.2-2' }}</span>
                    </div>
                    <div class="summary-row">
                      <span class="label">Pendiente</span>
                      <span class="amount pending" [class.zero]="getRemainingAmount(budget) <= 0">
                        {{ getRemainingAmount(budget) | currency:budget.currency:'symbol':'1.2-2' }}
                      </span>
                    </div>

                    <!-- Progress Bar -->
                    <div class="payment-progress">
                      <div class="progress-header">
                        <span>Progreso</span>
                        <span class="percentage">{{ getPaymentPercentage(budget) }}%</span>
                      </div>
                      <div class="progress-bar">
                        <div class="progress-fill" [style.width.%]="getPaymentPercentage(budget)" [class.complete]="getPaymentPercentage(budget) >= 100"></div>
                      </div>
                      @if (getPaymentPercentage(budget) >= 100) {
                        <div class="paid-complete">
                          <ion-icon name="checkmark-done-outline"></ion-icon>
                          <span>Pagado</span>
                        </div>
                      }
                    </div>
                  </div>
                </ion-card-content>
              </ion-card>

              <!-- Actions -->
              @if (budget.status === 'draft' || budget.status === 'sent') {
                <ion-card class="actions-card">
                  <ion-card-header>
                    <ion-card-title>Acciones</ion-card-title>
                  </ion-card-header>
                  <ion-card-content>
                    @if (budget.status === 'draft') {
                      <ion-button expand="block" (click)="sendBudget(budget.id)">
                        <ion-icon slot="start" name="send-outline"></ion-icon>
                        Enviar al Paciente
                      </ion-button>
                    }
                    @if (budget.status === 'sent') {
                      <ion-button expand="block" color="success" (click)="acceptBudget(budget.id)">
                        <ion-icon slot="start" name="checkmark-circle-outline"></ion-icon>
                        Marcar como Aceptado
                      </ion-button>
                    }
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

    ion-card-subtitle {
      margin-top: 8px;
    }

    .card-header-with-action {
      display: flex;
      justify-content: space-between;
      align-items: center;
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

    .info-item.clickable {
      cursor: pointer;
    }

    .info-item.clickable:hover .info-value {
      color: var(--ion-color-primary);
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

    /* Items Table */
    .items-table {
      font-size: 14px;
    }

    .items-header, .items-row {
      display: grid;
      grid-template-columns: 1fr 50px 80px 90px;
      gap: 8px;
      padding: 10px 0;
      align-items: center;
    }

    .items-header {
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      color: var(--ion-color-medium);
      border-bottom: 2px solid var(--ion-color-light);
    }

    .items-row {
      border-bottom: 1px solid var(--ion-color-light);
    }

    .items-row:last-child {
      border-bottom: none;
    }

    .item-qty, .item-price, .item-total {
      text-align: right;
    }

    .item-total {
      font-weight: 600;
    }

    /* Financial Card */
    .financial-card {
      border-left: 4px solid var(--ion-color-primary);
    }

    .financial-summary {
      padding: 8px 0;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid var(--ion-color-light);
    }

    .summary-row:last-of-type {
      border-bottom: none;
    }

    .summary-row .label {
      color: var(--ion-color-medium);
      font-size: 14px;
    }

    .summary-row .amount {
      font-weight: 600;
      font-size: 16px;
    }

    .summary-row .amount.total {
      color: var(--ion-color-dark);
    }

    .summary-row .amount.paid {
      color: var(--ion-color-success);
    }

    .summary-row .amount.pending {
      color: var(--ion-color-warning);
    }

    .summary-row .amount.pending.zero {
      color: var(--ion-color-success);
    }

    .payment-progress {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--ion-color-light);
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
    }

    .progress-header .percentage {
      font-weight: 600;
      color: var(--ion-color-primary);
    }

    .progress-bar {
      height: 10px;
      background: var(--ion-color-light);
      border-radius: 5px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: var(--ion-color-primary);
      border-radius: 5px;
      transition: width 0.3s ease;
    }

    .progress-fill.complete {
      background: var(--ion-color-success);
    }

    .paid-complete {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 12px;
      padding: 8px;
      background: rgba(var(--ion-color-success-rgb), 0.1);
      border-radius: 8px;
      color: var(--ion-color-success);
      font-weight: 500;
    }

    /* Payments List */
    .payments-list ion-item {
      --padding-start: 0;
    }

    .empty-payments {
      text-align: center;
      padding: 24px;
    }

    .empty-payments ion-icon {
      font-size: 48px;
      color: var(--ion-color-medium);
    }

    .empty-payments p {
      margin: 12px 0;
      color: var(--ion-color-medium);
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
export class BudgetDetailPage implements OnInit {
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private alertController = inject(AlertController);
  private paymentsApi = inject(PaymentsApiService);
  private patientsApi = inject(PatientsApiService);
  private destroyRef = inject(DestroyRef);

  budget$ = this.store.select(selectSelectedBudget);
  loading$ = this.store.select(selectBudgetsLoading);
  error$ = this.store.select(selectBudgetsError);

  payments: any[] = [];
  budgetId: number | null = null;
  resolvedPatientName: string | null = null;
  private resolvedPatientId: number | null = null;
  currentPatientId?: number;
  currentSpecialtyKey?: string;

  constructor() {
    addIcons({
      createOutline,
      trashOutline,
      walletOutline,
      personOutline,
      sendOutline,
      checkmarkCircleOutline,
      cashOutline,
      receiptOutline,
      calendarOutline,
      cardOutline,
      checkmarkDoneOutline,
      chevronBackOutline
    });
  }

  ngOnInit(): void {
    this.currentPatientId = this.parseNumberParam(this.route.snapshot.queryParamMap.get('patient_id'));
    this.currentSpecialtyKey = this.route.snapshot.queryParamMap.get('specialty_key') || undefined;
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.budgetId = parseInt(id, 10);
      this.store.dispatch(BudgetsActions.loadBudget({ id: this.budgetId }));
      this.loadPayments();
    }

    this.budget$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((budget) => this.resolvePatientName(budget));
  }

  ionViewWillEnter(): void {
    if (!this.budgetId) {
      return;
    }
    this.store.dispatch(BudgetsActions.loadBudget({ id: this.budgetId }));
    this.loadPayments();
  }

  loadPayments(): void {
    if (!this.budgetId) return;
    this.paymentsApi
      .list(
        this.budgetId,
        this.currentPatientId ?? this.resolvedPatientId ?? undefined,
        this.currentSpecialtyKey
      )
      .subscribe({
        next: (payments) => this.payments = payments,
        error: () => this.payments = []
      });
  }

  get scopeQueryParams(): { patient_id?: number; specialty_key?: string } {
    return {
      patient_id: this.currentPatientId ?? this.resolvedPatientId ?? undefined,
      specialty_key: this.currentSpecialtyKey
    };
  }

  get paymentQueryParams(): { budget_id?: number; patient_id?: number; specialty_key?: string } {
    return {
      budget_id: this.budgetId ?? undefined,
      patient_id: this.currentPatientId ?? this.resolvedPatientId ?? undefined,
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

  getTotalPaid(budget: any): number {
    return budget.total_paid || 0;
  }

  getRemainingAmount(budget: any): number {
    const total = budget.total_amount || 0;
    const paid = budget.total_paid || 0;
    return Math.max(0, total - paid);
  }

  getPaymentPercentage(budget: any): number {
    if (!budget.total_amount || budget.total_amount === 0) return 0;
    const percentage = ((budget.total_paid || 0) / budget.total_amount) * 100;
    return Math.min(Math.round(percentage), 100);
  }

  private resolvePatientName(budget: any): void {
    if (!budget || !budget.patient_id) {
      this.resolvedPatientName = null;
      this.resolvedPatientId = null;
      return;
    }

    if (budget.patient) {
      const patientName = `${budget.patient.first_name ?? ''} ${budget.patient.last_name ?? ''}`.trim();
      this.resolvedPatientName = patientName || `Paciente #${budget.patient_id}`;
      this.resolvedPatientId = budget.patient_id;
      return;
    }

    if (this.resolvedPatientId === budget.patient_id && this.resolvedPatientName) {
      return;
    }

    this.resolvedPatientId = budget.patient_id;
    this.patientsApi
      .getById(budget.patient_id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (patient) => {
          const patientName = `${patient.first_name ?? ''} ${patient.last_name ?? ''}`.trim();
          this.resolvedPatientName = patientName || patient.email || `Paciente #${budget.patient_id}`;
        },
        error: () => {
          this.resolvedPatientName = `Paciente #${budget.patient_id}`;
        }
      });
  }

  getPaymentStatusColor(status: string): string {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'danger';
      case 'refunded': return 'medium';
      default: return 'medium';
    }
  }

  getPaymentStatusLabel(status: string): string {
    switch (status) {
      case 'completed': return 'Completado';
      case 'pending': return 'Pendiente';
      case 'failed': return 'Fallido';
      case 'refunded': return 'Reembolsado';
      default: return status;
    }
  }

  getPaymentMethodLabel(method: string): string {
    switch (method) {
      case 'cash': return 'Efectivo';
      case 'card': return 'Tarjeta';
      case 'transfer': return 'Transferencia';
      case 'check': return 'Cheque';
      case 'insurance': return 'Seguro';
      case 'other': return 'Otro';
      default: return method;
    }
  }

  getStatusColor(status: BudgetStatus): string {
    switch (status) {
      case 'draft': return 'medium';
      case 'sent': return 'warning';
      case 'accepted': return 'success';
      case 'rejected': return 'danger';
      case 'expired': return 'dark';
      default: return 'medium';
    }
  }

  getStatusLabel(status: BudgetStatus): string {
    switch (status) {
      case 'draft': return 'Borrador';
      case 'sent': return 'Enviado';
      case 'accepted': return 'Aceptado';
      case 'rejected': return 'Rechazado';
      case 'expired': return 'Vencido';
      default: return status;
    }
  }

  async confirmDelete(id: number): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: '¿Está seguro de eliminar este presupuesto?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.store.dispatch(BudgetsActions.deleteBudget({
              id,
              navigationQueryParams: this.scopeQueryParams
            }));
          }
        }
      ]
    });
    await alert.present();
  }

  sendBudget(id: number): void {
    this.store.dispatch(BudgetsActions.sendBudget({ id }));
  }

  acceptBudget(id: number): void {
    this.store.dispatch(BudgetsActions.acceptBudget({ id }));
  }
}
