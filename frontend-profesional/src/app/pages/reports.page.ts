import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AppointmentSummary, QuickStats, ReportService } from '../core/services/report.service';
import { pageShellStyles } from './page-shell.styles';

type ApiErrorShape = {
  error?: {
    message?: string;
    msg?: string;
    error?: string;
  };
};

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  template: `
    <section class="page">
      <h1>Reportes</h1>
      <p>Indicadores rápidos de operación clínica y agenda.</p>

      <div class="toolbar">
        <button type="button" class="refresh-button" (click)="loadData()" [disabled]="loading">
          @if (loading) { Cargando... } @else { Actualizar }
        </button>
      </div>

      @if (errorMessage) {
        <div class="error-box" role="alert">{{ errorMessage }}</div>
      }

      <div class="grid stats-grid">
        <article class="card">
          <h2 class="card-title">Citas hoy</h2>
          <p class="metric">{{ stats?.today_appointments ?? 0 }}</p>
        </article>
        <article class="card">
          <h2 class="card-title">Presupuestos pendientes</h2>
          <p class="metric">{{ stats?.pending_budgets ?? 0 }}</p>
        </article>
        <article class="card">
          <h2 class="card-title">Pacientes nuevos (mes)</h2>
          <p class="metric">{{ stats?.new_patients_this_month ?? 0 }}</p>
        </article>
        <article class="card">
          <h2 class="card-title">Revenue (mes)</h2>
          <p class="metric">{{ stats?.revenue_this_month ?? 0 | number:'1.0-2' }}</p>
        </article>
      </div>

      @if (appointmentSummary) {
        <article class="card breakdown">
          <h2 class="card-title">Resumen de citas (30 días)</h2>
          <p class="card-text">Total: {{ appointmentSummary.total_appointments }}</p>

          @if (appointmentSummary.by_status.length > 0) {
            <ul class="status-list">
              @for (item of appointmentSummary.by_status; track item.status) {
                <li>
                  <span>{{ item.status }}</span>
                  <strong>{{ item.count }}</strong>
                </li>
              }
            </ul>
          } @else {
            <p class="card-text">Sin actividad de citas en el período.</p>
          }
        </article>
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
        background: #ffffff;
        border: 1px solid #d0d5dd;
        border-radius: 8px;
        color: #344054;
        cursor: pointer;
        font-size: 0.82rem;
        font-weight: 600;
        padding: 0.45rem 0.7rem;
      }

      .refresh-button:disabled {
        cursor: not-allowed;
        opacity: 0.65;
      }

      .stats-grid {
        margin-bottom: 0.75rem;
      }

      .metric {
        color: #0f172a;
        font-size: 1.2rem;
        font-weight: 700;
        margin: 0;
      }

      .breakdown {
        margin-top: 0.5rem;
      }

      .status-list {
        list-style: none;
        margin: 0.55rem 0 0;
        padding: 0;
      }

      .status-list li {
        align-items: center;
        border-bottom: 1px solid #eaecf0;
        display: flex;
        font-size: 0.82rem;
        justify-content: space-between;
        padding: 0.45rem 0;
      }

      .error-box {
        background: #fef3f2;
        border: 1px solid #fecdca;
        border-radius: 8px;
        color: #b42318;
        font-size: 0.82rem;
        margin-bottom: 0.75rem;
        padding: 0.55rem 0.7rem;
      }
    `
  ]
})
export class ReportsPage implements OnInit {
  private readonly reportService = inject(ReportService);

  loading = false;
  errorMessage: string | null = null;
  stats: QuickStats | null = null;
  appointmentSummary: AppointmentSummary | null = null;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    this.loading = true;
    this.errorMessage = null;

    forkJoin({
      stats: this.reportService.getQuickStats(),
      summary: this.reportService.getAppointmentsSummary(
        this.toDateParam(startDate),
        this.toDateParam(endDate)
      )
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: ({ stats, summary }) => {
          this.stats = stats;
          this.appointmentSummary = summary;
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  private toDateParam(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private resolveErrorMessage(error: unknown): string {
    if (this.isApiErrorShape(error)) {
      const msg = error.error?.message ?? error.error?.msg ?? error.error?.error;
      if (typeof msg === 'string' && msg.trim().length > 0) {
        return msg;
      }
    }
    return 'No se pudieron cargar los reportes.';
  }

  private isApiErrorShape(value: unknown): value is ApiErrorShape {
    return typeof value === 'object' && value !== null && 'error' in value;
  }
}
