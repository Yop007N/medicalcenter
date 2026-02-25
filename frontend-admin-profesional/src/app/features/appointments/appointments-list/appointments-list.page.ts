import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonLabel,
  IonIcon,
  IonButtons,
  IonMenuButton,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonFab,
  IonFabButton,
  IonCard,
  IonCardContent,
  IonSegment,
  IonSegmentButton,
  IonButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  timeOutline,
  personOutline,
  addOutline,
  todayOutline,
  chevronForwardOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  alertCircleOutline,
  hourglassOutline,
  medkitOutline
} from 'ionicons/icons';
import { AppointmentsApiService } from '../../../core/services';
import { Appointment } from '../../../models';

// Import local data to be safe, though usually done in main.ts
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es-AR';

registerLocaleData(localeEs, 'es-AR');

@Component({
  selector: 'app-appointments-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DatePipe,
    RouterModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonLabel,
    IonIcon,
    IonButtons,
    IonMenuButton,
    IonRefresher,
    IonRefresherContent,
    IonSkeletonText,
    IonFab,
    IonFabButton,
    IonCard,
    IonCardContent,
    IonSegment,
    IonSegmentButton,
    IonButton
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button aria-label="Abrir menu principal"></ion-menu-button>
        </ion-buttons>
        <ion-title>Agenda de Citas</ion-title>
        <ion-buttons slot="end">
          <ion-button aria-label="Crear nueva cita" routerLink="/appointments/new">
            <ion-icon slot="icon-only" name="add-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="onRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Header con estadisticas -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <ion-icon name="calendar-outline"></ion-icon>
          </div>
          <div class="header-info">
            <h1>{{ todayCount }}</h1>
            <p>Citas para hoy</p>
          </div>
        </div>
        <div class="stats-row">
          <div class="stat-chip pending">
            <ion-icon name="hourglass-outline"></ion-icon>
            <span>{{ pendingCount }} pendientes</span>
          </div>
          <div class="stat-chip confirmed">
            <ion-icon name="checkmark-circle-outline"></ion-icon>
            <span>{{ confirmedCount }} confirmadas</span>
          </div>
        </div>
      </div>

      <!-- Filtro por estado -->
      <div class="filter-container">
        <ion-segment [(ngModel)]="selectedFilter" (ionChange)="filterAppointments()" mode="ios">
          <ion-segment-button value="all">
            <ion-label>Todas</ion-label>
          </ion-segment-button>
          <ion-segment-button value="pending">
            <ion-label>Pendientes</ion-label>
          </ion-segment-button>
          <ion-segment-button value="confirmed">
            <ion-label>Confirmadas</ion-label>
          </ion-segment-button>
          <ion-segment-button value="completed">
            <ion-label>Completadas</ion-label>
          </ion-segment-button>
        </ion-segment>
      </div>

      @if (loading) {
        <div class="appointments-list">
          @for (i of [1,2,3,4]; track i) {
            <ion-card class="appointment-card skeleton-card">
              <ion-card-content>
                <div class="appointment-skeleton">
                  <ion-skeleton-text [animated]="true" style="width: 120px; height: 16px;"></ion-skeleton-text>
                  <ion-skeleton-text [animated]="true" style="width: 80%; height: 20px; margin-top: 8px;"></ion-skeleton-text>
                  <ion-skeleton-text [animated]="true" style="width: 60%; height: 14px; margin-top: 8px;"></ion-skeleton-text>
                </div>
              </ion-card-content>
            </ion-card>
          }
        </div>
      } @else if (errorMessage) {
        <div class="error-state" role="alert" aria-live="assertive">
          <div class="error-icon">
            <ion-icon name="alert-circle-outline"></ion-icon>
          </div>
          <h3>Error al cargar citas</h3>
          <p>{{ errorMessage }}</p>
          <ion-button fill="outline" (click)="loadAppointments()" shape="round">
            Reintentar
          </ion-button>
        </div>
      } @else {
        @if (filteredAppointments.length === 0) {
          <div class="empty-state">
            <div class="empty-icon">
              <ion-icon name="calendar-outline"></ion-icon>
            </div>
            <h3>No hay citas</h3>
            <p>{{ selectedFilter === 'all' ? 'Agenda tu primera cita para comenzar' : 'No hay citas con este estado' }}</p>
            @if (selectedFilter === 'all') {
              <ion-button routerLink="/appointments/new" shape="round">
                <ion-icon slot="start" name="add-outline"></ion-icon>
                Nueva Cita
              </ion-button>
            }
          </div>
        } @else {
          <div class="appointments-list">
            @for (appointment of filteredAppointments; track appointment.id) {
              <ion-card class="appointment-card" [routerLink]="['/appointments', appointment.id]">
                <ion-card-content>
                  <div class="appointment-header">
                    <div class="date-badge">
                      <span class="day">{{ appointment.appointment_date | date:'d' }}</span>
                      <span class="month">{{ appointment.appointment_date | date:'MMM':'':'es-AR' }}</span>
                    </div>
                    <div class="time-info">
                      <span class="time">
                        <ion-icon name="time-outline"></ion-icon>
                        {{ appointment.appointment_date | date:'HH:mm' }}
                      </span>
                      <span class="duration">{{ appointment.duration_minutes }} min</span>
                    </div>
                    <div class="status-badge" [attr.data-status]="appointment.status">
                      {{ getStatusLabel(appointment.status) }}
                    </div>
                  </div>

                  <div class="appointment-body">
                    <div class="patient-info">
                      <div class="patient-avatar">
                        <span>{{ getPatientInitials(appointment) }}</span>
                      </div>
                      <div class="patient-details">
                        <h4>{{ appointment.patient?.first_name }} {{ appointment.patient?.last_name }}</h4>
                        <p>{{ appointment.appointment_type || 'Consulta general' }}</p>
                      </div>
                    </div>
                    <ion-icon name="chevron-forward-outline" class="arrow-icon"></ion-icon>
                  </div>

                  @if (appointment.notes) {
                    <div class="appointment-notes">
                      <ion-icon name="document-text-outline"></ion-icon>
                      <span>{{ appointment.notes }}</span>
                    </div>
                  }
                </ion-card-content>
              </ion-card>
            }
          </div>
        }
      }

      <!-- FAB para crear nueva cita (mobile) -->
      <ion-fab slot="fixed" vertical="bottom" horizontal="end" class="hide-desktop">
        <ion-fab-button aria-label="Crear nueva cita" routerLink="/appointments/new">
          <ion-icon name="add-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- Boton para crear nueva cita (desktop) -->
      <div class="desktop-create-btn hide-mobile">
        <ion-button routerLink="/appointments/new" shape="round" expand="block">
          <ion-icon slot="start" name="add-outline"></ion-icon>
          Crear Cita
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    ion-content {
      --background: var(--medical-bg-light);
    }

    /* Header */
    .page-header {
      background: var(--medical-gradient-primary);
      padding: 24px 20px;
      margin: -16px -16px 0;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }

    .header-icon {
      width: 56px;
      height: 56px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;

      ion-icon {
        font-size: 28px;
        color: white;
      }
    }

    .header-info {
      h1 {
        font-size: 36px;
        font-weight: 700;
        color: white;
        margin: 0;
        line-height: 1;
      }

      p {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.9);
        margin: 4px 0 0;
      }
    }

    .stats-row {
      display: flex;
      gap: 12px;
    }

    .stat-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 20px;
      font-size: 12px;
      color: white;
      font-weight: 500;

      ion-icon {
        font-size: 14px;
      }
    }

    /* Filter */
    .filter-container {
      padding: 16px;
      margin-top: 16px;
    }

    ion-segment {
      --background: var(--medical-bg-card);
      border-radius: 12px;
      padding: 4px;
      box-shadow: var(--medical-shadow-sm);
    }

    ion-segment-button {
      --border-radius: 8px;
      --color-checked: white;
      font-size: 12px;
      font-weight: 500;
      min-height: 36px;
      text-transform: none;
    }

    /* Lista de citas */
    .appointments-list {
      padding: 0 16px 100px;
    }

    /* Card de cita */
    .appointment-card {
      margin: 0 0 12px;
      border-radius: var(--medical-radius-md);
      box-shadow: var(--medical-shadow-md);
      border: 1px solid var(--medical-border-light);
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--medical-shadow-lg);
      }

      ion-card-content {
        padding: 16px;
      }
    }

    .appointment-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--medical-border-light);
    }

    .date-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: var(--medical-gradient-primary);
      border-radius: 10px;
      color: white;

      .day {
        font-size: 18px;
        font-weight: 700;
        line-height: 1;
      }

      .month {
        font-size: 10px;
        text-transform: uppercase;
        opacity: 0.9;
      }
    }

    .time-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;

      .time {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 15px;
        font-weight: 600;
        color: var(--ion-color-dark);

        ion-icon {
          font-size: 16px;
          color: var(--ion-color-primary);
        }
      }

      .duration {
        font-size: 12px;
        color: var(--ion-color-medium);
      }
    }

    .status-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.3px;

      &[data-status="pending"] {
        background: rgba(245, 158, 11, 0.1);
        color: var(--ion-color-warning-shade);
      }

      &[data-status="confirmed"] {
        background: rgba(8, 145, 178, 0.1);
        color: var(--ion-color-primary);
      }

      &[data-status="completed"] {
        background: rgba(16, 185, 129, 0.1);
        color: var(--ion-color-success);
      }

      &[data-status="cancelled"] {
        background: rgba(239, 68, 68, 0.1);
        color: var(--ion-color-danger);
      }

      &[data-status="no_show"] {
        background: rgba(100, 116, 139, 0.1);
        color: var(--ion-color-medium);
      }
    }

    .appointment-body {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .patient-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .patient-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--medical-gradient-purple);
      display: flex;
      align-items: center;
      justify-content: center;

      span {
        font-size: 16px;
        font-weight: 600;
        color: white;
        text-transform: uppercase;
      }
    }

    .patient-details {
      h4 {
        font-size: 15px;
        font-weight: 600;
        color: var(--ion-color-dark);
        margin: 0 0 2px;
      }

      p {
        font-size: 13px;
        color: var(--ion-color-medium);
        margin: 0;
      }
    }

    .arrow-icon {
      color: var(--ion-color-medium);
      font-size: 20px;
    }

    .appointment-notes {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-top: 12px;
      padding: 10px 12px;
      background: var(--medical-bg-light);
      border-radius: 8px;
      font-size: 13px;
      color: var(--ion-color-medium);

      ion-icon {
        font-size: 16px;
        margin-top: 1px;
      }

      span {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
    }

    /* Empty state */
    .empty-state,
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 24px;
      text-align: center;

      .empty-icon,
      .error-icon {
        width: 100px;
        height: 100px;
        background: rgba(var(--ion-color-primary-rgb), 0.1);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 24px;

        ion-icon {
          font-size: 48px;
          color: var(--ion-color-primary);
        }
      }

      .error-icon {
        background: rgba(var(--ion-color-danger-rgb), 0.1);

        ion-icon {
          color: var(--ion-color-danger);
        }
      }

      h3 {
        font-size: 20px;
        font-weight: 600;
        color: var(--ion-color-dark);
        margin: 0 0 8px;
      }

      p {
        font-size: 14px;
        color: var(--ion-color-medium);
        margin: 0 0 24px;
        max-width: 260px;
      }

      ion-button {
        --border-radius: 25px;
        height: 48px;
      }
    }

    /* Skeleton */
    .skeleton-card ion-card-content {
      padding: 20px;
    }

    /* FAB */
    ion-fab-button {
      --background: var(--medical-gradient-primary);
      --box-shadow: var(--medical-shadow-lg);
    }

    /* Desktop create button */
    .desktop-create-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 1000;

      ion-button {
        --border-radius: 25px;
        --box-shadow: var(--medical-shadow-lg);
        height: 48px;
        font-weight: 600;
      }
    }

    .hide-mobile {
      display: none;
    }

    .hide-desktop {
      display: block;
    }

    @media (min-width: 768px) {
      .hide-mobile {
        display: block;
      }

      .hide-desktop {
        display: none;
      }
    }
  `]
})
export class AppointmentsListPage implements OnInit {
  private appointmentsApi = inject(AppointmentsApiService);
  private cdr = inject(ChangeDetectorRef);

  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  loading = true;
  errorMessage: string | null = null;
  selectedFilter = 'all';

  // Stats properties
  todayCount: number = 0;
  pendingCount: number = 0;
  confirmedCount: number = 0;

  constructor() {
    addIcons({
      calendarOutline,
      timeOutline,
      personOutline,
      addOutline,
      todayOutline,
      chevronForwardOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      alertCircleOutline,
      hourglassOutline,
      medkitOutline
    });
  }

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.loading = true;
    this.errorMessage = null;
    this.appointmentsApi.list().subscribe({
      next: (appointments) => {
        this.appointments = appointments;
        this.calculateStats();
        this.filterAppointments();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.appointments = [];
        this.filteredAppointments = [];
        this.loading = false;
        this.errorMessage = err.error?.msg || err.error?.message || 'No se pudo cargar la agenda';
        this.cdr.markForCheck();
      }
    });
  }

  calculateStats(): void {
    const today = new Date().toDateString();
    this.todayCount = 0;
    this.pendingCount = 0;
    this.confirmedCount = 0;

    for (const a of this.appointments) {
      if (new Date(a.appointment_date).toDateString() === today) {
        this.todayCount++;
      }
      if (a.status === 'pending') {
        this.pendingCount++;
      } else if (a.status === 'confirmed') {
        this.confirmedCount++;
      }
    }
  }

  filterAppointments(): void {
    if (this.selectedFilter === 'all') {
      this.filteredAppointments = this.appointments;
    } else {
      this.filteredAppointments = this.appointments.filter(a => a.status === this.selectedFilter);
    }
  }

  onRefresh(event: any): void {
    this.loadAppointments();
    setTimeout(() => event.target.complete(), 1000);
  }

  getPatientInitials(appointment: Appointment): string {
    const first = appointment.patient?.first_name?.charAt(0) || '';
    const last = appointment.patient?.last_name?.charAt(0) || '';
    return first + last;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      case 'no_show': return 'medium';
      default: return 'medium';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'confirmed': return 'Confirmada';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      case 'no_show': return 'No asistió';
      default: return status;
    }
  }
}
