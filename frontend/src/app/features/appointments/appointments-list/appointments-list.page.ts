import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonButtons,
  IonMenuButton,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonBadge,
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
import { environment } from '../../../../environments/environment';
import { Appointment } from '../../../models';
import { AppointmentDatePipe, AppointmentStatusLabelPipe, PatientInitialsPipe } from './appointments-list.pipes';

@Component({
  selector: 'app-appointments-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonButtons,
    IonMenuButton,
    IonRefresher,
    IonRefresherContent,
    IonSkeletonText,
    IonBadge,
    IonFab,
    IonFabButton,
    IonCard,
    IonCardContent,
    IonSegment,
    IonSegmentButton,
    IonButton,
    AppointmentDatePipe,
    AppointmentStatusLabelPipe,
    PatientInitialsPipe
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Agenda de Citas</ion-title>
        <ion-buttons slot="end">
          <ion-button routerLink="/appointments/new">
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
                      <span class="day">{{ appointment.appointment_date | appointmentDate:'day' }}</span>
                      <span class="month">{{ appointment.appointment_date | appointmentDate:'month' }}</span>
                    </div>
                    <div class="time-info">
                      <span class="time">
                        <ion-icon name="time-outline"></ion-icon>
                        {{ appointment.appointment_date | appointmentDate:'time' }}
                      </span>
                      <span class="duration">{{ appointment.duration_minutes }} min</span>
                    </div>
                    <div class="status-badge" [attr.data-status]="appointment.status">
                      {{ appointment.status | appointmentStatusLabel }}
                    </div>
                  </div>

                  <div class="appointment-body">
                    <div class="patient-info">
                      <div class="patient-avatar">
                        <span>{{ appointment | patientInitials }}</span>
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
        <ion-fab-button routerLink="/appointments/new">
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
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 24px;
      text-align: center;

      .empty-icon {
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
  private http = inject(HttpClient);

  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  loading = true;
  selectedFilter = 'all';

  todayCount = 0;
  pendingCount = 0;
  confirmedCount = 0;

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
    this.http.get<{ items: Appointment[]; total: number; page: number; pages: number }>(`${environment.apiUrl}/appointments`).subscribe({
      next: (response) => {
        this.appointments = response.items || [];
        this.calculateStats();
        this.filterAppointments();
        this.loading = false;
      },
      error: () => {
        this.appointments = [];
        this.filteredAppointments = [];
        this.loading = false;
      }
    });
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

  private calculateStats(): void {
    const today = new Date().toDateString();
    this.todayCount = this.appointments.filter(a => new Date(a.appointment_date).toDateString() === today).length;
    this.pendingCount = this.appointments.filter(a => a.status === 'pending').length;
    this.confirmedCount = this.appointments.filter(a => a.status === 'confirmed').length;
  }
}
