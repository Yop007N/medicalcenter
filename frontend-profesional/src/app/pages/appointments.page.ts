import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
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

@Component({
  selector: 'app-appointments-page',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <section class="page">
      <h1>Citas</h1>
      <p>Programacion, confirmacion y control de estados de agenda.</p>

      <div class="toolbar">
        <button type="button" class="refresh-button" (click)="loadAppointments()" [disabled]="loading">
          @if (loading) { Cargando... } @else { Actualizar }
        </button>
      </div>

      @if (errorMessage) {
        <div class="error-box" role="alert">{{ errorMessage }}</div>
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
                  <td>{{ appointment.appointment_type || 'consultation' }}</td>
                  <td>{{ appointment.duration_minutes }} min</td>
                  <td>
                    <span class="badge" [class]="'status-' + appointment.status">{{ appointment.status }}</span>
                  </td>
                  <td>
                    <div class="actions">
                      @if (canConfirm(appointment)) {
                        <button
                          type="button"
                          class="action-button"
                          (click)="confirmAppointment(appointment.id)"
                          [disabled]="confirmingIds.has(appointment.id)"
                        >
                          @if (confirmingIds.has(appointment.id)) { Confirmando... } @else { Confirmar }
                        </button>
                      }

                      @if (canCancel(appointment)) {
                        <button
                          type="button"
                          class="action-button action-secondary"
                          (click)="cancelAppointment(appointment.id)"
                          [disabled]="cancelingIds.has(appointment.id)"
                        >
                          @if (cancelingIds.has(appointment.id)) { Cancelando... } @else { Cancelar }
                        </button>
                      }

                      @if (!canConfirm(appointment) && !canCancel(appointment)) {
                        <span class="muted">-</span>
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
        min-width: 860px;
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

      .status-scheduled {
        background: #eff8ff;
        color: #175cd3;
      }

      .status-confirmed {
        background: #ecfdf3;
        color: #067647;
      }

      .status-completed {
        background: #f0f9ff;
        color: #0c4a6e;
      }

      .status-cancelled,
      .status-no_show {
        background: #fef3f2;
        color: #b42318;
      }

      .actions {
        display: flex;
        gap: 0.35rem;
      }

      .action-button {
        background: #1d4ed8;
        border: 0;
        border-radius: 8px;
        color: #ffffff;
        cursor: pointer;
        font-size: 0.75rem;
        font-weight: 600;
        padding: 0.3rem 0.55rem;
      }

      .action-secondary {
        background: #475467;
      }

      .action-button:disabled {
        cursor: not-allowed;
        opacity: 0.65;
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

      .muted {
        color: #98a2b3;
      }

      .empty {
        margin-top: 0.75rem;
      }
    `
  ]
})
export class AppointmentsPage implements OnInit {
  private readonly appointmentService = inject(AppointmentService);

  appointments: Appointment[] = [];
  loading = false;
  errorMessage: string | null = null;
  confirmingIds = new Set<number>();
  cancelingIds = new Set<number>();

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.loading = true;
    this.errorMessage = null;

    this.appointmentService
      .getAppointments()
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

  canConfirm(appointment: Appointment): boolean {
    return appointment.status === 'scheduled';
  }

  canCancel(appointment: Appointment): boolean {
    return appointment.status === 'scheduled' || appointment.status === 'confirmed';
  }

  confirmAppointment(appointmentId: number): void {
    this.confirmingIds.add(appointmentId);
    this.errorMessage = null;

    this.appointmentService.confirmAppointment(appointmentId).subscribe({
      next: (updatedAppointment) => {
        this.appointments = this.appointments.map((appointment) =>
          appointment.id === appointmentId ? { ...appointment, ...updatedAppointment } : appointment
        );
        this.confirmingIds.delete(appointmentId);
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

    this.appointmentService.cancelAppointment(appointmentId).subscribe({
      next: () => {
        this.appointments = this.appointments.map((appointment) =>
          appointment.id === appointmentId ? { ...appointment, status: 'cancelled' } : appointment
        );
        this.cancelingIds.delete(appointmentId);
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error);
        this.cancelingIds.delete(appointmentId);
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
    return 'No se pudieron cargar o actualizar las citas.';
  }

  private isApiErrorShape(value: unknown): value is ApiErrorShape {
    return typeof value === 'object' && value !== null && 'error' in value;
  }
}
