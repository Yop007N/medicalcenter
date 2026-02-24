import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { Payment, PaymentService } from '../core/services/payment.service';
import { pageShellStyles } from './page-shell.styles';

type ApiErrorShape = {
  error?: {
    message?: string;
    msg?: string;
    error?: string;
  };
};

@Component({
  selector: 'app-payments-page',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  template: `
    <section class="page">
      <h1>Pagos</h1>
      <p>Seguimiento de cobranzas y estado de transacciones registradas.</p>

      <div class="toolbar">
        <button type="button" class="refresh-button" (click)="loadPayments()" [disabled]="loading">
          @if (loading) { Cargando... } @else { Actualizar }
        </button>
      </div>

      @if (errorMessage) {
        <div class="error-box" role="alert">{{ errorMessage }}</div>
      }

      @if (!loading && payments.length === 0 && !errorMessage) {
        <article class="card empty">
          <h2 class="card-title">Sin pagos registrados</h2>
          <p class="card-text">Todavía no hay transacciones para mostrar.</p>
        </article>
      }

      @if (payments.length > 0) {
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Monto</th>
                <th>Método</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              @for (payment of payments; track payment.id) {
                <tr>
                  <td>#{{ payment.id }}</td>
                  <td>{{ payment.payment_date || payment.created_at | date:'short' }}</td>
                  <td>{{ payment.amount | currency:(payment.currency || 'ARS'):'symbol':'1.2-2' }}</td>
                  <td>{{ payment.payment_method }}</td>
                  <td>
                    <span class="badge" [class]="'status-' + payment.payment_status">{{ payment.payment_status }}</span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
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

      .table-wrap {
        overflow-x: auto;
      }

      .table {
        border-collapse: collapse;
        min-width: 680px;
        width: 100%;
      }

      .table th,
      .table td {
        border-bottom: 1px solid #eaecf0;
        font-size: 0.82rem;
        padding: 0.55rem 0.5rem;
        text-align: left;
        vertical-align: middle;
      }

      .table th {
        color: #475467;
        font-weight: 600;
      }

      .badge {
        border-radius: 999px;
        display: inline-block;
        font-size: 0.72rem;
        font-weight: 600;
        padding: 0.2rem 0.5rem;
        text-transform: capitalize;
      }

      .status-pending {
        background: #fffaeb;
        color: #b54708;
      }

      .status-completed {
        background: #ecfdf3;
        color: #067647;
      }

      .status-failed {
        background: #fef3f2;
        color: #b42318;
      }

      .status-refunded {
        background: #f5f3ff;
        color: #5925dc;
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

      .empty {
        margin-top: 0.75rem;
      }
    `
  ]
})
export class PaymentsPage implements OnInit {
  private readonly paymentService = inject(PaymentService);

  payments: Payment[] = [];
  loading = false;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.loading = true;
    this.errorMessage = null;

    this.paymentService
      .getPayments()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (payments) => {
          this.payments = payments;
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
    return 'No se pudieron cargar los pagos.';
  }

  private isApiErrorShape(value: unknown): value is ApiErrorShape {
    return typeof value === 'object' && value !== null && 'error' in value;
  }
}
