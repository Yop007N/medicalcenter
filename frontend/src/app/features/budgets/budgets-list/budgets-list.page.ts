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
  IonSearchbar,
  IonChip,
  IonBadge,
  IonSegment,
  IonSegmentButton,
  IonCard,
  IonCardContent,
  IonFab,
  IonFabButton,
  IonSkeletonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  walletOutline,
  checkmarkCircleOutline,
  timeOutline,
  closeCircleOutline,
  documentTextOutline,
  chevronForwardOutline,
  cashOutline,
  sendOutline,
  alertCircleOutline
} from 'ionicons/icons';
import * as BudgetsActions from '../../../store/budgets/budgets.actions';
import { selectAllBudgets, selectBudgetsLoading, selectBudgetsError } from '../../../store/budgets/budgets.selectors';
import { Budget, BudgetStatus } from '../../../models/budget.model';

@Component({
  selector: 'app-budgets-list',
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
    IonSearchbar,
    IonChip,
    IonBadge,
    IonSegment,
    IonSegmentButton,
    IonCard,
    IonCardContent,
    IonFab,
    IonFabButton,
    IonSkeletonText
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Presupuestos</ion-title>
        <ion-buttons slot="end">
          <ion-button routerLink="/budgets/new">
            <ion-icon slot="icon-only" name="add-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Header con estadisticas -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <ion-icon name="wallet-outline"></ion-icon>
          </div>
          <div class="header-info">
            <h1>{{ getTotalAmount() | currency:'PYG':'symbol':'1.0-0' }}</h1>
            <p>Total en presupuestos</p>
          </div>
        </div>
        <div class="stats-row">
          <div class="stat-chip draft">
            <ion-icon name="document-text-outline"></ion-icon>
            <span>{{ getDraftCount() }} borradores</span>
          </div>
          <div class="stat-chip accepted">
            <ion-icon name="checkmark-circle-outline"></ion-icon>
            <span>{{ getAcceptedCount() }} aceptados</span>
          </div>
        </div>
      </div>

      <!-- Filtro por estado -->
      <div class="filter-container">
        <ion-segment [(ngModel)]="selectedStatus" (ionChange)="filterByStatus()" mode="ios">
          <ion-segment-button value="all">
            <ion-label>Todos</ion-label>
          </ion-segment-button>
          <ion-segment-button value="draft">
            <ion-label>Borrador</ion-label>
          </ion-segment-button>
          <ion-segment-button value="sent">
            <ion-label>Enviado</ion-label>
          </ion-segment-button>
          <ion-segment-button value="accepted">
            <ion-label>Aceptado</ion-label>
          </ion-segment-button>
        </ion-segment>
      </div>

      @if (loading$ | async) {
        <div class="budgets-list">
          @for (i of [1,2,3,4]; track i) {
            <ion-card class="budget-card skeleton-card">
              <ion-card-content>
                <ion-skeleton-text [animated]="true" style="width: 60%; height: 20px;"></ion-skeleton-text>
                <ion-skeleton-text [animated]="true" style="width: 80%; height: 16px; margin-top: 8px;"></ion-skeleton-text>
                <ion-skeleton-text [animated]="true" style="width: 40%; height: 24px; margin-top: 12px;"></ion-skeleton-text>
              </ion-card-content>
            </ion-card>
          }
        </div>
      } @else if (error$ | async; as error) {
        <div class="error-state">
          <div class="error-icon">
            <ion-icon name="alert-circle-outline"></ion-icon>
          </div>
          <h3>Error al cargar</h3>
          <p>{{ error }}</p>
          <ion-button fill="outline" (click)="loadBudgets()" shape="round">
            Reintentar
          </ion-button>
        </div>
      } @else {
        @if (filteredBudgets.length === 0) {
          <div class="empty-state">
            <div class="empty-icon">
              <ion-icon name="wallet-outline"></ion-icon>
            </div>
            <h3>No hay presupuestos</h3>
            <p>{{ selectedStatus === 'all' ? 'Crea tu primer presupuesto para comenzar' : 'No hay presupuestos con este estado' }}</p>
            @if (selectedStatus === 'all') {
              <ion-button routerLink="/budgets/new" shape="round">
                <ion-icon slot="start" name="add-outline"></ion-icon>
                Nuevo Presupuesto
              </ion-button>
            }
          </div>
        } @else {
          <div class="budgets-list">
            @for (budget of filteredBudgets; track budget.id) {
              <ion-card class="budget-card" [routerLink]="['/budgets', budget.id]">
                <ion-card-content>
                  <div class="budget-header">
                    <div class="budget-icon" [attr.data-status]="budget.status">
                      <ion-icon name="document-text-outline"></ion-icon>
                    </div>
                    <div class="budget-main">
                      <h3>{{ budget.title }}</h3>
                      <p class="patient-name">
                        @if (budget.patient) {
                          {{ budget.patient.first_name }} {{ budget.patient.last_name }}
                        } @else {
                          Paciente #{{ budget.patient_id }}
                        }
                      </p>
                    </div>
                    <div class="status-badge" [attr.data-status]="budget.status">
                      {{ getStatusLabel(budget.status) }}
                    </div>
                  </div>

                  <div class="budget-body">
                    <div class="amount-section">
                      <span class="amount-label">Total</span>
                      <span class="amount-value">{{ budget.total_amount | currency:budget.currency:'symbol':'1.2-2' }}</span>
                    </div>

                    <div class="budget-meta">
                      @if (budget.valid_until) {
                        <span class="meta-item">
                          <ion-icon name="time-outline"></ion-icon>
                          Valido hasta: {{ formatDate(budget.valid_until) }}
                        </span>
                      }
                      @if (budget.items?.length) {
                        <span class="meta-item">
                          {{ (budget.items?.length || 0) }} item{{ (budget.items?.length || 0) > 1 ? 's' : '' }}
                        </span>
                      }
                    </div>
                  </div>

                  <div class="card-footer">
                    <span class="created-date">
                      Creado: {{ formatDate(budget.created_at) }}
                    </span>
                    <ion-icon name="chevron-forward-outline" class="arrow-icon"></ion-icon>
                  </div>
                </ion-card-content>
              </ion-card>
            }
          </div>
        }
      }

      <!-- FAB para crear nuevo presupuesto (mobile) -->
      <ion-fab slot="fixed" vertical="bottom" horizontal="end" class="hide-desktop">
        <ion-fab-button routerLink="/budgets/new">
          <ion-icon name="add-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- Boton para crear nuevo presupuesto (desktop) -->
      <div class="desktop-create-btn hide-mobile">
        <ion-button routerLink="/budgets/new" shape="round" expand="block">
          <ion-icon slot="start" name="add-outline"></ion-icon>
          Crear Presupuesto
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    ion-content {
      --background: var(--medical-bg-light);
    }

    /* Header */
    .page-header {
      background: var(--medical-gradient-primary);
      padding: 24px 20px;
      margin: -16px -16px 0;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }

    .header-icon {
      width: 56px;
      height: 56px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;

      ion-icon {
        font-size: 28px;
        color: white;
      }
    }

    .header-info {
      h1 {
        font-size: 28px;
        font-weight: 700;
        color: white;
        margin: 0;
        line-height: 1;
      }

      p {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.9);
        margin: 4px 0 0;
      }
    }

    .stats-row {
      display: flex;
      gap: 12px;
    }

    .stat-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 20px;
      font-size: 12px;
      color: white;
      font-weight: 500;

      ion-icon {
        font-size: 14px;
      }
    }

    /* Filter */
    .filter-container {
      padding: 16px;
      margin-top: 16px;
    }

    ion-segment {
      --background: var(--medical-bg-card);
      border-radius: 12px;
      padding: 4px;
      box-shadow: var(--medical-shadow-sm);
    }

    ion-segment-button {
      --border-radius: 8px;
      --color-checked: white;
      font-size: 12px;
      font-weight: 500;
      min-height: 36px;
      text-transform: none;
    }

    /* Lista */
    .budgets-list {
      padding: 0 16px 100px;
    }

    /* Card */
    .budget-card {
      margin: 0 0 12px;
      border-radius: var(--medical-radius-md);
      box-shadow: var(--medical-shadow-md);
      border: 1px solid var(--medical-border-light);
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--medical-shadow-lg);
      }

      ion-card-content {
        padding: 16px;
      }
    }

    .budget-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 16px;
    }

    .budget-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      ion-icon {
        font-size: 22px;
        color: white;
      }

      &[data-status="draft"] {
        background: var(--ion-color-medium);
      }

      &[data-status="sent"] {
        background: var(--medical-gradient-warm);
      }

      &[data-status="accepted"] {
        background: var(--medical-gradient-success);
      }

      &[data-status="rejected"] {
        background: var(--ion-color-danger);
      }

      &[data-status="expired"] {
        background: var(--ion-color-dark);
      }
    }

    .budget-main {
      flex: 1;
      min-width: 0;

      h3 {
        font-size: 16px;
        font-weight: 600;
        color: var(--ion-color-dark);
        margin: 0 0 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .patient-name {
        font-size: 13px;
        color: var(--ion-color-medium);
        margin: 0;
      }
    }

    .status-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      flex-shrink: 0;

      &[data-status="draft"] {
        background: rgba(100, 116, 139, 0.1);
        color: var(--ion-color-medium);
      }

      &[data-status="sent"] {
        background: rgba(245, 158, 11, 0.1);
        color: var(--ion-color-warning-shade);
      }

      &[data-status="accepted"] {
        background: rgba(16, 185, 129, 0.1);
        color: var(--ion-color-success);
      }

      &[data-status="rejected"] {
        background: rgba(239, 68, 68, 0.1);
        color: var(--ion-color-danger);
      }

      &[data-status="expired"] {
        background: rgba(30, 41, 59, 0.1);
        color: var(--ion-color-dark);
      }
    }

    .budget-body {
      padding: 12px 0;
      border-top: 1px solid var(--medical-border-light);
      border-bottom: 1px solid var(--medical-border-light);
    }

    .amount-section {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 8px;

      .amount-label {
        font-size: 12px;
        color: var(--ion-color-medium);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .amount-value {
        font-size: 22px;
        font-weight: 700;
        color: var(--ion-color-primary);
      }
    }

    .budget-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;

      .meta-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: var(--ion-color-medium);

        ion-icon {
          font-size: 14px;
        }
      }
    }

    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 12px;

      .created-date {
        font-size: 12px;
        color: var(--ion-color-medium);
      }

      .arrow-icon {
        color: var(--ion-color-medium);
        font-size: 18px;
      }
    }

    /* Empty state */
    .empty-state, .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 24px;
      text-align: center;

      .empty-icon, .error-icon {
        width: 100px;
        height: 100px;
        background: rgba(var(--ion-color-primary-rgb), 0.1);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 24px;

        ion-icon {
          font-size: 48px;
          color: var(--ion-color-primary);
        }
      }

      .error-icon {
        background: rgba(var(--ion-color-danger-rgb), 0.1);

        ion-icon {
          color: var(--ion-color-danger);
        }
      }

      h3 {
        font-size: 20px;
        font-weight: 600;
        color: var(--ion-color-dark);
        margin: 0 0 8px;
      }

      p {
        font-size: 14px;
        color: var(--ion-color-medium);
        margin: 0 0 24px;
        max-width: 260px;
      }

      ion-button {
        --border-radius: 25px;
        height: 48px;
      }
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
export class BudgetsListPage implements OnInit {
  private store = inject(Store);

