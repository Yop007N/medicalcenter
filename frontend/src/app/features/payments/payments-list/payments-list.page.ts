import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonSpinner,
  IonText,
  IonRefresher,
  IonRefresherContent,
  IonBadge,
  IonSegment,
  IonSegmentButton,
  IonFab,
  IonFabButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, cashOutline, checkmarkCircleOutline, timeOutline, closeCircleOutline } from 'ionicons/icons';
import * as PaymentsActions from '../../../store/payments/payments.actions';
import { selectAllPayments, selectPaymentsLoading, selectPaymentsError } from '../../../store/payments/payments.selectors';
import { Payment, PaymentStatus } from '../../../models/budget.model';

@Component({
  selector: 'app-payments-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonMenuButton,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonSpinner,
    IonText,
    IonRefresher,
    IonRefresherContent,
    IonBadge,
    IonSegment,
    IonSegmentButton,
    IonFab,
    IonFabButton
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Pagos</ion-title>
        <ion-buttons slot="end">
          <ion-button routerLink="/payments/new">
            <ion-icon slot="icon-only" name="add-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment [(ngModel)]="selectedStatus" (ionChange)="filterByStatus()">
          <ion-segment-button value="all">Todos</ion-segment-button>
          <ion-segment-button value="pending">Pendiente</ion-segment-button>
          <ion-segment-button value="completed">Completado</ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      @if (loading$ | async) {
        <div class="ion-text-center ion-padding">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Cargando pagos...</p>
        </div>
      } @else if (error$ | async; as error) {
        <div class="ion-text-center ion-padding">
          <ion-text color="danger">
            <p>{{ error }}</p>
          </ion-text>
          <ion-button fill="outline" (click)="loadPayments()">Reintentar</ion-button>
        </div>
      } @else {
        @if (filteredPayments.length === 0) {
          <div class="ion-text-center ion-padding">
            <ion-icon name="cash-outline" style="font-size: 64px; color: var(--ion-color-medium);"></ion-icon>
            <p>No hay pagos</p>
            <ion-button routerLink="/payments/new">
              <ion-icon slot="start" name="add-outline"></ion-icon>
              Registrar Pago
            </ion-button>
          </div>
        } @else {
          <ion-list>
            @for (payment of filteredPayments; track payment.id) {
              <ion-item [routerLink]="['/payments', payment.id]" detail>
                <ion-icon name="cash-outline" slot="start" color="primary"></ion-icon>
                <ion-label>
                  <h2>{{ payment.amount | currency:payment.currency:'symbol':'1.2-2' }}</h2>
                  <p>{{ getPaymentMethodLabel(payment.payment_method) }}</p>
                  <p>{{ payment.payment_date | date:'dd/MM/yyyy' }}</p>
                </ion-label>
                <ion-badge slot="end" [color]="getStatusColor(payment.payment_status)">
                  {{ getStatusLabel(payment.payment_status) }}
                </ion-badge>
              </ion-item>
            }
          </ion-list>
        }
      }

      <!-- FAB para crear nuevo pago (mobile) -->
      <ion-fab slot="fixed" vertical="bottom" horizontal="end" class="hide-desktop">
        <ion-fab-button routerLink="/payments/new">
          <ion-icon name="add-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- Boton para crear nuevo pago (desktop) -->
      <div class="desktop-create-btn hide-mobile">
        <ion-button routerLink="/payments/new" shape="round" expand="block">
          <ion-icon slot="start" name="add-outline"></ion-icon>
          Registrar Pago
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    ion-segment {
      padding: 8px;
    }

    /* FAB */
    ion-fab-button {
      --background: var(--medical-gradient-primary);
      --box-shadow: var(--medical-shadow-lg);
    }

    /* Desktop create button */
    .desktop-create-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 1000;

      ion-button {
        --border-radius: 25px;
        --box-shadow: var(--medical-shadow-lg);
        height: 48px;
        font-weight: 600;
      }
    }

    .hide-mobile {
      display: none;
    }

    .hide-desktop {
      display: block;
    }

    @media (min-width: 768px) {
      .hide-mobile {
        display: block;
      }

      .hide-desktop {
        display: none;
      }
    }
  `]
})
export class PaymentsListPage implements OnInit {
  private store = inject(Store);

  payments$ = this.store.select(selectAllPayments);
  loading$ = this.store.select(selectPaymentsLoading);
  error$ = this.store.select(selectPaymentsError);

  allPayments: Payment[] = [];
  filteredPayments: Payment[] = [];
  selectedStatus = 'all';

  constructor() {
    addIcons({ addOutline, cashOutline, checkmarkCircleOutline, timeOutline, closeCircleOutline });
  }

  ngOnInit(): void {
    this.loadPayments();
    this.payments$.subscribe(payments => {
      this.allPayments = payments;
      this.filterByStatus();
    });
  }

  loadPayments(): void {
    this.store.dispatch(PaymentsActions.loadPayments({}));
  }

  doRefresh(event: any): void {
    this.loadPayments();
    setTimeout(() => event.target.complete(), 1000);
  }

  filterByStatus(): void {
    if (this.selectedStatus === 'all') {
      this.filteredPayments = this.allPayments;
    } else {
      this.filteredPayments = this.allPayments.filter(p => p.payment_status === this.selectedStatus);
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

  getStatusLabel(status: PaymentStatus): string {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'completed': return 'Completado';
      case 'failed': return 'Fallido';
      case 'refunded': return 'Reembolsado';
      default: return status;
    }
  }

  getPaymentMethodLabel(method?: string): string {
    switch (method) {
      case 'cash': return 'Efectivo';
      case 'card': return 'Tarjeta';
      case 'transfer': return 'Transferencia';
      case 'check': return 'Cheque';
      case 'other': return 'Otro';
      default: return method || 'No especificado';
    }
  }
}
