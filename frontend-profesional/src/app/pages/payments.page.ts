import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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

type PaymentMethod = 'cash' | 'card' | 'transfer' | 'insurance' | 'check' | 'other';

@Component({
  selector: 'app-payments-page',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, ReactiveFormsModule],
  template: `
    <section class="page">
      <h1>Pagos</h1>
      <p>Seguimiento de cobranzas y estado de transacciones registradas.</p>

      <div class="toolbar">
        <input
          #budgetInput
          type="number"
          min="1"
          class="search-input"
          placeholder="Filtrar por budget_id"
          (keyup.enter)="applyFilters(budgetInput.value, statusInput.value)"
        />
        <select #statusInput class="search-input" (change)="applyFilters(budgetInput.value, statusInput.value)">
          <option value="">Todos los estados</option>
          <option value="pending">pending</option>
          <option value="completed">completed</option>
          <option value="failed">failed</option>
          <option value="refunded">refunded</option>
        </select>
        <button type="button" class="toolbar-button" (click)="openCreateForm()" [disabled]="submitting">
          Nuevo pago
        </button>
        <button type="button" class="toolbar-button" (click)="loadPayments()" [disabled]="loading">
          @if (loading) { Cargando... } @else { Actualizar }
        </button>
      </div>

      @if (activeSpecialtyKey) {
        <p class="scope-text">
          Scope por especialidad: <strong>{{ activeSpecialtyKey }}</strong>
        </p>
      }

      @if (errorMessage) {
        <div class="error-box" role="alert">{{ errorMessage }}</div>
      }

      @if (successMessage) {
        <div class="success-box" role="status">{{ successMessage }}</div>
      }

      @if (showForm) {
        <article class="card form-card">
          <h2 class="card-title">Registrar pago</h2>
          <form [formGroup]="paymentForm" (ngSubmit)="createPayment()" class="form-grid" novalidate>
            <label>
              Budget ID (opcional)
              <input type="number" min="1" formControlName="budget_id" />
            </label>
            <label>
              Monto
              <input type="number" min="0.01" step="0.01" formControlName="amount" />
            </label>
            <label>
              Metodo
              <select formControlName="payment_method">
                <option value="cash">cash</option>
                <option value="card">card</option>
                <option value="transfer">transfer</option>
                <option value="insurance">insurance</option>
                <option value="check">check</option>
                <option value="other">other</option>
              </select>
            </label>
            <label class="full-row">
              Notas
              <textarea rows="2" formControlName="notes"></textarea>
            </label>
            @if (fieldError) {
              <p class="field-error full-row">{{ fieldError }}</p>
            }
            <div class="form-actions full-row">
              <button class="primary-button" type="submit" [disabled]="submitting">
                @if (submitting) { Guardando... } @else { Crear pago }
              </button>
              <button class="secondary-button" type="button" (click)="closeForm()" [disabled]="submitting">
                Cancelar
              </button>
            </div>
          </form>
        </article>
      }

      @if (!loading && payments.length === 0 && !errorMessage) {
        <article class="card empty">
          <h2 class="card-title">Sin pagos registrados</h2>
          <p class="card-text">Todavia no hay transacciones para mostrar.</p>
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
                <th>Metodo</th>
                <th>Estado</th>
                <th>Acciones</th>
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
                  <td>
                    <div class="row-actions">
                      <button
                        class="table-action"
                        type="button"
                        (click)="processPayment(payment)"
                        [disabled]="processingIds.has(payment.id) || payment.payment_status !== 'pending'"
                      >
                        @if (processingIds.has(payment.id)) { Procesando... } @else { Procesar }
                      </button>
                      <button class="table-action danger" type="button" (click)="deletePayment(payment)">
                        Eliminar
                      </button>
                    </div>
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
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
      }

      .scope-text {
        color: var(--ms-text-secondary);
        font-size: 0.78rem;
        margin: -0.25rem 0 0.6rem;
      }

      .search-input,
      input,
      select,
      textarea {
        border: 1px solid var(--ms-border);
        border-radius: 8px;
        font-size: 0.82rem;
        padding: 0.45rem 0.6rem;
      }

      .search-input {
        flex: 1 1 200px;
        min-width: 180px;
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

      .form-card {
        margin-bottom: 0.75rem;
      }

      .form-grid {
        display: grid;
        gap: 0.6rem;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        margin-top: 0.5rem;
      }

      .form-grid label {
        color: var(--ms-text-primary);
        display: grid;
        font-size: 0.78rem;
        font-weight: 600;
        gap: 0.3rem;
      }

      .full-row {
        grid-column: 1 / -1;
      }

      .form-actions {
        display: flex;
        gap: 0.5rem;
      }

      .primary-button {
        background: var(--ms-primary);
        border: 0;
        border-radius: 8px;
        color: var(--ms-bg-card);
        cursor: pointer;
        font-size: 0.8rem;
        font-weight: 600;
        padding: 0.45rem 0.75rem;
      }

      .secondary-button {
        background: var(--ms-bg-card);
        border: 1px solid var(--ms-border);
        border-radius: 8px;
        color: var(--ms-text-primary);
        cursor: pointer;
        font-size: 0.8rem;
        font-weight: 600;
        padding: 0.45rem 0.75rem;
      }

      .primary-button:disabled,
      .secondary-button:disabled {
        cursor: not-allowed;
        opacity: 0.7;
      }

      .table-wrap {
        overflow-x: auto;
      }

      .table {
        border-collapse: collapse;
        min-width: 860px;
        width: 100%;
      }

      .table th,
      .table td {
        border-bottom: 1px solid var(--ms-border);
        font-size: 0.82rem;
        padding: 0.55rem 0.5rem;
        text-align: left;
        vertical-align: middle;
      }

      .table th {
        color: var(--ms-text-secondary);
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
        background: var(--ms-warning-soft-bg);
        color: var(--ms-warning);
      }

      .status-completed {
        background: var(--ms-success-soft-bg);
        color: var(--ms-success);
      }

      .status-failed {
        background: var(--ms-danger-soft-bg);
        color: var(--ms-danger);
      }

      .status-refunded {
        background: var(--ms-bg-soft);
        color: var(--ms-primary);
      }

      .row-actions {
        display: flex;
        gap: 0.35rem;
      }

      .table-action {
        background: var(--ms-bg-card);
        border: 1px solid var(--ms-border);
        border-radius: 8px;
        color: var(--ms-text-primary);
        cursor: pointer;
        font-size: 0.74rem;
        font-weight: 600;
        padding: 0.22rem 0.45rem;
      }

      .table-action:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }

      .table-action.danger {
        border-color: var(--ms-danger-soft-border);
        color: var(--ms-danger);
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

      .field-error {
        color: var(--ms-danger);
        font-size: 0.78rem;
        margin: 0;
      }

      .empty {
        margin-top: 0.75rem;
      }
    `
  ]
})
export class PaymentsPage implements OnInit {
  private readonly paymentService = inject(PaymentService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);