  budgets$ = this.store.select(selectAllBudgets);
  loading$ = this.store.select(selectBudgetsLoading);
  error$ = this.store.select(selectBudgetsError);

  allBudgets: Budget[] = [];
  filteredBudgets: Budget[] = [];
  selectedStatus = 'all';

  constructor() {
    addIcons({
      addOutline,
      walletOutline,
      checkmarkCircleOutline,
      timeOutline,
      closeCircleOutline,
      documentTextOutline,
      chevronForwardOutline,
      cashOutline,
      sendOutline,
      alertCircleOutline
    });
  }

  ngOnInit(): void {
    this.loadBudgets();
    this.budgets$.subscribe(budgets => {
      this.allBudgets = budgets;
      this.filterByStatus();
    });
  }

  loadBudgets(): void {
    this.store.dispatch(BudgetsActions.loadBudgets({}));
  }

  doRefresh(event: any): void {
    this.loadBudgets();
    setTimeout(() => event.target.complete(), 1000);
  }

  filterByStatus(): void {
    if (this.selectedStatus === 'all') {
      this.filteredBudgets = this.allBudgets;
    } else {
      this.filteredBudgets = this.allBudgets.filter(b => b.status === this.selectedStatus);
    }
  }

  // Stats helpers
  getTotalAmount(): number {
    return this.allBudgets.reduce((sum, b) => sum + (b.total_amount || 0), 0);
  }

  getDraftCount(): number {
    return this.allBudgets.filter(b => b.status === 'draft').length;
  }

  getAcceptedCount(): number {
    return this.allBudgets.filter(b => b.status === 'accepted').length;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
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
}
