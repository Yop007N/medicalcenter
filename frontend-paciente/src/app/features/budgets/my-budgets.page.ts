import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { PatientApiService } from '../../core/services/patient-api.service';
import { PatientBudget } from '../../core/models/budget.model';

type ApiErrorShape = {
  error?: {
    msg?: string;
    message?: string;
    error?: string;
  };
};

@Component({
  selector: 'app-my-budgets-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  template: `
    <ion-header translucent="true">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Mis presupuestos</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="page-content">
      <section class="panel hero-panel">
        <h2 class="panel-title">Estado de presupuestos</h2>
        <p class="panel-text">Revisa tus montos, estado de pagos y acepta lo pendiente.</p>
        <div class="summary-grid">
          <article>
            <strong>{{ visibleBudgets.length }}</strong>
            <span>Presupuestos</span>
          </article>
          <article>
            <strong>{{ acceptedCount }}</strong>
            <span>Aceptados</span>
          </article>
          <article>
            <strong>{{ formatMoney(totalAmount) }}</strong>
            <span>Total cotizado</span>
          </article>
          <article>
            <strong>{{ formatMoney(pendingAmount) }}</strong>
            <span>Saldo pendiente</span>
          </article>
        </div>
      </section>

      @if (errorMessage) {
        <div class="error-box" role="alert">{{ errorMessage }}</div>
      }

      <section class="panel">
        <ion-segment [(ngModel)]="selectedFilter" (ionChange)="applyFilter()">
          <ion-segment-button value="all">Todos</ion-segment-button>
          <ion-segment-button value="sent">Pendientes</ion-segment-button>
          <ion-segment-button value="accepted">Aceptados</ion-segment-button>
          <ion-segment-button value="rejected">Rechazados</ion-segment-button>
        </ion-segment>
      </section>

      @if (!loading && budgets.length === 0 && !errorMessage) {
        <section class="panel">
          <h3 class="panel-title">Sin presupuestos</h3>
          <p class="panel-text">Todavia no hay presupuestos asociados a tu perfil.</p>
        </section>
      }

      @if (!loading && budgets.length > 0 && visibleBudgets.length === 0 && !errorMessage) {
        <section class="panel">
          <h3 class="panel-title">Sin resultados</h3>
          <p class="panel-text">No hay presupuestos para el filtro seleccionado.</p>
        </section>
      }

      @for (budget of visibleBudgets; track budget.id) {
        <section class="panel">
          <div class="budget-head">
            <h3 class="panel-title">{{ budget.title }}</h3>
            <span class="status-chip" [class]="'status-' + budget.status">{{ toStatusLabel(budget.status) }}</span>
          </div>
          <p class="panel-text">Monto total: <strong>{{ formatMoney(budget.total_amount, budget.currency) }}</strong></p>
          <p class="panel-text">Pagado: <strong>{{ formatMoney(budget.total_paid ?? 0, budget.currency) }}</strong></p>
          <p class="panel-text">Saldo pendiente: <strong>{{ formatMoney(getPendingAmount(budget), budget.currency) }}</strong></p>
          <p class="panel-text">Fecha: {{ budget.created_at | date:'mediumDate' }}</p>
          @if (budget.valid_until) {
            <p class="panel-text">Vigencia: {{ budget.valid_until | date:'mediumDate' }}</p>
          }
          @if (budget.description) {
            <p class="panel-text">{{ budget.description }}</p>
          }

          <div class="progress-row">
            <ion-progress-bar [value]="getPaymentProgress(budget)"></ion-progress-bar>
            <small>{{ getPaymentProgressPercent(budget) }}% pagado</small>
          </div>

          @if (canAccept(budget)) {
            <ion-button
              size="small"
              class="ion-margin-top"
              (click)="acceptBudget(budget.id)"
              [disabled]="acceptingIds.has(budget.id)"
            >
              @if (acceptingIds.has(budget.id)) {
                Aceptando...
              } @else {
                Aceptar presupuesto
              }
            </ion-button>
          }
        </section>
      }
    </ion-content>
  `,
  styleUrls: ['../../shared/styles/page-shell.styles.scss'],
  styles: [`
      .hero-panel {
        background: linear-gradient(
          140deg,
          rgba(var(--ion-color-primary-rgb), 0.14) 0%,
          rgba(var(--ion-color-primary-rgb), 0.06) 100%
        );
      }

      .summary-grid {
        display: grid;
        gap: 8px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        margin-top: 12px;
      }

      .summary-grid article {
        background: var(--patient-surface);
        border: 1px solid var(--patient-border);
        border-radius: 10px;
        display: grid;
        gap: 2px;
        min-height: 72px;
        padding: 10px;
      }

      .summary-grid strong {
        color: var(--ion-color-dark);
        font-size: 1.05rem;
      }

      .summary-grid span {
        color: var(--ion-color-medium);
        font-size: 0.74rem;
      }

      .budget-head {
        align-items: flex-start;
        display: flex;
        gap: 8px;
        justify-content: space-between;
      }

      .progress-row {
        margin-top: 8px;
      }

      .progress-row small {
        color: var(--ion-color-medium);
        display: block;
        font-size: 0.73rem;
        margin-top: 6px;
      }

      @media (min-width: 768px) {
        .summary-grid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }
      }
    `]
})
export class MyBudgetsPage implements OnInit {
  private readonly patientApi = inject(PatientApiService);

  budgets: PatientBudget[] = [];
  visibleBudgets: PatientBudget[] = [];
  loading = false;
  errorMessage: string | null = null;
  acceptingIds = new Set<number>();
  selectedFilter: 'all' | 'sent' | 'accepted' | 'rejected' = 'all';

  totalAmount = 0;
  pendingAmount = 0;
  acceptedCount = 0;

  ngOnInit(): void {
    this.loadBudgets();
  }

  canAccept(budget: PatientBudget): boolean {
    return budget.status === 'sent';
  }

  acceptBudget(budgetId: number): void {
    this.acceptingIds.add(budgetId);
    this.errorMessage = null;

    this.patientApi.acceptBudget(budgetId).subscribe({
      next: (updatedBudget) => {
        this.budgets = this.budgets.map((budget) =>
          budget.id === budgetId ? { ...budget, ...updatedBudget } : budget
        );
        this.applyFilter();
        this.recalculateTotals();
        this.acceptingIds.delete(budgetId);
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error);
        this.acceptingIds.delete(budgetId);
      }
    });
  }

  private loadBudgets(): void {
    this.loading = true;
    this.errorMessage = null;

    this.patientApi.getMyBudgets().subscribe({
      next: (budgets) => {
        this.budgets = budgets.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        this.applyFilter();
        this.recalculateTotals();
        this.loading = false;
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error);
        this.loading = false;
      }
    });
  }

  private resolveErrorMessage(error: unknown): string {
    if (this.isApiErrorShape(error)) {
      const message = error.error?.msg ?? error.error?.message ?? error.error?.error;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }

    return 'No se pudieron cargar o actualizar los presupuestos.';
  }

  applyFilter(): void {
    if (this.selectedFilter === 'all') {
      this.visibleBudgets = [...this.budgets];
      return;
    }

    this.visibleBudgets = this.budgets.filter((budget) => budget.status === this.selectedFilter);
  }

  toStatusLabel(status: PatientBudget['status']): string {
    const labels: Record<PatientBudget['status'], string> = {
      draft: 'Borrador',
      sent: 'Pendiente',
      accepted: 'Aceptado',
      rejected: 'Rechazado',
      expired: 'Vencido'
    };
    return labels[status] ?? status;
  }

  getPendingAmount(budget: PatientBudget): number {
    const total = Number(budget.total_amount ?? 0);
    const paid = Number(budget.total_paid ?? 0);
    return Math.max(total - paid, 0);
  }

  getPaymentProgress(budget: PatientBudget): number {
    const total = Number(budget.total_amount ?? 0);
    if (total <= 0) {
      return 0;
    }

    const paid = Number(budget.total_paid ?? 0);
    return Math.max(0, Math.min(1, paid / total));
  }

  getPaymentProgressPercent(budget: PatientBudget): number {
    return Math.round(this.getPaymentProgress(budget) * 100);
  }

  formatMoney(amount: number, currency = 'PYG'): string {
    const safeAmount = Number.isFinite(amount) ? amount : 0;
    try {
      return new Intl.NumberFormat('es-PY', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(safeAmount);
    } catch {
      return `${currency} ${safeAmount.toLocaleString('es-PY')}`;
    }
  }

  private recalculateTotals(): void {
    this.totalAmount = this.budgets.reduce((acc, budget) => acc + Number(budget.total_amount ?? 0), 0);
    this.pendingAmount = this.budgets.reduce((acc, budget) => acc + this.getPendingAmount(budget), 0);
    this.acceptedCount = this.budgets.filter((budget) => budget.status === 'accepted').length;
  }

  private isApiErrorShape(value: unknown): value is ApiErrorShape {
    return typeof value === 'object' && value !== null && 'error' in value;
  }
}
