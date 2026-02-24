import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import {
  PatientApiService,
  PatientAppointment
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
  imports: [CommonModule, IonicModule],
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
      </section>

      <ion-refresher slot="fixed" (ionRefresh)="refresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      @if (errorMessage) {
        <div class="error-box" role="alert">{{ errorMessage }}</div>
      }

      @if (!loading && appointments.length === 0 && !errorMessage) {
        <section class="panel">
          <h3 class="panel-title">Sin turnos registrados</h3>
          <p class="panel-text">Todavia no hay turnos en tu agenda.</p>
        </section>
      }

      @if (appointments.length > 0) {
        <ion-list inset="true">
          @for (appointment of appointments; track appointment.id) {
            <ion-item>
              <ion-label>
                <h2>{{ appointment.appointment_date | date:'medium' }}</h2>
                <p>
                  {{ appointment.appointment_type || 'Consulta general' }}
                  <br />
                  Profesional: {{ appointment.professional?.first_name }} {{ appointment.professional?.last_name }}
                </p>
              </ion-label>
              <span class="status-chip" [class]="'status-' + appointment.status">{{ appointment.status }}</span>
            </ion-item>
          }
        </ion-list>
      }
    </ion-content>
  `,
  styles: [pageShellStyles]
})
export class MyAppointmentsPage implements OnInit {
  private readonly patientApi = inject(PatientApiService);

  appointments: PatientAppointment[] = [];
  loading = false;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.loadAppointments();
  }

  refresh(event: CustomEvent): void {
    this.loadAppointments(() => event.detail.complete());
  }

  private loadAppointments(onComplete?: () => void): void {
    this.loading = true;
    this.errorMessage = null;

    this.patientApi.getMyAppointments().subscribe({
      next: (appointments) => {
        this.appointments = [...appointments].sort(
          (a, b) =>
            new Date(b.appointment_date).getTime() -
            new Date(a.appointment_date).getTime()
        );
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

  private resolveErrorMessage(error: unknown): string {
    if (this.isApiErrorShape(error)) {
      const message = error.error?.msg ?? error.error?.message ?? error.error?.error;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }

    return 'No se pudieron cargar tus turnos.';
  }

  private isApiErrorShape(value: unknown): value is ApiErrorShape {
    return typeof value === 'object' && value !== null && 'error' in value;
  }
}
