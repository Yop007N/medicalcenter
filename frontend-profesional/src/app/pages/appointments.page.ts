import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../core/auth/auth.service';
import { AppointmentService } from '../core/services/appointment.service';
import { Appointment } from '../shared/models/appointment.model';
import { pageShellStyles } from './page-shell.styles';

type ApiErrorShape = {
  error?: {
    message?: string;
    msg?: string;
    error?: string;
  };
};

type AppointmentFormMode = 'create' | 'edit';
type AppointmentStatus = Appointment['status'];

@Component({
  selector: 'app-appointments-page',
  standalone: true,
  imports: [CommonModule, DatePipe, ReactiveFormsModule],
  template: `
    <section class="page">
      <h1>Citas</h1>
      <p>Programacion, confirmacion y control operativo de agenda clinica.</p>

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
          <option value="scheduled">scheduled</option>
          <option value="confirmed">confirmed</option>
          <option value="completed">completed</option>
          <option value="cancelled">cancelled</option>
          <option value="no_show">no_show</option>
        </select>
        <button type="button" class="toolbar-button" (click)="applyFilters(patientInput.value, statusInput.value)" [disabled]="loading">
          Filtrar
        </button>
        <button type="button" class="toolbar-button" (click)="openCreateForm()" [disabled]="submitting">
          Nueva cita
        </button>
        <button type="button" class="toolbar-button" (click)="loadAppointments()" [disabled]="loading">
          @if (loading) { Cargando... } @else { Actualizar }
        </button>
      </div>

      @if (errorMessage) {
        <div class="error-box" role="alert">{{ errorMessage }}</div>
      }

      @if (successMessage) {
        <div class="success-box" role="status">{{ successMessage }}</div>
      }

      @if (showForm) {
        <article class="card form-card">
          <h2 class="card-title">
            @if (formMode === 'create') { Crear cita } @else { Editar cita #{{ editingAppointmentId }} }
          </h2>

          <form [formGroup]="appointmentForm" (ngSubmit)="submitForm()" class="form-grid" novalidate>
            <label>
              Patient ID
              <input type="number" min="1" formControlName="patient_id" />
            </label>

            <label>
              Professional ID
              <input type="number" min="1" formControlName="professional_id" [readonly]="isProfessionalSession" />
            </label>

            <label>
              Fecha y hora
              <input type="datetime-local" formControlName="appointment_date" />
            </label>

            <label>
              Duracion (min)
              <input type="number" min="5" step="5" formControlName="duration_minutes" />
            </label>

            <label>
              Tipo
              <input type="text" formControlName="appointment_type" />
            </label>

            @if (formMode === 'edit') {
              <label>
                Estado
                <select formControlName="status">
                  <option value="scheduled">scheduled</option>
                  <option value="confirmed">confirmed</option>
                  <option value="completed">completed</option>
                  <option value="cancelled">cancelled</option>
                  <option value="no_show">no_show</option>
                </select>
              </label>
            }

            <label class="full-row">
              Motivo
              <textarea rows="2" formControlName="reason"></textarea>
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
                @if (submitting) { Guardando... } @else if (formMode === 'create') { Crear } @else { Guardar }
              </button>
              <button class="secondary-button" type="button" (click)="closeForm()" [disabled]="submitting">
                Cancelar
              </button>
            </div>
          </form>
        </article>
      }

      @if (!loading && appointments.length === 0 && !errorMessage) {
        <article class="card empty">
          <h2 class="card-title">Sin citas registradas</h2>
          <p class="card-text">Todavia no hay citas para mostrar.</p>
        </article>
      }

      @if (appointments.length > 0) {
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Paciente</th>
                <th>Profesional</th>
                <th>Tipo</th>
                <th>Duracion</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (appointment of appointments; track appointment.id) {
                <tr>
                  <td>#{{ appointment.id }}</td>
                  <td>{{ appointment.appointment_date | date:'short' }}</td>
                  <td>{{ appointment.patient_id }}</td>
                  <td>{{ appointment.professional_id }}</td>
                  <td>{{ appointment.appointment_type || 'consultation' }}</td>
                  <td>{{ appointment.duration_minutes }} min</td>
                  <td>
                    <span class="badge" [class]="'status-' + appointment.status">{{ appointment.status }}</span>
                  </td>
                  <td>
                    <div class="row-actions">
                      @if (canConfirm(appointment)) {
                        <button
                          type="button"
                          class="table-action"
                          (click)="confirmAppointment(appointment.id)"
                          [disabled]="confirmingIds.has(appointment.id)"
                        >
                          @if (confirmingIds.has(appointment.id)) { Confirmando... } @else { Confirmar }
                        </button>
                      }

                      @if (canCancel(appointment)) {
                        <button
                          type="button"
                          class="table-action secondary"
                          (click)="cancelAppointment(appointment.id)"
                          [disabled]="cancelingIds.has(appointment.id)"
                        >
                          @if (cancelingIds.has(appointment.id)) { Cancelando... } @else { Cancelar }
                        </button>
                      }

                      <button
                        type="button"
                        class="table-action"
                        (click)="startEdit(appointment)"
                        [disabled]="submitting || cancelingIds.has(appointment.id)"
                      >
                        Editar
                      </button>

                      @if (!canConfirm(appointment) && !canCancel(appointment)) {
                        <span class="muted">Sin acciones</span>
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
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
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
        min-width: 980px;
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

      .status-scheduled {
        background: var(--ms-primary-soft-bg);
        color: var(--ms-primary);
      }

      .status-confirmed {
        background: var(--ms-success-soft-bg);
        color: var(--ms-success);
      }

      .status-completed {
        background: var(--ms-primary-soft-bg);
        color: var(--ms-primary);
      }

      .status-cancelled,
      .status-no_show {
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

      .table-action.secondary {
        border-color: var(--ms-border);
        color: var(--ms-text-muted);
      }

      .table-action:disabled {
        cursor: not-allowed;
        opacity: 0.5;
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

      .muted {
        color: var(--ms-text-muted);
      }

      .empty {
        margin-top: 0.75rem;
      }
    `
  ]
})
export class AppointmentsPage implements OnInit {
  private readonly appointmentService = inject(AppointmentService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(NonNullableFormBuilder);

  appointments: Appointment[] = [];
  loading = false;
  submitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  fieldError: string | null = null;
  showForm = false;
  formMode: AppointmentFormMode = 'create';
  editingAppointmentId: number | null = null;
  filterPatientId: number | undefined;
  filterStatus: AppointmentStatus | undefined;
  confirmingIds = new Set<number>();
  cancelingIds = new Set<number>();

  readonly currentUser = this.authService.currentUserValue;
  readonly isProfessionalSession = this.currentUser?.role === 'professional';

  readonly appointmentForm = this.fb.group({
    patient_id: [1, [Validators.required, Validators.min(1)]],
    professional_id: [1, [Validators.required, Validators.min(1)]],
    appointment_date: ['', [Validators.required]],
    duration_minutes: [30, [Validators.required, Validators.min(5)]],
    appointment_type: ['consultation'],
    reason: [''],
    notes: [''],
    status: ['scheduled' as AppointmentStatus, [Validators.required]]
  });

  ngOnInit(): void {
    const sessionUserId = this.currentUser?.id;
    if (sessionUserId && Number.isInteger(sessionUserId)) {
      this.appointmentForm.patchValue({ professional_id: sessionUserId });
    }
    this.loadAppointments();
  }

  applyFilters(rawPatientId: string, rawStatus: string): void {
    const patientId = Number(rawPatientId);
    this.filterPatientId = Number.isInteger(patientId) && patientId > 0 ? patientId : undefined;
    this.filterStatus = this.normalizeStatus(rawStatus);
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.loading = true;
    this.errorMessage = null;

    const filters: { patient_id?: number; status?: AppointmentStatus } = {};
    if (this.filterPatientId) {
      filters.patient_id = this.filterPatientId;
    }
    if (this.filterStatus) {
      filters.status = this.filterStatus;
    }

    this.appointmentService
      .getAppointments(Object.keys(filters).length ? filters : undefined)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (appointments) => {
          this.appointments = [...appointments].sort(
            (a, b) =>
              new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()
          );
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  openCreateForm(): void {
    this.formMode = 'create';
    this.editingAppointmentId = null;
    this.showForm = true;
    this.fieldError = null;
    this.successMessage = null;

    this.appointmentForm.reset({
      patient_id: this.filterPatientId ?? 1,
      professional_id: this.currentUser?.id ?? 1,
      appointment_date: '',
      duration_minutes: 30,
      appointment_type: 'consultation',
      reason: '',
      notes: '',
      status: 'scheduled'
    });
  }

  startEdit(appointment: Appointment): void {
    this.formMode = 'edit';
    this.editingAppointmentId = appointment.id;
    this.showForm = true;
    this.fieldError = null;
    this.successMessage = null;

    this.appointmentForm.patchValue({
      patient_id: appointment.patient_id,
      professional_id: appointment.professional_id,
      appointment_date: this.toDateTimeInputValue(appointment.appointment_date),
      duration_minutes: appointment.duration_minutes,
      appointment_type: appointment.appointment_type || 'consultation',
      reason: appointment.reason || '',
      notes: appointment.notes || '',
      status: appointment.status
    });
  }

  closeForm(): void {
    this.showForm = false;
    this.fieldError = null;
  }

  submitForm(): void {
    if (this.appointmentForm.invalid) {
      this.appointmentForm.markAllAsTouched();
      this.fieldError = 'Completa los campos requeridos para guardar la cita.';
      return;
    }

    this.fieldError = null;
    this.errorMessage = null;
    this.successMessage = null;
    this.submitting = true;

    const payload = this.buildPayloadFromForm();
    if (this.formMode === 'create') {
      this.createAppointment(payload);
      return;
    }
    this.updateAppointment(payload);
  }

  canConfirm(appointment: Appointment): boolean {
    return appointment.status === 'scheduled';
  }

  canCancel(appointment: Appointment): boolean {
    return appointment.status === 'scheduled' || appointment.status === 'confirmed';
  }

  confirmAppointment(appointmentId: number): void {
    this.confirmingIds.add(appointmentId);
    this.errorMessage = null;
    this.successMessage = null;

    this.appointmentService.confirmAppointment(appointmentId).subscribe({
      next: (updatedAppointment) => {
        this.appointments = this.appointments.map((appointment) =>
          appointment.id === appointmentId ? { ...appointment, ...updatedAppointment } : appointment
        );
        this.confirmingIds.delete(appointmentId);
        this.successMessage = `Cita #${appointmentId} confirmada.`;
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error);
        this.confirmingIds.delete(appointmentId);
      }
    });
  }

  cancelAppointment(appointmentId: number): void {
    this.cancelingIds.add(appointmentId);
    this.errorMessage = null;
    this.successMessage = null;

    this.appointmentService.cancelAppointment(appointmentId).subscribe({
      next: () => {
        this.appointments = this.appointments.map((appointment) =>
          appointment.id === appointmentId ? { ...appointment, status: 'cancelled' } : appointment
        );
        this.cancelingIds.delete(appointmentId);
        this.successMessage = `Cita #${appointmentId} cancelada.`;
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error);
        this.cancelingIds.delete(appointmentId);
      }
    });
  }

  private createAppointment(payload: Partial<Appointment>): void {
    this.appointmentService.createAppointment(payload).subscribe({
      next: (appointment) => {
        this.appointments = [appointment, ...this.appointments].sort(
          (a, b) =>
            new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()
        );
        this.submitting = false;
        this.closeForm();
        this.successMessage = `Cita #${appointment.id} creada correctamente.`;
      },
      error: (error: unknown) => {
        this.submitting = false;
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  private updateAppointment(payload: Partial<Appointment>): void {
    if (!this.editingAppointmentId) {
      this.submitting = false;
      this.fieldError = 'No se pudo identificar la cita a editar.';
      return;
    }

    this.appointmentService.updateAppointment(this.editingAppointmentId, payload).subscribe({
      next: (updatedAppointment) => {
        this.appointments = this.appointments.map((appointment) =>
          appointment.id === updatedAppointment.id ? { ...appointment, ...updatedAppointment } : appointment
        );
        this.submitting = false;
        this.closeForm();
        this.successMessage = `Cita #${updatedAppointment.id} actualizada.`;
      },
      error: (error: unknown) => {
        this.submitting = false;
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  private buildPayloadFromForm(): Partial<Appointment> {
    const rawValue = this.appointmentForm.getRawValue();
    const payload: Partial<Appointment> = {
      patient_id: rawValue.patient_id,
      professional_id: rawValue.professional_id,
      appointment_date: this.normalizeDateTimeValue(rawValue.appointment_date),
      duration_minutes: Number(rawValue.duration_minutes),
      appointment_type: rawValue.appointment_type.trim(),
      reason: rawValue.reason.trim(),
      notes: rawValue.notes.trim()
    };

    if (this.formMode === 'edit') {
      payload.status = rawValue.status;
    }

    return payload;
  }

  private normalizeStatus(rawStatus: string): AppointmentStatus | undefined {
    const candidate = rawStatus.trim() as AppointmentStatus;
    const allowed: AppointmentStatus[] = [
      'scheduled',
      'confirmed',
      'completed',
      'cancelled',
      'no_show'
    ];
    if (!candidate || !allowed.includes(candidate)) {
      return undefined;
    }
    return candidate;
  }

  private normalizeDateTimeValue(rawDate: string): string {
    const trimmed = rawDate.trim();
    if (!trimmed) {
      return '';
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(trimmed)) {
      return trimmed;
    }
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      return trimmed;
    }
    const timezoneAdjusted = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
    return timezoneAdjusted.toISOString().slice(0, 16);
  }

  private toDateTimeInputValue(rawDate: string | undefined): string {
    if (!rawDate) {
      return '';
    }
    const match = rawDate.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
    if (match) {
      return match[1];
    }
    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) {
      return '';
    }
    const timezoneAdjusted = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
    return timezoneAdjusted.toISOString().slice(0, 16);
  }

  private resolveErrorMessage(error: unknown): string {
    if (this.isApiErrorShape(error)) {
      const msg = error.error?.message ?? error.error?.msg ?? error.error?.error;
      if (typeof msg === 'string' && msg.trim().length > 0) {
        return msg;
      }
    }
    return 'No se pudieron cargar o actualizar las citas.';
  }

  private isApiErrorShape(value: unknown): value is ApiErrorShape {
    return typeof value === 'object' && value !== null && 'error' in value;
  }
}
