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

  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonBadge,
  IonSkeletonText,
  IonRefresher,
  IonRefresherContent,
  AlertController,
  ActionSheetController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  createOutline,
  trashOutline,
  calendarOutline,
  timeOutline,
  personOutline,
  medkitOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  ellipsisVerticalOutline,
  documentTextOutline,
  chevronBackOutline
} from 'ionicons/icons';
import * as AppointmentsActions from '../../../store/appointments/appointments.actions';
import { selectSelectedAppointment, selectAppointmentsLoading } from '../../../store/appointments/appointments.selectors';

@Component({
  selector: 'app-appointment-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,

    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonBadge,
    IonSkeletonText,
    IonRefresher,
    IonRefresherContent
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button fill="clear" [routerLink]="['/appointments']" [queryParams]="scopeQueryParams" aria-label="Volver a citas">
            <ion-icon slot="icon-only" name="chevron-back-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Detalle de Cita</ion-title>
        <ion-buttons slot="end">
          @if (appointment$ | async; as appointment) {
            <!-- Mobile: solo iconos -->
            <ion-button [routerLink]="['/appointments', appointment.id, 'edit']" [queryParams]="scopeQueryParams" class="hide-desktop" aria-label="Editar cita">
              <ion-icon slot="icon-only" name="create-outline"></ion-icon>
            </ion-button>
            <ion-button (click)="showActions(appointment)" class="hide-desktop" aria-label="Más opciones de cita">
              <ion-icon slot="icon-only" name="ellipsis-vertical-outline"></ion-icon>
            </ion-button>
            <!-- Desktop: con texto -->
            <ion-button [routerLink]="['/appointments', appointment.id, 'edit']" [queryParams]="scopeQueryParams" fill="outline" class="hide-mobile">
              <ion-icon slot="start" name="create-outline"></ion-icon>
              Editar
            </ion-button>
            <ion-button color="danger" fill="outline" (click)="confirmDelete(appointment)" class="hide-mobile">
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
      } @else if (appointment$ | async; as appointment) {
        <div class="desktop-layout">
          <!-- Main Column -->
          <div class="column-main">
            <!-- Main Info Card -->
            <ion-card>
              <ion-card-header>
                <ion-card-title>
                  <ion-icon name="calendar-outline"></ion-icon>
                  {{ formatDate(appointment.appointment_date) }}
                </ion-card-title>
                <ion-card-subtitle>
                  <ion-badge [color]="getStatusColor(appointment.status)">
                    {{ getStatusLabel(appointment.status) }}
                  </ion-badge>
                  <span class="type-badge">{{ appointment.appointment_type }}</span>
                </ion-card-subtitle>
              </ion-card-header>
              <ion-card-content>
                <div class="info-grid">
                  <div class="info-item">
                    <ion-icon name="time-outline" color="primary"></ion-icon>
                    <div class="info-content">
                      <span class="info-label">Hora</span>
                      <span class="info-value">{{ formatTime(appointment.appointment_date) }}</span>
                    </div>
                  </div>
                  <div class="info-item">
                    <ion-icon name="time-outline" color="tertiary"></ion-icon>
                    <div class="info-content">
                      <span class="info-label">Duración</span>
                      <span class="info-value">{{ appointment.duration_minutes || 30 }} minutos</span>
                    </div>
                  </div>
                </div>
              </ion-card-content>
            </ion-card>

            <!-- Patient & Professional Cards in Grid -->
            <div class="cards-grid">
              <!-- Patient Card -->
              <ion-card>
                <ion-card-header>
                  <ion-card-title>
                    <ion-icon name="person-outline"></ion-icon>
                    Paciente
                  </ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  @if (appointment.patient) {
                    <ion-item [routerLink]="['/patients', appointment.patient.id]" [queryParams]="scopeQueryParams" detail lines="none">
                      <ion-label>
                        <h2>{{ appointment.patient.first_name }} {{ appointment.patient.last_name }}</h2>
                        <p>{{ appointment.patient.email }}</p>
                        @if (appointment.patient.phone) {
                          <p>{{ appointment.patient.phone }}</p>
                        }
                      </ion-label>
                    </ion-item>
                  } @else {
                    <p class="ion-padding-start">Paciente ID: {{ appointment.patient_id }}</p>
                  }
                </ion-card-content>
              </ion-card>

              <!-- Professional Card -->
              <ion-card>
                <ion-card-header>
                  <ion-card-title>
                    <ion-icon name="medkit-outline"></ion-icon>
                    Profesional
                  </ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  @if (appointment.professional) {
                    <ion-item [routerLink]="['/professionals', appointment.professional.id]" detail lines="none">
                      <ion-label>
                        <h2>{{ appointment.professional.first_name }} {{ appointment.professional.last_name }}</h2>
                        <p>{{ appointment.professional.specialty }}</p>
                        @if (appointment.professional.email) {
                          <p>{{ appointment.professional.email }}</p>
                        }
                      </ion-label>
                    </ion-item>
                  } @else {
                    <p class="ion-padding-start">Profesional ID: {{ appointment.professional_id }}</p>
                  }
                </ion-card-content>
              </ion-card>
            </div>

            <!-- Reason & Notes in Grid -->
            @if (appointment.reason || appointment.notes) {
              <div class="cards-grid">
                @if (appointment.reason) {
                  <ion-card>
                    <ion-card-header>
                      <ion-card-title>
                        <ion-icon name="document-text-outline"></ion-icon>
                        Motivo de Consulta
                      </ion-card-title>
                    </ion-card-header>
                    <ion-card-content>
                      <p class="text-content">{{ appointment.reason }}</p>
                    </ion-card-content>
                  </ion-card>
                }
                @if (appointment.notes) {
                  <ion-card>
                    <ion-card-header>
                      <ion-card-title>Notas</ion-card-title>
                    </ion-card-header>
                    <ion-card-content>
                      <p class="text-content">{{ appointment.notes }}</p>
                    </ion-card-content>
                  </ion-card>
                }
              </div>
            }
          </div>

          <!-- Side Column - Actions -->
          <div class="column-side">
            @if (appointment.status === 'pending' || appointment.status === 'confirmed') {
              <ion-card class="actions-card">
                <ion-card-header>
                  <ion-card-title>Acciones</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  @if (appointment.status === 'pending') {
                    <ion-button expand="block" color="success" (click)="confirmAppointment(appointment)">
                      <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
                      Confirmar Cita
                    </ion-button>
                    <ion-button expand="block" color="danger" fill="outline" (click)="cancelAppointment(appointment)">
                      <ion-icon name="close-circle-outline" slot="start"></ion-icon>
                      Cancelar Cita
                    </ion-button>
                  }
                  @if (appointment.status === 'confirmed') {
                    <ion-button expand="block" color="success" (click)="completeAppointment(appointment)">
                      <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
                      Marcar Completada
                    </ion-button>
                    <ion-button expand="block" color="danger" fill="outline" (click)="cancelAppointment(appointment)">
                      <ion-icon name="close-circle-outline" slot="start"></ion-icon>
                      Cancelar Cita
                    </ion-button>
                  }
                </ion-card-content>
              </ion-card>
            }
          </div>
        </div>
      }
    </ion-content>
  `,
  styles: [`
    ion-card-title ion-icon {
      vertical-align: middle;
      margin-right: 8px;
    }

    ion-card-subtitle {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-top: 8px;
    }

    .type-badge {
      font-size: 14px;
      color: var(--ion-color-medium);
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

    /* Cards Grid */
    .cards-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0;
    }

    .cards-grid ion-card {
      margin-top: 0;
    }

    /* Info Grid */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .info-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .info-item ion-icon {
      font-size: 24px;
      min-width: 24px;
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
      font-size: 16px;
      font-weight: 500;
      color: var(--ion-text-color);
    }

    .text-content {
      font-size: 15px;
      line-height: 1.5;
      white-space: pre-wrap;
    }

    .actions-card ion-button {
      margin-bottom: 8px;
    }

    .actions-card ion-button:last-child {
      margin-bottom: 0;
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
        min-width: 280px;
        max-width: 350px;
      }

      .cards-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
      }

      .cards-grid ion-card {
        margin: 0;
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
export class AppointmentDetailPage implements OnInit {
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private alertController = inject(AlertController);
  private actionSheetController = inject(ActionSheetController);

  appointment$ = this.store.select(selectSelectedAppointment);
  loading$ = this.store.select(selectAppointmentsLoading);

  appointmentId: number | null = null;
  currentPatientId?: number;
  currentProfessionalId?: number;
  currentSpecialtyKey?: string;

  constructor() {
    addIcons({
      createOutline,
      trashOutline,
      calendarOutline,
      timeOutline,
      personOutline,
      medkitOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      ellipsisVerticalOutline,
      documentTextOutline,
      chevronBackOutline
    });
  }

  ngOnInit(): void {
    this.currentPatientId = this.parseNumberParam(this.route.snapshot.queryParamMap.get('patient_id'));
    this.currentProfessionalId = this.parseNumberParam(this.route.snapshot.queryParamMap.get('professional_id'));
    this.currentSpecialtyKey = this.route.snapshot.queryParamMap.get('specialty_key') || undefined;
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.appointmentId = parseInt(idParam, 10);
      this.store.dispatch(AppointmentsActions.loadAppointment({ id: this.appointmentId }));
    }
  }

  onRefresh(event: any): void {
    if (this.appointmentId) {
      this.store.dispatch(AppointmentsActions.loadAppointment({ id: this.appointmentId }));
    }
    setTimeout(() => event.target.complete(), 1000);
  }

  get scopeQueryParams(): { patient_id?: number; professional_id?: number; specialty_key?: string } {
    return {
      patient_id: this.currentPatientId,
      professional_id: this.currentProfessionalId,
      specialty_key: this.currentSpecialtyKey
    };
  }

  private parseNumberParam(rawValue: string | null): number | undefined {
    if (!rawValue) {
      return undefined;
    }

    const parsed = Number.parseInt(rawValue, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  async showActions(appointment: any): Promise<void> {
    const actionSheet = await this.actionSheetController.create({
      header: 'Acciones',
      buttons: [
        {
          text: 'Eliminar',
          role: 'destructive',
          icon: 'trash-outline',
          handler: () => this.confirmDelete(appointment)
        },
        {
          text: 'Cancelar',
          role: 'cancel',
          icon: 'close'
        }
      ]
    });
    await actionSheet.present();
  }

  async confirmAppointment(appointment: any): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirmar Cita',
      message: '¿Desea confirmar esta cita?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar',
          handler: () => {
            this.store.dispatch(AppointmentsActions.confirmAppointment({ id: appointment.id }));
          }
        }
      ]
    });
    await alert.present();
  }

  async cancelAppointment(appointment: any): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Cancelar Cita',
      message: '¿Está seguro de cancelar esta cita?',
      inputs: [
        {
          name: 'reason',
          type: 'textarea',
          placeholder: 'Motivo de cancelación (opcional)'
        }
      ],
      buttons: [
        { text: 'No', role: 'cancel' },
        {
          text: 'Sí, Cancelar',
          handler: (data) => {
            this.store.dispatch(AppointmentsActions.cancelAppointment({
              id: appointment.id,
              reason: data.reason || ''
            }));
          }
        }
      ]
    });
    await alert.present();
  }

  async completeAppointment(appointment: any): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Completar Cita',
      message: '¿Marcar esta cita como completada?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Completar',
          handler: () => {
            this.store.dispatch(AppointmentsActions.completeAppointment({ id: appointment.id }));
          }
        }
      ]
    });
    await alert.present();
  }

  async confirmDelete(appointment: any): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Eliminar Cita',
      message: '¿Está seguro de eliminar esta cita? Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.store.dispatch(AppointmentsActions.deleteAppointment({ id: appointment.id }));
          }
        }
      ]
    });
    await alert.present();
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  formatTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    });
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
