import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  DashboardOverview,
  DashboardRecentActivity,
  DashboardService
} from '../../core/services/dashboard.service';
import { pageShellStyles } from '../../shared/styles/page-shell.styles';

type ApiErrorShape = {
  error?: {
    message?: string;
    msg?: string;
    error?: string;
  };
};

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  template: `
    <section class="page">
      <h1>Dashboard</h1>
      <p>Resumen operativo para gestionar actividad clinica y financiera.</p>

      <div class="toolbar">
        <button type="button" class="refresh-button" (click)="loadDashboard()" [disabled]="loading">
          @if (loading) { Cargando... } @else { Actualizar }
        </button>
      </div>

      @if (errorMessage) {
        <div class="error-box" role="alert" aria-live="assertive">{{ errorMessage }}</div>
      }

      <div class="grid">
        <article class="card">
          <h2 class="card-title">Pacientes activos</h2>
          <p class="metric">{{ overview?.totals?.patients ?? 0 }}</p>
        </article>
        <article class="card">
          <h2 class="card-title">Profesionales activos</h2>
          <p class="metric">{{ overview?.totals?.professionals ?? 0 }}</p>
        </article>
        <article class="card">
          <h2 class="card-title">Citas totales</h2>
          <p class="metric">{{ overview?.totals?.appointments ?? 0 }}</p>
        </article>
        <article class="card">
          <h2 class="card-title">Revenue total</h2>
          <p class="metric">
            {{ overview?.revenue?.total ?? 0 | currency:(overview?.revenue?.currency || 'PYG'):'symbol':'1.0-2' }}
          </p>
        </article>
      </div>

      @if (overview) {
        <article class="card breakdown">
          <h2 class="card-title">Actividad 30 días</h2>
          <p class="card-text">
            Pacientes nuevos: <strong>{{ overview.recent_activity.new_patients_30d }}</strong>
          </p>
          <p class="card-text">
            Citas creadas: <strong>{{ overview.recent_activity.appointments_30d }}</strong>
          </p>
        </article>
      }

      @if (recentActivity) {
        <div class="grid recent-grid">
          <article class="card">
            <h2 class="card-title">Citas recientes</h2>
            @if (recentActivity.recent_appointments.length === 0) {
              <p class="card-text">Sin movimientos recientes.</p>
            } @else {
              <ul class="simple-list">
                @for (item of recentActivity.recent_appointments.slice(0, 5); track item.id) {
                  <li>
                    <span>#{{ item.id }} · {{ item.status }}</span>
                    <strong>{{ item.date | date:'short' }}</strong>
                  </li>
                }
              </ul>
            }
          </article>

          <article class="card">
            <h2 class="card-title">Pagos recientes</h2>
            @if (recentActivity.recent_payments.length === 0) {
              <p class="card-text">Sin pagos recientes.</p>
            } @else {
              <ul class="simple-list">
                @for (item of recentActivity.recent_payments.slice(0, 5); track item.id) {
                  <li>
                    <span>#{{ item.id }} · {{ item.status }}</span>
                    <strong>{{ item.amount | currency:'PYG':'symbol':'1.0-2' }}</strong>
                  </li>
                }
              </ul>
            }
          </article>
        </div>
      }
    </section>
  `,
  styles: [
    pageShellStyles,
    `
      .toolbar {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 0.75rem;
      }

      .refresh-button {
        background: var(--ms-bg-card);
        border: 1px solid var(--ms-border);
        border-radius: 8px;
        color: var(--ms-text-primary);
        cursor: pointer;
        font-size: 0.82rem;
        font-weight: 600;
        padding: 0.45rem 0.7rem;
      }

      .refresh-button:disabled {
        cursor: not-allowed;
        opacity: 0.65;
      }

      .metric {
        color: var(--ms-text-strong);
        font-size: 1.2rem;
        font-weight: 700;
        margin: 0;
      }

      .breakdown {
        margin-top: 0.75rem;
      }

      .recent-grid {
        margin-top: 0.75rem;
      }

      .simple-list {
        list-style: none;
        margin: 0.4rem 0 0;
        padding: 0;
      }

      .simple-list li {
        align-items: center;
        border-bottom: 1px solid var(--ms-border);
        display: flex;
        font-size: 0.8rem;
        justify-content: space-between;
        padding: 0.42rem 0;
      }

      .error-box {
        background: var(--ms-danger-soft-bg);
        border: 1px solid var(--ms-danger-soft-border);
        border-radius: 8px;
        color: var(--ms-danger);
        font-size: 0.82rem;
        margin-bottom: 0.75rem;
        padding: 0.55rem 0.7rem;
      }
    `
  ]
})
export class DashboardPage implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  loading = false;
  errorMessage: string | null = null;
  overview: DashboardOverview | null = null;
  recentActivity: DashboardRecentActivity | null = null;

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.errorMessage = null;

    forkJoin({
      overview: this.dashboardService.getOverview(),
      recentActivity: this.dashboardService.getRecentActivity()
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: ({ overview, recentActivity }) => {
          this.overview = overview;
          this.recentActivity = recentActivity;
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  private resolveErrorMessage(error: unknown): string {
    if (this.isApiErrorShape(error)) {
      const msg = error.error?.message ?? error.error?.msg ?? error.error?.error;
      if (typeof msg === 'string' && msg.trim().length > 0) {
        return msg;
      }
    }
    return 'No se pudieron cargar los datos del dashboard.';
  }

  private isApiErrorShape(value: unknown): value is ApiErrorShape {
    return typeof value === 'object' && value !== null && 'error' in value;
  }
}
