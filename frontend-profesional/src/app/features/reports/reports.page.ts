import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  AppointmentSummary,
  FinancialSummaryReport,
  MedicalSummaryReport,
  QuickStats,
  ReportService
} from '../../core/services/report.service';
import { pageShellStyles } from '../../shared/styles/page-shell.styles';

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
  imports: [CommonModule, DecimalPipe, FormsModule],
  template: `
    <section class="page">
      <h1>Reportes</h1>
      <p>Indicadores de operacion clinica con filtros avanzados y exportacion.</p>

      <div class="toolbar">
        <label>
          Desde
          <input type="date" [(ngModel)]="startDate" />
        </label>
        <label>
          Hasta
          <input type="date" [(ngModel)]="endDate" />
        </label>
        <button type="button" class="toolbar-button" (click)="loadData()" [disabled]="loading">
          @if (loading) { Cargando... } @else { Aplicar filtros }
        </button>
      </div>

      <div class="export-toolbar">
        <button
          type="button"
          class="export-button"
          (click)="exportReport('appointments')"
          [disabled]="exportingType !== null"
        >
          @if (exportingType === 'appointments') { Exportando... } @else { Exportar citas CSV }
        </button>
        <button
          type="button"
          class="export-button"
          (click)="exportReport('financial')"
          [disabled]="exportingType !== null"
        >
          @if (exportingType === 'financial') { Exportando... } @else { Exportar finanzas CSV }
        </button>
        <button
          type="button"
          class="export-button"
          (click)="exportReport('medical')"
          [disabled]="exportingType !== null"
        >
          @if (exportingType === 'medical') { Exportando... } @else { Exportar medico CSV }
        </button>
      </div>

      @if (errorMessage) {
        <div class="error-box" role="alert">{{ errorMessage }}</div>
      }

      @if (successMessage) {
        <div class="success-box" role="status">{{ successMessage }}</div>
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
          <h2 class="card-title">Resumen de citas</h2>
          <p class="card-text">Total: {{ appointmentSummary.total_appointments }}</p>
          <p class="card-text">
            Tasa cancelacion: {{ appointmentSummary.cancellation_rate | number:'1.0-2' }}
            | No show: {{ appointmentSummary.no_show_rate | number:'1.0-2' }}
          </p>

          @if (appointmentSummary.by_status.length > 0) {
            <ul class="status-list">
              @for (item of appointmentSummary.by_status; track item.status) {
                <li>
                  <span>{{ item.status }}</span>
                  <strong>{{ item.count }}</strong>
                </li>
              }
            </ul>
          }
        </article>
      }

      <div class="grid summary-grid">
        <article class="card">
          <h2 class="card-title">Resumen medico</h2>
          <p class="card-text">Registros: {{ medicalSummary?.total_records ?? 0 }}</p>
          @if (medicalSummary?.by_specialty?.length) {
            <ul class="status-list compact">
              @for (item of medicalSummary?.by_specialty ?? []; track item.specialty) {
                <li>
                  <span>{{ item.specialty }}</span>
                  <strong>{{ item.count }}</strong>
                </li>
              }
            </ul>
          } @else {
            <p class="card-text muted">Sin datos por especialidad.</p>
          }
        </article>

        <article class="card">
          <h2 class="card-title">Resumen financiero</h2>
          <p class="card-text">Revenue: {{ financialSummary?.total_revenue ?? 0 | number:'1.0-2' }}</p>
          <p class="card-text">Pendiente: {{ financialSummary?.total_pending ?? 0 | number:'1.0-2' }}</p>
          @if (financialSummary?.by_payment_method?.length) {
            <ul class="status-list compact">
              @for (item of financialSummary?.by_payment_method ?? []; track item.method) {
                <li>
                  <span>{{ item.method }}</span>
                  <strong>{{ item.amount | number:'1.0-2' }}</strong>
                </li>
              }
            </ul>
          } @else {
            <p class="card-text muted">Sin datos por metodo.</p>
          }
        </article>
      </div>
    </section>
  `,
  styles: [
    pageShellStyles,
    `
      .toolbar {
        align-items: end;
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
        margin-bottom: 0.5rem;
      }

      .toolbar label {
        color: var(--ms-text-primary);
        display: grid;
        font-size: 0.78rem;
        font-weight: 600;
        gap: 0.3rem;
      }

      input[type='date'] {
        border: 1px solid var(--ms-border);
        border-radius: 8px;
        font-size: 0.82rem;
        padding: 0.45rem 0.6rem;
      }

      .toolbar-button {
        background: var(--ms-bg-card);
        border: 1px solid var(--ms-border);
        border-radius: 8px;
        color: var(--ms-text-primary);
        cursor: pointer;
        font-size: 0.82rem;
        font-weight: 600;
        padding: 0.45rem 0.7rem;
      }

      .toolbar-button:disabled {
        cursor: not-allowed;
        opacity: 0.65;
      }

      .export-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
        margin-bottom: 0.75rem;
      }

      .export-button {
        background: var(--ms-primary);
        border: 0;
        border-radius: 8px;
        color: var(--ms-bg-card);
        cursor: pointer;
        font-size: 0.75rem;
        font-weight: 600;
        padding: 0.38rem 0.62rem;
      }

      .export-button:disabled {
        background: var(--ms-primary-soft-border);
        cursor: not-allowed;
      }

      .stats-grid,
      .summary-grid {
        margin-bottom: 0.75rem;
      }

      .metric {
        color: var(--ms-text-strong);
        font-size: 1.2rem;
        font-weight: 700;
        margin: 0;
      }

      .breakdown {
        margin-bottom: 0.75rem;
      }

      .status-list {
        list-style: none;
        margin: 0.55rem 0 0;
        padding: 0;
      }

      .status-list li {
        align-items: center;
        border-bottom: 1px solid var(--ms-border);
        display: flex;
        font-size: 0.82rem;
        justify-content: space-between;
        padding: 0.45rem 0;
      }

      .status-list.compact li {
        font-size: 0.78rem;
        padding: 0.35rem 0;
      }

      .error-box,
      .success-box {
        border-radius: 8px;
        font-size: 0.82rem;
        margin-bottom: 0.75rem;
        padding: 0.55rem 0.7rem;
      }

      .error-box {
        background: var(--ms-danger-soft-bg);
        border: 1px solid var(--ms-danger-soft-border);
        color: var(--ms-danger);
      }

      .success-box {
        background: var(--ms-success-soft-bg);
        border: 1px solid var(--ms-success-soft-border);
        color: var(--ms-success);
      }

      .muted {
        color: var(--ms-text-muted);
      }
    `
  ]
})
export class ReportsPage implements OnInit {
  private readonly reportService = inject(ReportService);

