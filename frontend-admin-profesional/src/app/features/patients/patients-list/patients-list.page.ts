import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonIcon,
  IonButtons,
  IonMenuButton,
  IonRefresher,
  IonRefresherContent,
  IonFab,
  IonFabButton,
  IonSkeletonText,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  callOutline,
  mailOutline,
  peopleOutline,
  chevronForwardOutline
} from 'ionicons/icons';
import { Patient } from '../../../models';
import { NotificationService, PatientsApiService } from '../../../core/services';

interface PatientListItem extends Patient {
  initials: string;
  searchIndex: string;
}

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
    IonIcon,
    IonButtons,
    IonMenuButton,
    IonRefresher,
    IonRefresherContent,
    IonFab,
    IonFabButton,
    IonSkeletonText,
    IonList,
    IonItem,
    IonLabel,
    IonAvatar,
    IonButton
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button aria-label="Abrir menu principal"></ion-menu-button>
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
          aria-label="Buscar pacientes"
          placeholder="Buscar por nombre o email..."
          (ionInput)="onSearch($event)"
          [debounce]="300"
          mode="ios"
        ></ion-searchbar>
      </div>

      @if (loading) {
        <ion-list class="patients-list skeleton-list">
          @for (i of skeletonCards; track i) {
            <ion-item class="patient-list-item">
              <ion-avatar slot="start" class="patient-avatar skeleton">
                <ion-skeleton-text [animated]="true"></ion-skeleton-text>
              </ion-avatar>
              <ion-label>
                <ion-skeleton-text [animated]="true" style="width: 60%; height: 18px;"></ion-skeleton-text>
                <ion-skeleton-text [animated]="true" style="width: 70%; height: 14px;"></ion-skeleton-text>
              </ion-label>
            </ion-item>
          }
        </ion-list>
      } @else if (errorMessage) {
        <div class="empty-state" role="alert" aria-live="assertive">
          <div class="empty-icon">
            <ion-icon name="people-outline"></ion-icon>
          </div>
          <h3>Error al cargar pacientes</h3>
          <p>{{ errorMessage }}</p>
          <ion-button shape="round" (click)="loadPatients()">
            Reintentar
          </ion-button>
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
          <ion-list class="patients-list">
            @for (patient of filteredPatients; track patient.id) {
              <ion-item button class="patient-list-item" [routerLink]="['/patients', patient.id]" detail="false">
                <ion-avatar slot="start" class="patient-avatar" [class.inactive]="!patient.is_active">
                  <span class="avatar-initials">{{ patient.initials }}</span>
                </ion-avatar>

                <ion-label>
                  <h2 class="patient-name">{{ patient.first_name }} {{ patient.last_name }}</h2>
                  <p class="info-item">
                    <ion-icon name="mail-outline"></ion-icon>
                    <span>{{ patient.email }}</span>
                  </p>
                  @if (patient.phone) {
                    <p class="info-item">
                      <ion-icon name="call-outline"></ion-icon>
                      <span>{{ patient.phone }}</span>
                    </p>
                  }
                </ion-label>

                <span slot="end" class="status-badge" [class.active]="patient.is_active" [class.inactive]="!patient.is_active">
                  {{ patient.is_active ? 'Activo' : 'Inactivo' }}
                </span>
                <ion-icon slot="end" name="chevron-forward-outline" class="arrow-icon"></ion-icon>
              </ion-item>
            }
          </ion-list>
        }
      }

      <!-- FAB para crear nuevo paciente (mobile) -->
      <ion-fab slot="fixed" vertical="bottom" horizontal="end" class="hide-desktop">
        <ion-fab-button aria-label="Crear nuevo paciente" routerLink="/patients/new">
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
      background: var(--medical-bg-card);
      border: 1px solid var(--medical-border-light);
      border-radius: var(--medical-radius-md);
      box-shadow: var(--medical-shadow-sm);
      padding: 20px;
      margin: 16px 16px 0;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 14px;
    }

    .header-icon {
      width: 56px;
      height: 56px;
      background: rgba(var(--ion-color-primary-rgb), 0.12);
      border-radius: var(--medical-radius-md);
      display: flex;
      align-items: center;
      justify-content: center;

      ion-icon {
        font-size: 28px;
        color: var(--ion-color-primary);
      }
    }

    .header-info {
      h1 {
        font-size: 32px;
        font-weight: 700;
        color: var(--ion-color-dark);
        margin: 0;
        line-height: 1;
      }

      p {
        font-size: 14px;
        color: var(--ion-color-medium);
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
      background: var(--medical-bg-hover);
      border: 1px solid var(--medical-border-light);
      border-radius: var(--medical-radius-full);
      font-size: 12px;
      color: var(--ion-color-dark);
      font-weight: 500;

      .stat-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }

      &.active .stat-dot {
        background: var(--ion-color-success);
      }

      &.inactive .stat-dot {
        background: var(--ion-color-medium);
      }
    }

    /* Search */
    .search-container {
      padding: 16px;
      margin-top: 8px;
    }

    ion-searchbar {
      --background: var(--medical-bg-card);
      --border-radius: 12px;
      --box-shadow: var(--medical-shadow-sm);
      --placeholder-opacity: 0.6;
      padding: 0 !important;
    }

    /* Listado de pacientes */
    .patients-list {
      padding: 0 16px 100px;
      background: transparent;
    }

    .patient-list-item {
      --background: var(--medical-bg-card);
      --border-radius: var(--medical-radius-md);
      --padding-start: 16px;
      --padding-end: 12px;
      --inner-padding-end: 0;
      --inner-border-width: 0 0 1px 0;
      --inner-border-color: var(--medical-border-light);
      margin: 0;
      transition: all 0.2s ease;
      box-shadow: var(--medical-shadow-sm);
      border: 1px solid var(--medical-border-light);
      border-radius: var(--medical-radius-md);
      margin-bottom: 10px;

      &:hover {
        box-shadow: var(--medical-shadow-md);
      }
    }

    .patient-avatar {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: rgba(var(--ion-color-primary-rgb), 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0;

      &.inactive {
        background: rgba(var(--ion-color-medium-rgb), 0.15);
      }

      .avatar-initials {
        font-size: 16px;
        font-weight: 600;
        color: var(--ion-color-primary);
        text-transform: uppercase;
      }
    }

    .patient-name {
      font-size: 16px;
      font-weight: 600;
      color: var(--ion-color-dark);
      margin: 0 0 6px;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--ion-color-medium);
      margin: 2px 0;

      ion-icon {
        font-size: 14px;
      }

      span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 320px;
      }
    }

    .status-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-right: 6px;

      &.active {
        background: rgba(var(--ion-color-success-rgb), 0.12);
        color: var(--ion-color-success);
      }

      &.inactive {
        background: rgba(var(--ion-color-medium-rgb), 0.12);
        color: var(--ion-color-medium);
      }
    }

    .arrow-icon {
      color: var(--ion-color-medium);
      font-size: 18px;
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
    .patient-avatar.skeleton {
      background: var(--medical-border-light);

      ion-skeleton-text {
        width: 100%;
        height: 100%;
        border-radius: 50%;
      }
    }

    /* FAB */
    ion-fab-button {
      --background: var(--ion-color-primary);
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

    @media (max-width: 768px) {
      .status-badge {
        display: none;
      }
    }
  `]
})
export class PatientsListPage implements OnInit {
  private readonly patientsApi = inject(PatientsApiService);
  private readonly notification = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);

  private allPatients: PatientListItem[] = [];
  filteredPatients: PatientListItem[] = [];
  readonly skeletonCards = [1, 2, 3, 4, 5, 6];

  loading = true;
  searchTerm = '';
  errorMessage: string | null = null;
  activeCount = 0;
  inactiveCount = 0;

  constructor() {
    addIcons({
      addOutline,
      callOutline,
      mailOutline,
      peopleOutline,
      chevronForwardOutline
    });
  }

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(onComplete?: () => void): void {
    this.loading = true;
    this.errorMessage = null;
    this.cdr.markForCheck();

    this.patientsApi.list().subscribe({
      next: (patients) => {
        this.setPatients(patients);
        this.loading = false;
        onComplete?.();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = this.resolveErrorMessage(err);
        onComplete?.();
        this.cdr.markForCheck();
      }
    });
  }

  onSearch(event: Event): void {
    const customEvent = event as CustomEvent<{ value?: string | null }>;
    this.searchTerm = (customEvent.detail?.value ?? '').trim().toLowerCase();
    this.applyFilter();
    this.cdr.markForCheck();
  }

  private applyFilter(): void {
    if (!this.searchTerm) {
      this.filteredPatients = this.allPatients;
    } else {
      this.filteredPatients = this.allPatients.filter(patient => patient.searchIndex.includes(this.searchTerm));
    }
  }

  private setPatients(patients: Patient[]): void {
    const mappedPatients = patients.map((patient) => this.mapPatient(patient));

    this.allPatients = mappedPatients;
    this.activeCount = mappedPatients.reduce((total, patient) => total + (patient.is_active ? 1 : 0), 0);
    this.inactiveCount = mappedPatients.length - this.activeCount;
    this.applyFilter();
  }

  private mapPatient(patient: Patient): PatientListItem {
    const firstName = patient.first_name ?? '';
    const lastName = patient.last_name ?? '';
    const email = patient.email ?? '';

    return {
      ...patient,
      initials: `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase(),
      searchIndex: `${firstName} ${lastName} ${email}`.toLowerCase()
    };
  }

  private resolveErrorMessage(error: unknown): string {
    const errorObject = error as { error?: { msg?: string; message?: string } } | null;
    return errorObject?.error?.msg || errorObject?.error?.message || 'No se pudo cargar la lista';
  }

  onRefresh(event: Event): void {
    const refresher = event.target as { complete?: () => Promise<void> | void } | null;
    this.loadPatients(() => {
      void refresher?.complete?.();
    });
  }

  async deletePatient(patient: Patient): Promise<void> {
    const confirmed = await this.notification.confirm(
      'Eliminar Paciente',
      `¿Está seguro de eliminar a ${patient.first_name} ${patient.last_name}?`,
      'Eliminar'
    );

    if (confirmed) {
      this.patientsApi.delete(patient.id).subscribe({
        next: () => {
          this.notification.showSuccess('Paciente eliminado');
          this.loadPatients();
        }
      });
    }
  }
}
