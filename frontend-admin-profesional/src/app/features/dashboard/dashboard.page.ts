import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
import { DashboardApiService, DashboardOverview } from '../../core/services';

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
          <ion-menu-button aria-label="Abrir menú"></ion-menu-button>
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
              <ion-card
                class="stat-card stat-card--primary stat-card--clickable"
                role="button"
                tabindex="0"
                (click)="goTo('/patients')"
                (keydown.enter)="onCardKeydown($event, '/patients')"
                (keydown.space)="onCardKeydown($event, '/patients')"
              >
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
              <ion-card
                class="stat-card stat-card--success stat-card--clickable"
                role="button"
                tabindex="0"
                (click)="goTo('/professionals')"
                (keydown.enter)="onCardKeydown($event, '/professionals')"
                (keydown.space)="onCardKeydown($event, '/professionals')"
              >
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
              <ion-card
                class="stat-card stat-card--warning stat-card--clickable"
                role="button"
                tabindex="0"
                (click)="goTo('/appointments')"
                (keydown.enter)="onCardKeydown($event, '/appointments')"
                (keydown.space)="onCardKeydown($event, '/appointments')"
              >
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
              <ion-card
                class="stat-card stat-card--danger stat-card--clickable"
                role="button"
                tabindex="0"
                (click)="goTo('/payments')"
                (keydown.enter)="onCardKeydown($event, '/payments')"
                (keydown.space)="onCardKeydown($event, '/payments')"
              >
                <ion-card-content>
                  <div class="stat-card__icon">
                    <ion-icon name="cash-outline"></ion-icon>
                  </div>
                  <div class="stat-card__info">
                    <span class="stat-card__value">{{ formatCurrencyPYG(overview.revenue.total) }}</span>
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
                    <ion-item button detail="true" class="summary-item" (click)="goTo('/patients')">
                      <ion-icon name="people-outline" slot="start" color="primary"></ion-icon>
                      <ion-label>Nuevos pacientes</ion-label>
                      <ion-badge slot="end" color="primary">{{ overview.recent_activity.new_patients_30d }}</ion-badge>
                    </ion-item>
                    <ion-item button detail="true" class="summary-item" (click)="goToAppointments('completed')">
                      <ion-icon name="calendar-outline" slot="start" color="success"></ion-icon>
                      <ion-label>Citas realizadas</ion-label>
                      <ion-badge slot="end" color="success">{{ overview.recent_activity.appointments_30d }}</ion-badge>
                    </ion-item>
                    <ion-item button detail="true" class="summary-item" (click)="goTo('/medical-records')">
                      <ion-icon name="document-text-outline" slot="start" color="warning"></ion-icon>
                      <ion-label>Historiales médicos</ion-label>
                      <ion-badge slot="end" color="warning">{{ overview.totals.medical_records }}</ion-badge>
                    </ion-item>
                    <ion-item button detail="true" class="summary-item" (click)="goTo('/budgets')">
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
                      <ion-item button detail="true" class="summary-item" (click)="goToAppointments(status.key)">
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
    ion-content {
      --background: var(--medical-bg-light);
    }

    ion-card {
      --background: var(--medical-bg-card);
      border: 1px solid var(--medical-border-light);
      box-shadow: 0 2px 6px rgba(15, 23, 42, 0.05);
      border-radius: 12px;
    }

    ion-item {
      --background: transparent;
      --inner-border-color: var(--medical-border-light);
      --padding-start: 0;
      --inner-padding-end: 0;
    }

    .summary-item {
      cursor: pointer;
      transition: background-color 0.15s ease;
    }

    .summary-item:hover {
      --background: rgba(var(--ion-color-primary-rgb), 0.08);
    }

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
          color: var(--ion-color-dark);
        }
      }

      &__info {
        display: flex;
        flex-direction: column;
      }

      &__value {
        font-size: 24px;
        font-weight: 700;
        color: var(--ion-color-dark);
      }

      &__label {
        font-size: 14px;
        color: var(--ion-color-medium);
      }

      &--primary .stat-card__icon {
        background: rgba(var(--ion-color-primary-rgb), 0.12);
      }

      &--primary .stat-card__icon ion-icon {
        color: var(--ion-color-primary-shade);
      }

      &--success .stat-card__icon {
        background: rgba(var(--ion-color-success-rgb), 0.12);
      }

      &--success .stat-card__icon ion-icon {
        color: var(--ion-color-success);
      }

      &--warning .stat-card__icon {
        background: rgba(var(--ion-color-warning-rgb), 0.14);
      }

      &--warning .stat-card__icon ion-icon {
        color: var(--ion-color-warning-shade);
      }

      &--danger .stat-card__icon {
        background: rgba(var(--ion-color-danger-rgb), 0.14);
      }

      &--danger .stat-card__icon ion-icon {
        color: var(--ion-color-danger-shade);
      }

      &--clickable {
        cursor: pointer;
        transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
      }

      &--clickable:hover {
        transform: translateY(-1px);
        border-color: var(--medical-border-light);
        box-shadow: 0 5px 12px rgba(15, 23, 42, 0.08);
      }

      &--clickable:focus-visible {
        outline: 2px solid rgba(var(--ion-color-primary-rgb), 0.35);
        outline-offset: 2px;
      }
    }

    ion-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      color: var(--ion-color-dark);

      ion-icon {
        font-size: 20px;
        color: var(--ion-color-medium);
      }
    }
  `]
})
export class DashboardPage implements OnInit {
  private dashboardApi = inject(DashboardApiService);
  private router = inject(Router);

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
    this.dashboardApi.getOverview()
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

  goTo(path: string): void {
    void this.router.navigate([path]);
  }

  goToAppointments(status?: string): void {
    const supportedStatuses = new Set([
      'pending',
      'confirmed',
      'completed',
      'cancelled',
      'no_show'
    ]);

    if (status && supportedStatuses.has(status)) {
      void this.router.navigate(['/appointments'], {
        queryParams: { status }
      });
      return;
    }

    void this.router.navigate(['/appointments']);
  }

  onCardKeydown(event: Event, path: string): void {
    event.preventDefault();
    this.goTo(path);
  }

  formatCurrencyPYG(amount: number | null | undefined): string {
    const safeAmount = Number.isFinite(amount) ? Number(amount) : 0;
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      maximumFractionDigits: 0,
    }).format(safeAmount);
  }
}