  loading = false;
  exportingType: 'appointments' | 'financial' | 'medical' | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  startDate = '';
  endDate = '';

  stats: QuickStats | null = null;
  appointmentSummary: AppointmentSummary | null = null;
  medicalSummary: MedicalSummaryReport | null = null;
  financialSummary: FinancialSummaryReport | null = null;

  ngOnInit(): void {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    this.startDate = this.toDateParam(startDate);
    this.endDate = this.toDateParam(endDate);
    this.loadData();
  }

  loadData(): void {
    if (!this.startDate || !this.endDate) {
      this.errorMessage = 'Debes definir fecha desde y hasta.';
      return;
    }

    this.loading = true;
    this.errorMessage = null;
    this.successMessage = null;

    forkJoin({
      stats: this.reportService.getQuickStats(),
      summary: this.reportService.getAppointmentsSummary(this.startDate, this.endDate),
      medical: this.reportService.getMedicalSummary(this.startDate, this.endDate),
      financial: this.reportService.getFinancialSummary(this.startDate, this.endDate)
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: ({ stats, summary, medical, financial }) => {
          this.stats = stats;
          this.appointmentSummary = summary;
          this.medicalSummary = medical;
          this.financialSummary = financial;
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  exportReport(reportType: 'appointments' | 'financial' | 'medical'): void {
    if (!this.startDate || !this.endDate) {
      this.errorMessage = 'Debes definir fecha desde y hasta para exportar.';
      return;
    }

    this.exportingType = reportType;
    this.errorMessage = null;
    this.successMessage = null;

    this.reportService
      .exportReport(reportType, this.startDate, this.endDate)
      .pipe(finalize(() => (this.exportingType = null)))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const anchor = window.document.createElement('a');
          anchor.href = url;
          anchor.download = `reporte-${reportType}-${this.startDate}-${this.endDate}.csv`;
          anchor.click();
          window.URL.revokeObjectURL(url);
          this.successMessage = `Reporte ${reportType} exportado correctamente.`;
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
    return 'No se pudo cargar o exportar reportes.';
  }

  private isApiErrorShape(value: unknown): value is ApiErrorShape {
    return typeof value === 'object' && value !== null && 'error' in value;
  }
}
