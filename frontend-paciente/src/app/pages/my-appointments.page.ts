import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import {
  CreatePatientAppointmentPayload,
  PatientApiService,
  PatientAppointment,
  ProfessionalDirectoryItem
} from '../core/services/patient-api.service';
import { pageShellStyles } from './page-shell.styles';

type ApiErrorShape = {
  error?: {
    msg?: string;
    message?: string;
    error?: string;
  };
};

@Component({
  selector: 'app-my-appointments-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  template: `
    <ion-header translucent="true">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Mis turnos</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="page-content">
      <section class="panel">
        <h2 class="panel-title">Agenda personal</h2>
        <p class="panel-text">Consulta tu historial de turnos y próximos encuentros.</p>
        <ion-segment [(ngModel)]="selectedFilter" (ionChange)="applyFilter()" class="filter-segment">
          <ion-segment-button value="all">Todos</ion-segment-button>
          <ion-segment-button value="upcoming">Proximos</ion-segment-button>
          <ion-segment-button value="completed">Completados</ion-segment-button>
          <ion-segment-button value="cancelled">Cancelados</ion-segment-button>
        </ion-segment>
      </section>

      <section class="panel">
        <h3 class="panel-title">Solicitar nuevo turno</h3>
        <p class="panel-text">Selecciona profesional y fecha para registrar tu solicitud.</p>

        <ion-item>
          <ion-label position="stacked">Profesional</ion-label>
          <ion-select
            interface="popover"
            placeholder="Selecciona un profesional"
            [(ngModel)]="bookingProfessionalId"
            [disabled]="professionalLoading || booking"
          >
            @for (professional of professionals; track professional.id) {
              <ion-select-option [value]="professional.id">
                {{ professional.first_name }} {{ professional.last_name }}
                @if (professional.specialty) { - {{ professional.specialty }} }
              </ion-select-option>
            }
          </ion-select>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Fecha y hora</ion-label>
          <ion-input
            type="datetime-local"
            [(ngModel)]="bookingDate"
            [disabled]="booking"
          ></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Tipo de cita</ion-label>
          <ion-input
            maxlength="80"
            [(ngModel)]="bookingType"
            [disabled]="booking"
          ></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Motivo</ion-label>
          <ion-input
            maxlength="180"
            [(ngModel)]="bookingReason"
            [disabled]="booking"
          ></ion-input>
        </ion-item>

        <div class="item-actions">
          <ion-button size="small" (click)="createAppointment()" [disabled]="!canCreateAppointment() || booking">
            @if (booking) { Solicitando... } @else { Solicitar turno }
          </ion-button>
        </div>

        @if (professionalLoading) {
          <p class="panel-text">Cargando profesionales...</p>
        } @else if (professionals.length === 0) {
          <p class="panel-text">No hay profesionales disponibles para agendar.</p>
        }
      </section>

      <ion-refresher slot="fixed" (ionRefresh)="refresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      @if (errorMessage) {
        <div class="error-box" role="alert">{{ errorMessage }}</div>
      }

      @if (successMessage) {
        <div class="success-box" role="status">{{ successMessage }}</div>
      }

      @if (!loading && appointments.length === 0 && !errorMessage) {
        <section class="panel">
          <h3 class="panel-title">Sin turnos registrados</h3>
          <p class="panel-text">Todavia no hay turnos en tu agenda.</p>
        </section>
      }

      @if (!loading && appointments.length > 0 && filteredAppointments.length === 0 && !errorMessage) {
        <section class="panel">
          <h3 class="panel-title">Sin resultados</h3>
          <p class="panel-text">No hay turnos para el filtro seleccionado.</p>
        </section>
      }

      @if (filteredAppointments.length > 0) {
        <ion-list inset="true">
          @for (appointment of filteredAppointments; track appointment.id) {
            <ion-item>
              <ion-label>
                <h2>{{ appointment.appointment_date | date:'medium' }}</h2>
                <p>
                  {{ appointment.appointment_type || 'Consulta general' }}
                  <br />
                  Profesional: {{ appointment.professional?.first_name }} {{ appointment.professional?.last_name }}
                </p>
                <div class="item-actions">
                  <span class="status-chip" [class]="'status-' + appointment.status">{{ appointment.status }}</span>
                  @if (canCancel(appointment)) {
                    <ion-button
                      size="small"
                      fill="outline"
                      color="danger"
                      (click)="cancelAppointment(appointment)"
                      [disabled]="cancellingIds.has(appointment.id)"
                    >
                      @if (cancellingIds.has(appointment.id)) { Cancelando... } @else { Cancelar }
                    </ion-button>
                  }
                </div>
              </ion-label>
            </ion-item>
          }
        </ion-list>
      }
    </ion-content>
  `,
  styles: [
    pageShellStyles,
    `
      .filter-segment {
        margin-top: 10px;
      }

      .item-actions {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 8px;
      }

      .success-box {
        background: #ecfdf5;
        border: 1px solid #86efac;
        border-radius: 10px;
        color: #166534;
        font-size: 0.82rem;
        margin: 12px;
        padding: 10px;
      }

      .status-pending {
        background: #fef3c7;
        color: #92400e;
      }
    `
  ]
})
export class MyAppointmentsPage implements OnInit {
  private readonly patientApi = inject(PatientApiService);

  appointments: PatientAppointment[] = [];
  filteredAppointments: PatientAppointment[] = [];
  professionals: ProfessionalDirectoryItem[] = [];
  loading = false;
  professionalLoading = false;
  booking = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  selectedFilter: 'all' | 'upcoming' | 'completed' | 'cancelled' = 'all';
  cancellingIds = new Set<number>();
  bookingProfessionalId: number | null = null;
  bookingDate = '';
  bookingType = 'Consulta general';
  bookingReason = '';

  ngOnInit(): void {
    this.loadAppointments();
    this.loadProfessionals();
  }

  refresh(event: CustomEvent): void {
    this.loadAppointments(() => event.detail.complete());
  }

  private loadAppointments(onComplete?: () => void): void {
    this.loading = true;
    this.errorMessage = null;

    this.patientApi.getMyAppointments().subscribe({
      next: (appointments) => {
        this.appointments = this.sortAppointments(appointments);
        this.applyFilter();
        this.loading = false;
        onComplete?.();
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error);
        this.loading = false;
        onComplete?.();
      }
    });
  }

  private loadProfessionals(): void {
    this.professionalLoading = true;

    this.patientApi.listProfessionals().subscribe({
      next: (professionals) => {
        this.professionals = [...professionals].sort((a, b) =>
          `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
        );
        this.professionalLoading = false;
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error);
        this.professionalLoading = false;
      }
    });
  }

  canCreateAppointment(): boolean {
    return Boolean(this.bookingProfessionalId) && Boolean(this.bookingDate);
  }

  createAppointment(): void {
    if (!this.bookingProfessionalId || !this.bookingDate) {
      return;
    }

    const payload: CreatePatientAppointmentPayload = {
      professional_id: this.bookingProfessionalId,
      appointment_date: this.bookingDate,
      appointment_type: this.bookingType.trim() || null,
      reason: this.bookingReason.trim() || null
    };

    this.errorMessage = null;
    this.successMessage = null;
    this.booking = true;

    this.patientApi.createMyAppointment(payload).subscribe({
      next: (appointment) => {
        this.appointments = this.sortAppointments([appointment, ...this.appointments]);
        this.selectedFilter = 'upcoming';
        this.applyFilter();
        this.successMessage = `Turno #${appointment.id} solicitado correctamente.`;
        this.bookingReason = '';
        this.booking = false;
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error);
        this.booking = false;
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

    return 'No se pudieron cargar tus turnos.';
  }

  applyFilter(): void {
    const now = new Date().getTime();

    if (this.selectedFilter === 'all') {
      this.filteredAppointments = [...this.appointments];
      return;
    }

    if (this.selectedFilter === 'upcoming') {
      this.filteredAppointments = this.appointments.filter((appointment) => {
        const status = appointment.status;
        const appointmentTime = new Date(appointment.appointment_date).getTime();
        return ['pending', 'scheduled', 'confirmed'].includes(status) && appointmentTime >= now;
      });
      return;
    }

    if (this.selectedFilter === 'completed') {
      this.filteredAppointments = this.appointments.filter(
        (appointment) => appointment.status === 'completed'
      );
      return;
    }

    this.filteredAppointments = this.appointments.filter(
      (appointment) => appointment.status === 'cancelled' || appointment.status === 'no_show'
    );
  }

  canCancel(appointment: PatientAppointment): boolean {
    return ['pending', 'scheduled', 'confirmed'].includes(appointment.status);
  }

  cancelAppointment(appointment: PatientAppointment): void {
    const reason = window.prompt(
      `Motivo de cancelacion para el turno #${appointment.id} (opcional):`,
      ''
    );
    if (reason === null) {
      return;
    }

    this.errorMessage = null;
    this.successMessage = null;
    this.cancellingIds.add(appointment.id);
    this.patientApi.cancelMyAppointment(appointment.id, reason.trim() || undefined).subscribe({
      next: () => {
        this.appointments = this.appointments.map((item) =>
          item.id === appointment.id ? { ...item, status: 'cancelled' } : item
        );
        this.applyFilter();
        this.successMessage = `Turno #${appointment.id} cancelado.`;
        this.cancellingIds.delete(appointment.id);
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error);
        this.cancellingIds.delete(appointment.id);
      }
    });
  }

  private isApiErrorShape(value: unknown): value is ApiErrorShape {
    return typeof value === 'object' && value !== null && 'error' in value;
  }

  private sortAppointments(appointments: PatientAppointment[]): PatientAppointment[] {
    return [...appointments].sort(
      (a, b) =>
        new Date(b.appointment_date).getTime() -
        new Date(a.appointment_date).getTime()
    );
  }
}
