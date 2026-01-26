import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonIcon,
  IonButtons,
  IonMenuButton,
  IonRefresher,
  IonRefresherContent,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonFab,
  IonFabButton,
  IonSkeletonText,
  IonBadge,
  IonCard,
  IonCardContent,
  IonChip,
  IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  createOutline,
  trashOutline,
  personCircleOutline,
  callOutline,
  mailOutline,
  peopleOutline,
  searchOutline,
  chevronForwardOutline
} from 'ionicons/icons';
import { environment } from '../../../../environments/environment';
import { Patient } from '../../../models';
import { NotificationService } from '../../../core/services';

@Component({
  selector: 'app-patients-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSearchbar,
    IonList,
    IonItem,
    IonLabel,
    IonAvatar,
    IonIcon,
    IonButtons,
    IonMenuButton,
    IonRefresher,
    IonRefresherContent,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonFab,
    IonFabButton,
    IonSkeletonText,
    IonBadge,
    IonCard,
    IonCardContent,
    IonChip,
    IonText
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Pacientes</ion-title>
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
            <ion-icon name="people-outline"></ion-icon>
          </div>
          <div class="header-info">
            <h1>{{ filteredPatients.length }}</h1>
            <p>Pacientes registrados</p>
          </div>
        </div>
        <div class="stats-row">
          <div class="stat-chip active">
            <span class="stat-dot"></span>
            <span>{{ activeCount }} activos</span>
          </div>
          <div class="stat-chip inactive">
            <span class="stat-dot"></span>
            <span>{{ inactiveCount }} inactivos</span>
          </div>
        </div>
      </div>

      <!-- Buscador -->
      <div class="search-container">
        <ion-searchbar
          placeholder="Buscar por nombre o email..."
          (ionInput)="onSearch($event)"
          [debounce]="300"
          mode="ios"
        ></ion-searchbar>
      </div>

      @if (loading) {
        <div class="patients-grid">
          @for (i of [1,2,3,4,5,6]; track i) {
            <ion-card class="patient-card skeleton-card">
              <ion-card-content>
                <div class="patient-avatar skeleton">
                  <ion-skeleton-text [animated]="true"></ion-skeleton-text>
                </div>
                <ion-skeleton-text [animated]="true" style="width: 80%; height: 18px; margin: 12px auto 8px;"></ion-skeleton-text>
                <ion-skeleton-text [animated]="true" style="width: 60%; height: 14px; margin: 0 auto;"></ion-skeleton-text>
              </ion-card-content>
            </ion-card>
          }
        </div>
      } @else {
        @if (filteredPatients.length === 0) {
          <div class="empty-state">
            <div class="empty-icon">
              <ion-icon name="people-outline"></ion-icon>
            </div>
            <h3>No se encontraron pacientes</h3>
            <p>{{ searchTerm ? 'Intenta con otra busqueda' : 'Agrega tu primer paciente para comenzar' }}</p>
            @if (!searchTerm) {
              <ion-button routerLink="/patients/new" shape="round">
                <ion-icon slot="start" name="add-outline"></ion-icon>
                Agregar Paciente
              </ion-button>
            }
          </div>
        } @else {
          <div class="patients-grid">
            @for (patient of filteredPatients; track patient.id) {
              <ion-card class="patient-card" [routerLink]="['/patients', patient.id]">
                <ion-card-content>
                  <div class="patient-avatar" [class.inactive]="!patient.is_active">
                    <span class="avatar-initials">{{ getInitials(patient) }}</span>
                    <span class="status-indicator" [class.active]="patient.is_active"></span>
                  </div>
                  <h3 class="patient-name">{{ patient.first_name }} {{ patient.last_name }}</h3>
                  <div class="patient-info">
                    <div class="info-item">
                      <ion-icon name="mail-outline"></ion-icon>
                      <span>{{ patient.email }}</span>
                    </div>
                    @if (patient.phone) {
                      <div class="info-item">
                        <ion-icon name="call-outline"></ion-icon>
                        <span>{{ patient.phone }}</span>
                      </div>
                    }
                  </div>
                  <div class="card-footer">
                    <span class="status-badge" [class.active]="patient.is_active" [class.inactive]="!patient.is_active">
                      {{ patient.is_active ? 'Activo' : 'Inactivo' }}
                    </span>
                    <ion-icon name="chevron-forward-outline" class="arrow-icon"></ion-icon>
                  </div>
                </ion-card-content>
              </ion-card>
            }
          </div>
        }
      }

      <!-- FAB para crear nuevo paciente (mobile) -->
      <ion-fab slot="fixed" vertical="bottom" horizontal="end" class="hide-desktop">
        <ion-fab-button routerLink="/patients/new">
          <ion-icon name="add-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- Boton para crear nuevo paciente (desktop) -->
      <div class="desktop-create-btn hide-mobile">
        <ion-button routerLink="/patients/new" shape="round" expand="block">
          <ion-icon slot="start" name="add-outline"></ion-icon>
          Crear Paciente
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
        font-size: 32px;
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

      .stat-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }

      &.active .stat-dot {
        background: #34d399;
      }

      &.inactive .stat-dot {
        background: rgba(255, 255, 255, 0.5);
      }
    }

    /* Search */
    .search-container {
      padding: 16px;
      margin-top: 16px;
    }

    ion-searchbar {
      --background: var(--medical-bg-card);
      --border-radius: 12px;
      --box-shadow: var(--medical-shadow-sm);
      --placeholder-opacity: 0.6;
      padding: 0 !important;
    }

    /* Grid de pacientes */
    .patients-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
      padding: 0 16px 100px;
    }

    /* Card de paciente */
    .patient-card {
      margin: 0;
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
        padding: 20px;
        text-align: center;
      }
    }

    .patient-avatar {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: var(--medical-gradient-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 12px;
      position: relative;

      &.inactive {
        background: var(--ion-color-medium);
      }

      .avatar-initials {
        font-size: 24px;
        font-weight: 600;
        color: white;
        text-transform: uppercase;
      }

      .status-indicator {
        position: absolute;
        bottom: 2px;
        right: 2px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 3px solid white;

        &.active {
          background: var(--ion-color-success);
        }

        &:not(.active) {
          background: var(--ion-color-medium);
        }
      }
    }

    .patient-name {
      font-size: 16px;
      font-weight: 600;
      color: var(--ion-color-dark);
      margin: 0 0 12px;
    }

    .patient-info {
      .info-item {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        font-size: 13px;
        color: var(--ion-color-medium);
        margin-bottom: 6px;

        ion-icon {
          font-size: 14px;
        }

        span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 200px;
        }
      }
    }

    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--medical-border-light);

      .status-badge {
        font-size: 11px;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: 20px;
        text-transform: uppercase;
        letter-spacing: 0.3px;

        &.active {
          background: rgba(16, 185, 129, 0.1);
          color: var(--ion-color-success);
        }

        &.inactive {
          background: rgba(100, 116, 139, 0.1);
          color: var(--ion-color-medium);
        }
      }

      .arrow-icon {
        color: var(--ion-color-medium);
        font-size: 18px;
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
    .skeleton-card {
      .patient-avatar.skeleton {
        background: var(--medical-border-light);

        ion-skeleton-text {
          width: 100%;
          height: 100%;
          border-radius: 50%;
        }
      }
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

    /* Responsive */
    @media (max-width: 576px) {
      .patients-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PatientsListPage implements OnInit {
  private http = inject(HttpClient);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  patients: Patient[] = [];
  filteredPatients: Patient[] = [];
  loading = true;
  searchTerm = '';
  activeCount = 0;
  inactiveCount = 0;

  constructor() {
    addIcons({
      addOutline,
      createOutline,
      trashOutline,
      personCircleOutline,
      callOutline,
      mailOutline,
      peopleOutline,
      searchOutline,
      chevronForwardOutline
    });
  }

  getInitials(patient: Patient): string {
    return (patient.first_name?.charAt(0) || '') + (patient.last_name?.charAt(0) || '');
  }

  /**
   * Optimization: Pre-calculate counts to avoid O(N) operations in the template.
   * This combined with OnPush change detection reduces unnecessary re-renders.
   */
  calculateStats(): void {
    this.activeCount = this.patients.filter(p => p.is_active).length;
    this.inactiveCount = this.patients.length - this.activeCount;
  }

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.loading = true;
    this.http.get<Patient[]>(`${environment.apiUrl}/patients`).subscribe({
      next: (data) => {
        this.patients = data;
        this.calculateStats();
        this.filterPatients();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onSearch(event: any): void {
    this.searchTerm = event.target.value?.toLowerCase() || '';
    this.filterPatients();
  }

  filterPatients(): void {
    if (!this.searchTerm) {
      this.filteredPatients = this.patients;
    } else {
      this.filteredPatients = this.patients.filter(p =>
        p.first_name.toLowerCase().includes(this.searchTerm) ||
        p.last_name.toLowerCase().includes(this.searchTerm) ||
        p.email.toLowerCase().includes(this.searchTerm)
      );
    }
  }

  onRefresh(event: any): void {
    this.loadPatients();
    setTimeout(() => event.target.complete(), 1000);
  }

  async deletePatient(patient: Patient): Promise<void> {
    const confirmed = await this.notification.confirm(
      'Eliminar Paciente',
      `¿Está seguro de eliminar a ${patient.first_name} ${patient.last_name}?`,
      'Eliminar'
    );

    if (confirmed) {
      this.http.delete(`${environment.apiUrl}/patients/${patient.id}`).subscribe({
        next: () => {
          this.notification.showSuccess('Paciente eliminado');
          this.loadPatients();
        }
      });
    }
  }
}
