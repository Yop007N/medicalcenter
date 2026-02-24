import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../core/services/auth.service';
import {
  PatientApiService,
  PatientAppointment,
  PatientBudget
} from '../core/services/patient-api.service';
import { SyncService, SyncStatus } from '../core/services/sync.service';
import { OfflineService } from '../core/services/offline.service';
import { pageShellStyles } from './page-shell.styles';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink],
  template: `
    <ion-header translucent="true">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Mi panel</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="page-content">
      <section class="panel">
        <h2 class="panel-title">Hola {{ fullName }}</h2>
        <p class="panel-text">Resumen rapido de tu actividad en Medical Services.</p>
      </section>

      @if (errorMessage) {
        <div class="error-box" role="alert">{{ errorMessage }}</div>
      }

      <section class="panel">
        <h3 class="panel-title">Conectividad</h3>
        <p class="panel-text">
          Estado de red:
          @if (isOnline) {
            <strong>Online</strong>
          } @else {
            <strong>Offline</strong>
          }
        </p>
        <p class="panel-text">Sincronizaciones completadas: {{ syncStatus?.completed ?? 0 }}</p>
        <p class="panel-text">Sincronizaciones pendientes: {{ syncStatus?.pending ?? 0 }}</p>
        <ion-button size="small" fill="outline" (click)="triggerSync()" [disabled]="!isOnline">
          Sincronizar ahora
        </ion-button>
      </section>

      <section class="panel">
        <h3 class="panel-title">Proximo turno</h3>
        @if (nextAppointment) {
          <p class="panel-text">
            {{ nextAppointment.appointment_date | date:'fullDate' }}
          </p>
          <p class="panel-text">
            {{ nextAppointment.appointment_type || 'Consulta general' }}
            con {{ nextAppointment.professional?.first_name }} {{ nextAppointment.professional?.last_name }}
          </p>
          <span class="status-chip" [class]="'status-' + nextAppointment.status">
            {{ nextAppointment.status }}
          </span>
        } @else {
          <p class="panel-text">No tienes turnos futuros confirmados.</p>
        }
        <ion-button size="small" fill="clear" routerLink="/my-appointments">Ver mis turnos</ion-button>
      </section>

      <section class="panel">
        <h3 class="panel-title">Presupuestos</h3>
        <p class="panel-text">Pendientes de respuesta: {{ pendingBudgetsCount }}</p>
        <ion-button size="small" fill="clear" routerLink="/my-budgets">Ver presupuestos</ion-button>
      </section>

      <section class="panel">
        <h3 class="panel-title">Historia clinica</h3>
        <p class="panel-text">Consulta timeline, documentos y consentimientos.</p>
        <ion-button size="small" fill="clear" routerLink="/my-history">Ver historia clinica</ion-button>
      </section>
    </ion-content>
  `,
  styles: [pageShellStyles]
})
export class DashboardPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly patientApi = inject(PatientApiService);
  private readonly syncService = inject(SyncService);
  private readonly offlineService = inject(OfflineService);

  fullName = 'Paciente';
  isOnline = true;
  errorMessage: string | null = null;

  syncStatus: SyncStatus | null = null;
  nextAppointment: PatientAppointment | null = null;
  pendingBudgetsCount = 0;

  ngOnInit(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser?.first_name) {
      this.fullName = `${currentUser.first_name} ${currentUser.last_name || ''}`.trim();
    }

    this.isOnline = this.offlineService.isOnline;
    this.offlineService.online$.subscribe((online) => {
      this.isOnline = online;
    });

    this.loadDashboardData();
  }

  triggerSync(): void {
    this.syncService.syncPendingChanges();
    this.syncService
      .getSyncStatus()
      .pipe(catchError(() => of(null)))
      .subscribe((status) => {
        this.syncStatus = status;
      });
  }

  private loadDashboardData(): void {
    this.errorMessage = null;

    forkJoin({
      appointments: this.patientApi.getMyAppointments().pipe(catchError(() => of([] as PatientAppointment[]))),
      budgets: this.patientApi.getMyBudgets().pipe(catchError(() => of([] as PatientBudget[]))),
      syncStatus: this.syncService.getSyncStatus().pipe(catchError(() => of(null)))
    }).subscribe({
      next: ({ appointments, budgets, syncStatus }) => {
        const now = new Date();
        const futureAppointments = appointments
          .filter((appointment) => {
            const date = new Date(appointment.appointment_date);
            return date.getTime() >= now.getTime() && !['cancelled', 'completed'].includes(appointment.status);
          })
          .sort(
            (a, b) =>
              new Date(a.appointment_date).getTime() -
              new Date(b.appointment_date).getTime()
          );

        this.nextAppointment = futureAppointments.length > 0 ? futureAppointments[0] : null;
        this.pendingBudgetsCount = budgets.filter((budget) => ['draft', 'sent'].includes(budget.status)).length;
        this.syncStatus = syncStatus;
      },
      error: () => {
        this.errorMessage = 'No se pudo cargar el resumen del paciente.';
      }
    });
  }
}
