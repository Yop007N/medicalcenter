import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonChip,
  IonSkeletonText,
  IonRefresher,
  IonRefresherContent,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  createOutline,
  trashOutline,
  callOutline,
  mailOutline,
  locationOutline,
  calendarOutline,
  cashOutline,
  ribbonOutline,
  timeOutline
} from 'ionicons/icons';
import { ProfessionalsApiService } from '../../../core/services';
import * as ProfessionalsActions from '../../../store/professionals/professionals.actions';
import { selectSelectedProfessional, selectProfessionalsLoading } from '../../../store/professionals/professionals.selectors';

@Component({
  selector: 'app-professional-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonChip,
    IonSkeletonText,
    IonRefresher,
    IonRefresherContent
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/professionals"></ion-back-button>
        </ion-buttons>
        <ion-title>Detalle Profesional</ion-title>
        <ion-buttons slot="end">
          @if (professional$ | async; as professional) {
            <!-- Mobile: solo iconos -->
            <ion-button [routerLink]="['/professionals', professional.id, 'edit']" class="hide-desktop">
              <ion-icon slot="icon-only" name="create-outline"></ion-icon>
            </ion-button>
            <ion-button color="danger" (click)="confirmDelete(professional)" class="hide-desktop">
              <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
            </ion-button>
            <!-- Desktop: con texto -->
            <ion-button [routerLink]="['/professionals', professional.id, 'edit']" fill="outline" class="hide-mobile">
              <ion-icon slot="start" name="create-outline"></ion-icon>
              Editar
            </ion-button>
            <ion-button color="danger" fill="outline" (click)="confirmDelete(professional)" class="hide-mobile">
              <ion-icon slot="start" name="trash-outline"></ion-icon>
              Eliminar
            </ion-button>
          }
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" (ionRefresh)="onRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      @if (loading$ | async) {
        <ion-card>
          <ion-card-header>
            <ion-skeleton-text [animated]="true" style="width: 60%"></ion-skeleton-text>
            <ion-skeleton-text [animated]="true" style="width: 40%"></ion-skeleton-text>
          </ion-card-header>
        </ion-card>
      } @else if (professional$ | async; as professional) {
        <div class="desktop-layout">
          <!-- Main Column -->
          <div class="column-main">
            <!-- Header Card -->
            <ion-card>
              <ion-card-header>
                <ion-card-title>
                  {{ professional.first_name }} {{ professional.last_name }}
                </ion-card-title>
                <ion-card-subtitle>
                  <ion-chip color="primary">{{ professional.specialty }}</ion-chip>
                  <ion-badge [color]="professional.is_active ? 'success' : 'medium'">
                    {{ professional.is_active ? 'Activo' : 'Inactivo' }}
                  </ion-badge>
                </ion-card-subtitle>
              </ion-card-header>
              <ion-card-content>
                <div class="info-grid">
                  <div class="info-item">
                    <ion-icon name="mail-outline" color="primary"></ion-icon>
                    <div class="info-content">
                      <span class="info-label">Email</span>
                      <span class="info-value">{{ professional.email }}</span>
                    </div>
                  </div>
                  @if (professional.phone) {
                    <div class="info-item">
                      <ion-icon name="call-outline" color="primary"></ion-icon>
                      <div class="info-content">
                        <span class="info-label">Teléfono</span>
                        <span class="info-value">{{ professional.phone }}</span>
                      </div>
                    </div>
                  }
                  @if (professional.license_number) {
                    <div class="info-item">
                      <ion-icon name="ribbon-outline" color="tertiary"></ion-icon>
                      <div class="info-content">
                        <span class="info-label">Matrícula</span>
                        <span class="info-value">{{ professional.license_number }}</span>
                      </div>
                    </div>
                  }
                  @if (professional.consultation_fee) {
                    <div class="info-item">
                      <ion-icon name="cash-outline" color="success"></ion-icon>
                      <div class="info-content">
                        <span class="info-label">Valor de Consulta</span>
                        <span class="info-value">{{ formatCurrency(professional.consultation_fee) }}</span>
                      </div>
                    </div>
                  }
                  @if (professional.office_address) {
                    <div class="info-item full-width">
                      <ion-icon name="location-outline" color="danger"></ion-icon>
                      <div class="info-content">
                        <span class="info-label">Consultorio</span>
                        <span class="info-value">{{ professional.office_address }}</span>
                      </div>
                    </div>
                  }
                  @if (professional.working_hours) {
                    <div class="info-item full-width">
                      <ion-icon name="time-outline" color="warning"></ion-icon>
                      <div class="info-content">
                        <span class="info-label">Horario de Atención</span>
                        <span class="info-value">{{ professional.working_hours }}</span>
                      </div>
                    </div>
                  }
                </div>
              </ion-card-content>
            </ion-card>

            @if (professional.bio) {
              <ion-card>
                <ion-card-header>
                  <ion-card-title>Biografía</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <p class="text-content">{{ professional.bio }}</p>
                </ion-card-content>
              </ion-card>
            }
          </div>

          <!-- Side Column -->
          <div class="column-side">
            <!-- Upcoming Appointments -->
            <ion-card>
              <ion-card-header>
                <ion-card-title>Próximas Citas</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                @if (appointments.length > 0) {
                  <ion-list lines="none" class="appointments-list">
                    @for (apt of appointments; track apt.id) {
                      <ion-item>
                        <ion-icon name="calendar-outline" slot="start" color="primary"></ion-icon>
                        <ion-label>
                          <h3>{{ formatDateTime(apt.appointment_date) }}</h3>
                          <p>{{ apt.patient?.first_name }} {{ apt.patient?.last_name }}</p>
                        </ion-label>
                        <ion-badge slot="end" [color]="getStatusColor(apt.status)">
                          {{ getStatusLabel(apt.status) }}
                        </ion-badge>
                      </ion-item>
                    }
                  </ion-list>
                } @else {
                  <p class="ion-text-center empty-text">No hay citas programadas</p>
                }
              </ion-card-content>
            </ion-card>
          </div>
        </div>
      }
    </ion-content>
  `,
  styles: [`
    ion-card-subtitle {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-top: 8px;
    }

    /* Desktop Layout */
    .desktop-layout {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .column-main, .column-side {
      width: 100%;
    }

    /* Info Grid */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .info-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .info-item ion-icon {
      font-size: 22px;
      min-width: 22px;
    }

    .info-content {
      display: flex;
      flex-direction: column;
    }

    .info-label {
      font-size: 12px;
      color: var(--ion-color-medium);
    }

    .info-value {
      font-size: 15px;
      font-weight: 500;
      color: var(--ion-text-color);
    }

    .text-content {
      font-size: 15px;
      line-height: 1.6;
      white-space: pre-wrap;
    }

    .appointments-list ion-item {
      --padding-start: 0;
    }

    .appointments-list ion-item h3 {
      font-weight: 500;
    }

    .appointments-list ion-item p {
      color: var(--ion-color-medium);
      font-size: 12px;
    }

    .empty-text {
      color: var(--ion-color-medium);
      padding: 16px;
    }

    .hide-mobile {
      display: none;
    }

    .hide-desktop {
      display: inline-flex;
    }

    /* Tablet and Desktop */
    @media (min-width: 768px) {
      .desktop-layout {
        flex-direction: row;
        gap: 24px;
      }

      .column-main {
        flex: 2;
        min-width: 0;
      }

      .column-side {
        flex: 1;
        min-width: 300px;
        max-width: 400px;
      }

      .info-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .info-item.full-width {
        grid-column: 1 / -1;
      }

      .hide-mobile {
        display: inline-flex;
      }

      .hide-desktop {
        display: none;
      }
    }
  `]
})
export class ProfessionalDetailPage implements OnInit {
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private alertController = inject(AlertController);
  private professionalsApi = inject(ProfessionalsApiService);

  professional$ = this.store.select(selectSelectedProfessional);
  loading$ = this.store.select(selectProfessionalsLoading);

  appointments: any[] = [];
  professionalId: number | null = null;

  constructor() {
    addIcons({
      createOutline,
      trashOutline,
      callOutline,
      mailOutline,
      locationOutline,
      calendarOutline,
      cashOutline,
      ribbonOutline,
      timeOutline
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.professionalId = parseInt(idParam, 10);
      this.store.dispatch(ProfessionalsActions.loadProfessional({ id: this.professionalId }));
      this.loadAppointments();
    }
  }

  onRefresh(event: any): void {
    if (this.professionalId) {
      this.store.dispatch(ProfessionalsActions.loadProfessional({ id: this.professionalId }));
      this.loadAppointments();
    }
    setTimeout(() => event.target.complete(), 1000);
  }

  loadAppointments(): void {
    if (!this.professionalId) {
      this.appointments = [];
      return;
    }

    this.professionalsApi.listAppointments(this.professionalId)
      .subscribe({
        next: (data) => this.appointments = data.slice(0, 5),
        error: () => this.appointments = []
      });
  }

  async confirmDelete(professional: any): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: `¿Está seguro de eliminar a ${professional.first_name} ${professional.last_name}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.store.dispatch(ProfessionalsActions.deleteProfessional({ id: professional.id }));
          }
        }
      ]
    });
    await alert.present();
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount || 0);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      default: return 'medium';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'confirmed': return 'Confirmada';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  }
}