  payments: Payment[] = [];
  loading = false;
  submitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  fieldError: string | null = null;
  showForm = false;
  filterBudgetId: number | undefined;
  filterStatus: string | undefined;
  activeSpecialtyKey: string | undefined;
  processingIds = new Set<number>();

  readonly paymentForm = this.fb.group({
    budget_id: [0],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    payment_method: ['cash' as PaymentMethod, [Validators.required]],
    notes: ['']
  });

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const nextSpecialtyKey = this.normalizeSpecialtyKey(params.get('specialty_key'));
      const scopeChanged = nextSpecialtyKey !== this.activeSpecialtyKey;
      this.activeSpecialtyKey = nextSpecialtyKey;

      if (scopeChanged || this.payments.length === 0) {
        this.loadPayments();
      }
    });
  }

  applyFilters(rawBudgetId: string, status: string): void {
    const budgetId = Number(rawBudgetId);
    this.filterBudgetId = Number.isInteger(budgetId) && budgetId > 0 ? budgetId : undefined;
    this.filterStatus = status.trim() || undefined;
    this.loadPayments();
  }

  loadPayments(): void {
    this.loading = true;
    this.errorMessage = null;

    const filters: { budget_id?: number; status?: string; specialty_key?: string } = {};
    if (this.filterBudgetId) {
      filters.budget_id = this.filterBudgetId;
    }
    if (this.filterStatus) {
      filters.status = this.filterStatus;
    }
    if (this.activeSpecialtyKey) {
      filters.specialty_key = this.activeSpecialtyKey;
    }

    this.paymentService
      .getPayments(Object.keys(filters).length ? filters : undefined)
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

  openCreateForm(): void {
    this.showForm = true;
    this.fieldError = null;
    this.successMessage = null;
    this.paymentForm.reset({
      budget_id: 0,
      amount: 0,
      payment_method: 'cash',
      notes: ''
    });
  }

  closeForm(): void {
    this.showForm = false;
    this.fieldError = null;
  }

  createPayment(): void {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      this.fieldError = 'Monto y metodo son obligatorios.';
      return;
    }

    const formValue = this.paymentForm.getRawValue();
    const payload: Partial<Payment> & { payment_method: PaymentMethod } = {
      amount: Number(formValue.amount),
      payment_method: formValue.payment_method,
      notes: this.trimOrNull(formValue.notes) ?? undefined
    };
    if (formValue.budget_id > 0) {
      payload.budget_id = formValue.budget_id;
    }

    this.submitting = true;
    this.errorMessage = null;
    this.fieldError = null;
    this.successMessage = null;

    this.paymentService
      .createPayment(payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: (createdPayment) => {
          this.payments = [createdPayment, ...this.payments];
          this.showForm = false;
          this.successMessage = `Pago #${createdPayment.id} creado correctamente.`;
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  processPayment(payment: Payment): void {
    if (payment.payment_status !== 'pending') {
      return;
    }

    this.processingIds.add(payment.id);
    this.errorMessage = null;
    this.successMessage = null;

    this.paymentService.processPayment(payment.id).subscribe({
      next: (updatedPayment) => {
        this.payments = this.payments.map((item) =>
          item.id === payment.id ? { ...item, ...updatedPayment } : item
        );
        this.successMessage = `Pago #${payment.id} procesado correctamente.`;
        this.processingIds.delete(payment.id);
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error);
        this.processingIds.delete(payment.id);
      }
    });
  }

  deletePayment(payment: Payment): void {
    const confirmed = window.confirm(`Eliminar pago #${payment.id}?`);
    if (!confirmed) {
      return;
    }

    this.errorMessage = null;
    this.successMessage = null;
    this.paymentService.deletePayment(payment.id).subscribe({
      next: () => {
        this.payments = this.payments.filter((item) => item.id !== payment.id);
        this.successMessage = `Pago #${payment.id} eliminado correctamente.`;
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  private trimOrNull(value: string): string | null {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private resolveErrorMessage(error: unknown): string {
    if (this.isApiErrorShape(error)) {
      const msg = error.error?.message ?? error.error?.msg ?? error.error?.error;
      if (typeof msg === 'string' && msg.trim().length > 0) {
        return msg;
      }
    }
    return 'No se pudieron gestionar los pagos.';
  }

  private isApiErrorShape(value: unknown): value is ApiErrorShape {
    return typeof value === 'object' && value !== null && 'error' in value;
  }

  private normalizeSpecialtyKey(rawKey: string | null): string | undefined {
    if (!rawKey) {
      return undefined;
    }
    const normalized = rawKey.trim().toLowerCase();
    return /^[a-z0-9-]+$/.test(normalized) ? normalized : undefined;
  }
}
