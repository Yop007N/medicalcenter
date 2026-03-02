import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../core/auth/auth.service';
import { SpecialtyAccessService } from '../core/auth/specialty-access.service';
import { BudgetService } from '../core/services/budget.service';
import { Budget } from '../shared/models/budget.model';
import { UiDialogService } from '../shared/services/ui-dialog.service';
import { buildClinicalScopeQueryParams, ClinicalWorkspaceRoute } from '../shared/utils/clinical-scope';
import { pageShellStyles } from './page-shell.styles';

type ApiErrorShape = {
  error?: {
    message?: string;
    msg?: string;
    error?: string;
  };
};

type BudgetFormMode = 'create' | 'edit';
type BudgetStatus = Budget['status'];

@Component({
  selector: 'app-budgets-page',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, ReactiveFormsModule],
  template: `
    <section class="page">
      <h1>Presupuestos</h1>
      <p>Gestion completa de presupuestos: alta, edicion, envio y eliminacion.</p>

      <div class="toolbar">
        <input
          #patientInput
          type="number"
          min="1"
          class="search-input"
          placeholder="Filtrar por patient_id"
          (keyup.enter)="applyFilters(patientInput.value, statusInput.value)"
        />
        <select #statusInput class="search-input" (change)="applyFilters(patientInput.value, statusInput.value)">
          <option value="">Todos los estados</option>
          <option value="draft">draft</option>
          <option value="sent">sent</option>
          <option value="accepted">accepted</option>
          <option value="rejected">rejected</option>
          <option value="expired">expired</option>
        </select>
        <button type="button" class="toolbar-button" (click)="applyFilters(patientInput.value, statusInput.value)" [disabled]="loading">
          Filtrar
        </button>
        <button type="button" class="toolbar-button" (click)="openCreateForm()" [disabled]="submitting">
          Nuevo presupuesto
        </button>
        <button type="button" class="toolbar-button" (click)="loadBudgets()" [disabled]="loading">
          @if (loading) { Cargando... } @else { Actualizar }
        </button>
      </div>

      @if (filterPatientId) {
        <article class="scope-card">
          <h2 class="scope-card__title">Workspace clinico paciente #{{ filterPatientId }}</h2>
          <p class="scope-card__text">Navegacion rapida entre modulos conservando el contexto actual.</p>
          <div class="scope-links">
            <button type="button" class="scope-link" (click)="openPatientWorkspace('appointments')">Citas</button>
            <button type="button" class="scope-link" (click)="openPatientWorkspace('medical-records')">Registros</button>
            <button type="button" class="scope-link" (click)="openPatientWorkspace('files')">Archivos</button>
            <button type="button" class="scope-link" (click)="openPatientWorkspace('payments')">Pagos</button>
            <button type="button" class="scope-link scope-link--ghost" (click)="clearPatientScope()">Quitar contexto</button>
          </div>
        </article>
      }

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
          <h2 class="card-title">
            @if (formMode === 'create') { Crear presupuesto } @else { Editar presupuesto #{{ editingBudgetId }} }
          </h2>

          <form [formGroup]="budgetForm" (ngSubmit)="submitForm()" class="form-grid" novalidate>
            <label>
              Patient ID
              <input type="number" min="1" formControlName="patient_id" />
            </label>

            <label>
              Titulo
              <input type="text" formControlName="title" />
            </label>

            <label>
              Monto total
              <input type="number" min="0.01" step="0.01" formControlName="total_amount" />
            </label>

            <label>
              Moneda
              <input type="text" maxlength="5" formControlName="currency" />
            </label>

            <label>
              Valido hasta
              <input type="date" formControlName="valid_until" />
            </label>

            <label class="full-row">
              Descripcion
              <textarea rows="3" formControlName="description"></textarea>
            </label>

            @if (fieldError) {
              <p class="field-error full-row">{{ fieldError }}</p>
            }

            <div class="form-actions full-row">
              <button class="primary-button" type="submit" [disabled]="submitting">
                @if (submitting) { Guardando... } @else if (formMode === 'create') { Crear } @else { Guardar }
              </button>
              <button class="secondary-button" type="button" (click)="closeForm()" [disabled]="submitting">
                Cancelar
              </button>
            </div>
          </form>
        </article>
      }

      @if (!loading && budgets.length === 0 && !errorMessage) {
        <article class="card empty">
          <h2 class="card-title">Sin presupuestos registrados</h2>
          <p class="card-text">Todavia no hay presupuestos para mostrar.</p>
        </article>
      }

      @if (budgets.length > 0) {
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Titulo</th>
                <th>Paciente</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Creado</th>
                <th>Valido hasta</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (budget of budgets; track budget.id) {
                <tr>
                  <td>#{{ budget.id }}</td>
                  <td>{{ budget.title }}</td>
                  <td>{{ budget.patient_id }}</td>
                  <td>{{ budget.total_amount | currency:(budget.currency || 'PYG'):'symbol':'1.2-2' }}</td>
                  <td>
                    <span class="badge" [class]="'status-' + budget.status">{{ budget.status }}</span>
                  </td>
                  <td>{{ budget.created_at | date:'short' }}</td>
                  <td>{{ budget.valid_until | date:'shortDate' }}</td>
                  <td>
                    <div class="row-actions">
                      @if (canSendBudget(budget)) {
                        <button
                          type="button"
                          class="table-action"
                          (click)="sendBudget(budget.id)"
                          [disabled]="sendingIds.has(budget.id)"
                        >
                          @if (sendingIds.has(budget.id)) { Enviando... } @else { Enviar }
                        </button>
                      }
                      <button
                        type="button"
                        class="table-action"
                        (click)="startEdit(budget)"
                        [disabled]="submitting || deletingIds.has(budget.id)"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        class="table-action danger"
                        (click)="deleteBudget(budget)"
                        [disabled]="deletingIds.has(budget.id) || sendingIds.has(budget.id)"
                      >
                        @if (deletingIds.has(budget.id)) { Eliminando... } @else { Eliminar }
                      </button>
                      @if (!canSendBudget(budget)) {
                        <span class="muted">Sin envio</span>
                      }
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

      .scope-card {
        border: 1px solid var(--ms-border);
        background: var(--ms-surface-alt);
        border-radius: 0.9rem;
        margin-bottom: 0.75rem;
        padding: 0.9rem;
      }

      .scope-card__title {
        margin: 0;
        font-size: 0.92rem;
      }

      .scope-card__text {
        margin: 0.3rem 0 0.7rem;
        color: var(--ms-text-secondary);
        font-size: 0.78rem;
      }

      .scope-links {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
      }

      .scope-link {
        background: var(--ms-bg-card);
        border: 1px solid var(--ms-border-strong);
        border-radius: 999px;
        color: var(--ms-text-primary);
        cursor: pointer;
        font-size: 0.74rem;
        font-weight: 600;
        padding: 0.3rem 0.7rem;
      }

      .scope-link--ghost {
        border-color: var(--ms-danger-soft-border);
        color: var(--ms-danger);
      }

      .scope-text {
        color: var(--ms-text-secondary);
        font-size: 0.78rem;
        margin: -0.25rem 0 0.6rem;
      }

      .search-input,
      input,
      textarea,
      select {
        border: 1px solid var(--ms-border);
        border-radius: 8px;
        font-size: 0.82rem;
        padding: 0.45rem 0.6rem;
      }

      .search-input {
        flex: 1 1 200px;
        min-width: 170px;
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
        justify-content: flex-end;
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
        min-width: 900px;
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

      .status-draft {
        background: var(--ms-primary-soft-bg);
        color: var(--ms-primary);
      }

      .status-pending,
      .status-sent {
        background: var(--ms-warning-soft-bg);
        color: var(--ms-warning);
      }

      .status-accepted {
        background: var(--ms-success-soft-bg);
        color: var(--ms-success);
      }

      .status-rejected,
      .status-expired {
        background: var(--ms-danger-soft-bg);
        color: var(--ms-danger);
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

      .error-box {
        background: var(--ms-danger-soft-bg);
        border: 1px solid var(--ms-danger-soft-border);
        border-radius: 8px;
        color: var(--ms-danger);
        font-size: 0.82rem;
        margin-bottom: 0.75rem;
        padding: 0.55rem 0.7rem;
      }

      .success-box {
        background: var(--ms-success-soft-bg);
        border: 1px solid var(--ms-success-soft-border);
        border-radius: 8px;
        color: var(--ms-success);
        font-size: 0.82rem;
        margin-bottom: 0.75rem;
        padding: 0.55rem 0.7rem;
      }

      .field-error {
        color: var(--ms-danger);
        font-size: 0.78rem;
        margin: 0;
      }

      .muted {
        color: var(--ms-text-muted);
      }

      .empty {
        margin-top: 0.75rem;
      }
    `
  ]
})
export class BudgetsPage implements OnInit {
  private readonly budgetService = inject(BudgetService);
  private readonly authService = inject(AuthService);
  private readonly specialtyAccess = inject(SpecialtyAccessService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(UiDialogService);

  budgets: Budget[] = [];
  loading = false;
  submitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  fieldError: string | null = null;
  showForm = false;
  formMode: BudgetFormMode = 'create';
  editingBudgetId: number | null = null;
  filterPatientId: number | undefined;
  filterStatus: BudgetStatus | undefined;
  activeSpecialtyKey: string | undefined;
  sendingIds = new Set<number>();
  deletingIds = new Set<number>();
  readonly currentUser = this.authService.currentUserValue;
  readonly sessionSpecialtyKey = this.resolveSessionSpecialtyKey();

  readonly budgetForm = this.fb.group({
    patient_id: [1, [Validators.required, Validators.min(1)]],
    title: ['', [Validators.required]],
    description: [''],
    total_amount: [0, [Validators.required, Validators.min(0.01)]],
    currency: ['PYG', [Validators.required, Validators.minLength(3), Validators.maxLength(5)]],
    valid_until: ['']
  });

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const nextSpecialtyKey =
        this.normalizeSpecialtyKey(params.get('specialty_key')) ?? this.sessionSpecialtyKey;
      const nextPatientId = this.normalizePositiveNumber(params.get('patient_id') ?? params.get('patientId'));
      const shouldOpenCreate = params.get('mode') === 'create';
      const scopeChanged =
        nextSpecialtyKey !== this.activeSpecialtyKey ||
        nextPatientId !== this.filterPatientId;
      this.activeSpecialtyKey = nextSpecialtyKey;
      this.filterPatientId = nextPatientId;

      if (scopeChanged || this.budgets.length === 0) {
        this.loadBudgets();
      }
      if (shouldOpenCreate && !this.showForm) {
        this.openCreateForm();
      }
    });
  }

  applyFilters(rawPatientId: string, rawStatus: string): void {
    const patientId = Number(rawPatientId);
    this.filterPatientId = Number.isInteger(patientId) && patientId > 0 ? patientId : undefined;
    this.filterStatus = this.normalizeStatus(rawStatus);
    this.loadBudgets();
  }

  openPatientWorkspace(route: ClinicalWorkspaceRoute): void {
    if (!this.filterPatientId) {
      return;
    }
    this.router.navigate([`/${route}`], {
      queryParams: buildClinicalScopeQueryParams({
        patientId: this.filterPatientId,
        specialtyKey: this.activeSpecialtyKey
      })
    });
  }

  clearPatientScope(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { patient_id: null, patientId: null, mode: null },
      queryParamsHandling: 'merge'
    });
  }

  loadBudgets(): void {
    this.loading = true;
    this.errorMessage = null;

    const filters: { patient_id?: number; status?: BudgetStatus; specialty_key?: string } = {};
    if (this.filterPatientId) {
      filters.patient_id = this.filterPatientId;
    }
    if (this.filterStatus) {
      filters.status = this.filterStatus;
    }
    if (this.activeSpecialtyKey) {
      filters.specialty_key = this.activeSpecialtyKey;
    }

    this.budgetService
      .getBudgets(Object.keys(filters).length ? filters : undefined)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (budgets) => {
          this.budgets = [...budgets].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  canSendBudget(budget: Budget): boolean {
    return budget.status === 'draft';
  }

  openCreateForm(): void {
    this.formMode = 'create';
    this.editingBudgetId = null;
    this.showForm = true;
    this.successMessage = null;
    this.fieldError = null;
    this.budgetForm.reset({
      patient_id: this.filterPatientId ?? 1,
      title: '',
      description: '',
      total_amount: 0,
      currency: 'PYG',
      valid_until: ''
    });
  }

  startEdit(budget: Budget): void {
    this.formMode = 'edit';
    this.editingBudgetId = budget.id;
    this.showForm = true;
    this.successMessage = null;
    this.fieldError = null;
    this.budgetForm.patchValue({
      patient_id: budget.patient_id,
      title: budget.title,
      description: budget.description || '',
      total_amount: budget.total_amount,
      currency: budget.currency || 'PYG',
      valid_until: this.toDateInputValue(budget.valid_until)
    });
  }

  closeForm(): void {
    this.showForm = false;
    this.fieldError = null;
  }

  submitForm(): void {
    if (this.budgetForm.invalid) {
      this.budgetForm.markAllAsTouched();
      this.fieldError = 'Completa los campos requeridos para guardar el presupuesto.';
      return;
    }

    this.fieldError = null;
    this.errorMessage = null;
    this.successMessage = null;
    this.submitting = true;

    const payload = this.buildPayloadFromForm();
    if (this.formMode === 'create') {
      this.createBudget(payload);
      return;
    }
    this.updateBudget(payload);
  }

  async deleteBudget(budget: Budget): Promise<void> {
    const confirmed = await this.dialog.confirm({
      title: 'Eliminar presupuesto',
      message: `Eliminar presupuesto #${budget.id}? Esta accion no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      destructive: true
    });
    if (!confirmed) {
      return;
    }

    this.deletingIds.add(budget.id);
    this.errorMessage = null;
    this.successMessage = null;

    this.budgetService.deleteBudget(budget.id, this.activeSpecialtyKey).subscribe({
      next: () => {
        this.budgets = this.budgets.filter((item) => item.id !== budget.id);
        this.deletingIds.delete(budget.id);
        if (this.editingBudgetId === budget.id) {
          this.closeForm();
          this.editingBudgetId = null;
        }
        this.successMessage = `Presupuesto #${budget.id} eliminado.`;
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error);
        this.deletingIds.delete(budget.id);
      }
    });
  }

  sendBudget(budgetId: number): void {
    this.sendingIds.add(budgetId);
    this.errorMessage = null;
    this.successMessage = null;

    this.budgetService.sendBudget(budgetId, this.activeSpecialtyKey).subscribe({
      next: (updatedBudget) => {
        this.budgets = this.budgets.map((budget) =>
          budget.id === budgetId ? { ...budget, ...updatedBudget } : budget
        );
        this.sendingIds.delete(budgetId);
        this.successMessage = `Presupuesto #${budgetId} enviado al paciente.`;
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error);
        this.sendingIds.delete(budgetId);
      }
    });
  }

  private createBudget(payload: Partial<Budget>): void {
    this.budgetService.createBudget(payload, this.activeSpecialtyKey).subscribe({
      next: (budget) => {
        this.budgets = [budget, ...this.budgets];
        this.submitting = false;
        this.closeForm();
        this.successMessage = `Presupuesto #${budget.id} creado correctamente.`;
      },
      error: (error: unknown) => {
        this.submitting = false;
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  private updateBudget(payload: Partial<Budget>): void {
    if (!this.editingBudgetId) {
      this.submitting = false;
      this.fieldError = 'No se pudo identificar el presupuesto a editar.';
      return;
    }

    this.budgetService.updateBudget(this.editingBudgetId, payload, this.activeSpecialtyKey).subscribe({
      next: (updatedBudget) => {
        this.budgets = this.budgets.map((budget) =>
          budget.id === updatedBudget.id ? { ...budget, ...updatedBudget } : budget
        );
        this.submitting = false;
        this.closeForm();
        this.successMessage = `Presupuesto #${updatedBudget.id} actualizado.`;
      },
      error: (error: unknown) => {
        this.submitting = false;
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  private buildPayloadFromForm(): Partial<Budget> {
    const rawValue = this.budgetForm.getRawValue();
    const payload: Partial<Budget> = {
      patient_id: rawValue.patient_id,
      title: rawValue.title.trim(),
      total_amount: Number(rawValue.total_amount),
      currency: rawValue.currency.trim().toUpperCase()
    };

    const description = rawValue.description.trim();
    if (description) {
      payload.description = description;
    }

    const validUntil = this.normalizeDateValue(rawValue.valid_until);
    if (validUntil) {
      payload.valid_until = validUntil;
    } else {
      payload.valid_until = undefined;
    }

    return payload;
  }

  private normalizeStatus(rawStatus: string): BudgetStatus | undefined {
    const candidate = rawStatus.trim() as BudgetStatus;
    const allowed: BudgetStatus[] = ['draft', 'sent', 'accepted', 'rejected', 'expired'];
    if (!candidate || !allowed.includes(candidate)) {
      return undefined;
    }
    return candidate;
  }

  private normalizeSpecialtyKey(rawKey: string | null): string | undefined {
    if (!rawKey) {
      return undefined;
    }
    const normalized = rawKey.trim().toLowerCase();
    return /^[a-z0-9-]+$/.test(normalized) ? normalized : undefined;
  }

  private resolveSessionSpecialtyKey(): string | undefined {
    if (this.currentUser?.role !== 'professional') {
      return undefined;
    }
    return this.specialtyAccess.resolveSpecialtyModule(this.currentUser.specialty)?.key;
  }

  private normalizePositiveNumber(rawValue: string | null): number | undefined {
    const parsed = Number(rawValue);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
  }

  private normalizeDateValue(rawDate: string): string | undefined {
    const trimmed = rawDate.trim();
    if (!trimmed) {
      return undefined;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      return undefined;
    }
    return parsed.toISOString().slice(0, 10);
  }

  private toDateInputValue(rawDate: string | undefined): string {
    if (!rawDate) {
      return '';
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
      return rawDate;
    }
    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) {
      return '';
    }
    return parsed.toISOString().slice(0, 10);
  }

  private resolveErrorMessage(error: unknown): string {
    if (this.isApiErrorShape(error)) {
      const msg = error.error?.message ?? error.error?.msg ?? error.error?.error;
      if (typeof msg === 'string' && msg.trim().length > 0) {
        return msg;
      }
    }
    return 'No se pudieron cargar o actualizar los presupuestos.';
  }

  private isApiErrorShape(value: unknown): value is ApiErrorShape {
    return typeof value === 'object' && value !== null && 'error' in value;
  }
}
