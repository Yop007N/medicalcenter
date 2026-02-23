import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonButtons,
  IonMenuButton,
  IonSkeletonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  peopleOutline,
  medkitOutline,
  calendarOutline,
  cashOutline,
  documentTextOutline,
  folderOutline,
  trendingUpOutline,
  timeOutline
} from 'ionicons/icons';
import { environment } from '../../../environments/environment';

interface DashboardOverview {
  totals: {
    patients: number;
    professionals: number;
    appointments: number;
    medical_records: number;
    budgets: number;
    payments: number;
  };
  recent_activity: {
    new_patients_30d: number;
    appointments_30d: number;
  };
  appointment_status: Record<string, number>;
  revenue: {
    total: number;
    currency: string;
  };
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonButtons,
    IonMenuButton,
    IonSkeletonText
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Dashboard</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" (ionRefresh)="onRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      @if (loading) {
        <ion-grid>
          <ion-row>
            @for (i of [1,2,3,4]; track i) {
              <ion-col size="12" size-md="6" size-lg="3">
                <ion-card>
                  <ion-card-content>
                    <ion-skeleton-text [animated]="true" style="width: 60%"></ion-skeleton-text>
                    <ion-skeleton-text [animated]="true" style="width: 40%; height: 32px"></ion-skeleton-text>
                  </ion-card-content>
                </ion-card>
              </ion-col>
            }
          </ion-row>
        </ion-grid>
      } @else if (overview) {
        <ion-grid>
          <!-- Stats Cards -->
          <ion-row>
            <ion-col size="12" size-md="6" size-lg="3">
              <ion-card class="stat-card stat-card--primary">
                <ion-card-content>
                  <div class="stat-card__icon">
                    <ion-icon name="people-outline"></ion-icon>
                  </div>
                  <div class="stat-card__info">
                    <span class="stat-card__value">{{ overview.totals.patients }}</span>
                    <span class="stat-card__label">Pacientes</span>
                  </div>
                </ion-card-content>
              </ion-card>
            </ion-col>

            <ion-col size="12" size-md="6" size-lg="3">
              <ion-card class="stat-card stat-card--success">
                <ion-card-content>
                  <div class="stat-card__icon">
                    <ion-icon name="medkit-outline"></ion-icon>
                  </div>
                  <div class="stat-card__info">
                    <span class="stat-card__value">{{ overview.totals.professionals }}</span>
                    <span class="stat-card__label">Profesionales</span>
                  </div>
                </ion-card-content>
              </ion-card>
            </ion-col>

            <ion-col size="12" size-md="6" size-lg="3">
              <ion-card class="stat-card stat-card--warning">
                <ion-card-content>
                  <div class="stat-card__icon">
                    <ion-icon name="calendar-outline"></ion-icon>
                  </div>
                  <div class="stat-card__info">
                    <span class="stat-card__value">{{ overview.totals.appointments }}</span>
                    <span class="stat-card__label">Citas</span>
                  </div>
                </ion-card-content>
              </ion-card>
            </ion-col>

            <ion-col size="12" size-md="6" size-lg="3">
              <ion-card class="stat-card stat-card--danger">
                <ion-card-content>
                  <div class="stat-card__icon">
                    <ion-icon name="cash-outline"></ion-icon>
                  </div>
                  <div class="stat-card__info">
                    <span class="stat-card__value">{{ overview.revenue.total | currency:'ARS':'symbol':'1.0-0' }}</span>
                    <span class="stat-card__label">Ingresos</span>
                  </div>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>

          <!-- Activity Summary -->
          <ion-row>
            <ion-col size="12" size-md="6">
              <ion-card>
                <ion-card-header>
                  <ion-card-title>
                    <ion-icon name="trending-up-outline"></ion-icon>
                    Actividad Reciente (30 días)
                  </ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <ion-list lines="none">
                    <ion-item>
                      <ion-icon name="people-outline" slot="start" color="primary"></ion-icon>
                      <ion-label>Nuevos pacientes</ion-label>
                      <ion-badge slot="end" color="primary">{{ overview.recent_activity.new_patients_30d }}</ion-badge>
                    </ion-item>
                    <ion-item>
                      <ion-icon name="calendar-outline" slot="start" color="success"></ion-icon>
                      <ion-label>Citas realizadas</ion-label>
                      <ion-badge slot="end" color="success">{{ overview.recent_activity.appointments_30d }}</ion-badge>
                    </ion-item>
                    <ion-item>
                      <ion-icon name="document-text-outline" slot="start" color="warning"></ion-icon>
                      <ion-label>Historiales médicos</ion-label>
                      <ion-badge slot="end" color="warning">{{ overview.totals.medical_records }}</ion-badge>
                    </ion-item>
                    <ion-item>
                      <ion-icon name="folder-outline" slot="start" color="tertiary"></ion-icon>
                      <ion-label>Presupuestos</ion-label>
                      <ion-badge slot="end" color="tertiary">{{ overview.totals.budgets }}</ion-badge>
                    </ion-item>
                  </ion-list>
                </ion-card-content>
              </ion-card>
            </ion-col>

            <ion-col size="12" size-md="6">
              <ion-card>
                <ion-card-header>
                  <ion-card-title>
                    <ion-icon name="time-outline"></ion-icon>
                    Estado de Citas
                  </ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <ion-list lines="none">
                    @for (status of appointmentStatuses; track status.key) {
                      <ion-item>
                        <ion-label>{{ status.label }}</ion-label>
                        <ion-badge slot="end" [color]="status.color">
                          {{ overview.appointment_status[status.key] || 0 }}
                        </ion-badge>
                      </ion-item>
                    }
                  </ion-list>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>
      }
    </ion-content>
  `,
  styles: [`
    .stat-card {
      ion-card-content {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px;
      }

      &__icon {
        width: 60px;
        height: 60px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;

        ion-icon {
          font-size: 28px;
          color: white;
        }
      }

      &__info {
        display: flex;
        flex-direction: column;
      }

      &__value {
        font-size: 24px;
        font-weight: 700;
      }

      &__label {
        font-size: 14px;
        color: var(--ion-color-medium);
      }

      &--primary .stat-card__icon {
        background: var(--ion-color-primary);
      }

      &--success .stat-card__icon {
        background: var(--ion-color-success);
      }

      &--warning .stat-card__icon {
        background: var(--ion-color-warning);
      }

      &--danger .stat-card__icon {
        background: var(--ion-color-danger);
      }
    }

    ion-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;

      ion-icon {
        font-size: 20px;
      }
    }
  `]
})
export class DashboardPage implements OnInit {
  private http = inject(HttpClient);

  overview: DashboardOverview | null = null;
  loading = true;

  appointmentStatuses = [
    { key: 'pending', label: 'Pendientes', color: 'warning' },
    { key: 'confirmed', label: 'Confirmadas', color: 'primary' },
    { key: 'completed', label: 'Completadas', color: 'success' },
    { key: 'cancelled', label: 'Canceladas', color: 'danger' },
    { key: 'no_show', label: 'No asistió', color: 'medium' }
  ];

  constructor() {
    addIcons({
      peopleOutline,
      medkitOutline,
      calendarOutline,
      cashOutline,
      documentTextOutline,
      folderOutline,
      trendingUpOutline,
      timeOutline
    });
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.http.get<DashboardOverview>(`${environment.apiUrl}/dashboard/overview`)
      .subscribe({
        next: (data) => {
          this.overview = data;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  onRefresh(event: any): void {
    this.loadDashboard();
    setTimeout(() => event.target.complete(), 1000);
  }
}
