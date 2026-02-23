import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject, takeUntil, filter } from 'rxjs';
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
  IonBadge,
  IonChip,
  IonSpinner,
  IonText,
  IonRefresher,
  IonRefresherContent,
  AlertController,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  createOutline,
  trashOutline,
  personOutline,
  calendarOutline,
  timeOutline,
  medkitOutline,
  cashOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  documentTextOutline
} from 'ionicons/icons';
import * as OdontologyActions from '../../../store/odontology/odontology.actions';
import {
  selectSelectedTreatment,
  selectOdontologyLoading,
  selectOdontologyError,
  selectActiveOdontogram
} from '../../../store/odontology/odontology.selectors';
import { TREATMENT_TYPES, DentalTreatment, ToothUpdate } from '../../../models/odontology.model';
import { OdontogramChartComponent } from '../components/odontogram-chart/odontogram-chart.component';
import { ToothImageData } from '../odontogram/tooth-image.component';
import { ToothActionModalComponent } from '../components/tooth-action-modal/tooth-action-modal.component';

@Component({
  selector: 'app-treatment-detail',
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
    IonBadge,
    IonChip,
    IonSpinner,
    IonText,
    IonRefresher,
    IonRefresherContent,
    OdontogramChartComponent
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/odontology/treatments"></ion-back-button>
        </ion-buttons>
        <ion-title>Detalle del Tratamiento</ion-title>
        <ion-buttons slot="end">
          @if (treatment$ | async; as treatment) {
            <!-- Mobile: solo iconos -->
            <ion-button [routerLink]="['/odontology/treatments', treatment.id, 'edit']" class="hide-desktop">
              <ion-icon slot="icon-only" name="create-outline"></ion-icon>
            </ion-button>
            <ion-button color="danger" (click)="confirmDelete(treatment)" class="hide-desktop">
              <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
            </ion-button>
            <!-- Desktop: con texto -->
            <ion-button [routerLink]="['/odontology/treatments', treatment.id, 'edit']" fill="outline" class="hide-mobile">
              <ion-icon slot="start" name="create-outline"></ion-icon>
              Editar
            </ion-button>
            <ion-button color="danger" fill="outline" (click)="confirmDelete(treatment)" class="hide-mobile">
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
        <div class="ion-text-center ion-padding">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Cargando tratamiento...</p>
        </div>
      } @else if (error$ | async; as error) {
        <div class="ion-text-center ion-padding">
          <ion-text color="danger">
            <p>{{ error }}</p>
          </ion-text>
        </div>
      } @else if (treatment$ | async; as treatment) {
        <div class="desktop-layout">
          <!-- Main Column -->
          <div class="column-main">
            <!-- Header Card -->
            <ion-card>
              <ion-card-header>
                <ion-card-title>
                  <ion-icon name="medkit-outline"></ion-icon>
                  {{ getTreatmentLabel(treatment.treatment_type) }}
                </ion-card-title>
                <ion-card-subtitle>
                  <ion-badge [color]="getStatusColor(treatment.status)">
                    {{ getStatusLabel(treatment.status) }}
                  </ion-badge>
                </ion-card-subtitle>
              </ion-card-header>
              <ion-card-content>
                <div class="info-grid">
                  <div class="info-item">
                    <ion-icon name="calendar-outline" color="primary"></ion-icon>
                    <div class="info-content">
                      <span class="info-label">Fecha del Tratamiento</span>
                      <span class="info-value">{{ treatment.treatment_date | date:'dd/MM/yyyy' }}</span>
                    </div>
                  </div>
                  @if (treatment.duration_minutes) {
                    <div class="info-item">
                      <ion-icon name="time-outline" color="tertiary"></ion-icon>
                      <div class="info-content">
                        <span class="info-label">Duración</span>
                        <span class="info-value">{{ treatment.duration_minutes }} minutos</span>
                      </div>
                    </div>
                  }
                  @if (treatment.patient) {
                    <div class="info-item clickable" [routerLink]="['/patients', treatment.patient.id]">
                      <ion-icon name="person-outline" color="success"></ion-icon>
                      <div class="info-content">
                        <span class="info-label">Paciente</span>
                        <span class="info-value">{{ treatment.patient.first_name }} {{ treatment.patient.last_name }}</span>
                      </div>
                    </div>
                  } @else {
                    <div class="info-item">
                      <ion-icon name="person-outline" color="medium"></ion-icon>
                      <div class="info-content">
                        <span class="info-label">Paciente</span>
                        <span class="info-value">ID: {{ treatment.patient_id }}</span>
                      </div>
                    </div>
                  }
                  @if (treatment.sessions_required) {
                    <div class="info-item">
                      <ion-icon name="document-text-outline" color="warning"></ion-icon>
                      <div class="info-content">
                        <span class="info-label">Sesiones</span>
                        <span class="info-value">{{ treatment.session_number || 1 }} de {{ treatment.sessions_required }}</span>
                      </div>
                    </div>
                  }
                </div>
              </ion-card-content>
            </ion-card>

            <!-- Odontogram Card -->
            <ion-card>
              <ion-card-header>
                <ion-card-title>Odontograma del Paciente</ion-card-title>
                <ion-card-subtitle>Toque un diente para editar su estado</ion-card-subtitle>
              </ion-card-header>
              <ion-card-content>
                @if (activeOdontogram$ | async) {
                  <app-odontogram-chart
                    [teethData]="teethData"
                    [readOnly]="false"
                    [selectedToothNumber]="null"
                    (toothClick)="onToothClick($event)"
                  ></app-odontogram-chart>
                } @else {
                  <div class="ion-text-center ion-padding">
                    <p>No hay odontograma activo para este paciente.</p>
                  </div>
                }
              </ion-card-content>
            </ion-card>

            <!-- Treatment Details & Affected Teeth Grid -->
            <div class="cards-grid">
              <!-- Treatment Details -->
              <ion-card>
                <ion-card-header>
                  <ion-card-title>Detalles del Tratamiento</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <div class="detail-grid">
                    @if (treatment.description) {
                      <div class="detail-item full-width">
                        <span class="detail-label">Descripción</span>
                        <span class="detail-value">{{ treatment.description }}</span>
                      </div>
                    }
                    @if (treatment.technique) {
                      <div class="detail-item">
                        <span class="detail-label">Técnica</span>
                        <span class="detail-value">{{ treatment.technique }}</span>
                      </div>
                    }
                    @if (treatment.anesthesia_type) {
                      <div class="detail-item">
                        <span class="detail-label">Anestesia</span>
                        <span class="detail-value">{{ getAnesthesiaLabel(treatment.anesthesia_type) }}</span>
                      </div>
                    }
                    @if (treatment.materials_used && treatment.materials_used.length > 0) {
                      <div class="detail-item full-width">
                        <span class="detail-label">Materiales Utilizados</span>
                        <div class="materials-list">
                          @for (material of treatment.materials_used; track material) {
                            <ion-chip>{{ material }}</ion-chip>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </ion-card-content>
              </ion-card>

              <!-- Affected Teeth & Costs -->
              <div class="stacked-cards">
                @if (treatment.affected_teeth && treatment.affected_teeth.length > 0) {
                  <ion-card>
                    <ion-card-header>
                      <ion-card-title>Dientes Afectados</ion-card-title>
                    </ion-card-header>
                    <ion-card-content>
                      <div class="teeth-chips">
                        @for (tooth of treatment.affected_teeth; track tooth) {
                          <ion-chip color="primary">{{ tooth }}</ion-chip>
                        }
                      </div>
                    </ion-card-content>
                  </ion-card>
                }

                @if (treatment.estimated_cost || treatment.final_cost) {
                  <ion-card>
                    <ion-card-header>
                      <ion-card-title>
                        <ion-icon name="cash-outline"></ion-icon>
                        Costos
                      </ion-card-title>
                    </ion-card-header>
                    <ion-card-content>
                      <div class="cost-grid">
                        @if (treatment.estimated_cost) {
                          <div class="cost-item">
                            <span class="cost-label">Estimado</span>
                            <span class="cost-value">{{ formatCurrency(treatment.estimated_cost) }}</span>
                          </div>
                        }
                        @if (treatment.final_cost) {
                          <div class="cost-item">
                            <span class="cost-label">Final</span>
                            <span class="cost-value highlight">{{ formatCurrency(treatment.final_cost) }}</span>
                          </div>
                        }
                        @if (treatment.insurance_covered) {
                          <div class="cost-item">
                            <span class="cost-label">Seguro</span>
                            <span class="cost-value">{{ formatCurrency(treatment.insurance_covered) }}</span>
                          </div>
                        }
                        @if (treatment.patient_payment) {
                          <div class="cost-item">
                            <span class="cost-label">Paciente</span>
                            <span class="cost-value">{{ formatCurrency(treatment.patient_payment) }}</span>
                          </div>
                        }
                      </div>
                    </ion-card-content>
                  </ion-card>
                }
              </div>
            </div>

            <!-- Notes -->
            @if (treatment.pre_treatment_notes || treatment.post_treatment_notes || treatment.care_instructions || treatment.complications) {
              <ion-card>
                <ion-card-header>
                  <ion-card-title>Notas</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <div class="notes-grid">
                    @if (treatment.pre_treatment_notes) {
                      <div class="note-item">
                        <span class="note-label">Notas Pre-Tratamiento</span>
                        <span class="note-value">{{ treatment.pre_treatment_notes }}</span>
                      </div>
                    }
                    @if (treatment.post_treatment_notes) {
                      <div class="note-item">
                        <span class="note-label">Notas Post-Tratamiento</span>
                        <span class="note-value">{{ treatment.post_treatment_notes }}</span>
                      </div>
                    }
                    @if (treatment.care_instructions) {
                      <div class="note-item">
                        <span class="note-label">Instrucciones de Cuidado</span>
                        <span class="note-value">{{ treatment.care_instructions }}</span>
                      </div>
                    }
                    @if (treatment.complications) {
                      <div class="note-item danger">
                        <span class="note-label">Complicaciones</span>
                        <span class="note-value">{{ treatment.complications }}</span>
                      </div>
                    }
                  </div>
                </ion-card-content>
              </ion-card>
            }
          </div>

          <!-- Side Column - Actions -->
          <div class="column-side">
            @if (treatment.status !== 'completed' && treatment.status !== 'cancelled') {
              <ion-card class="actions-card">
                <ion-card-header>
                  <ion-card-title>Acciones</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <ion-button expand="block" color="success" (click)="completeTreatment(treatment)">
                    <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
                    Completar
                  </ion-button>
                  <ion-button expand="block" color="danger" fill="outline" (click)="cancelTreatment(treatment)">
                    <ion-icon name="close-circle-outline" slot="start"></ion-icon>
                    Cancelar
                  </ion-button>
                </ion-card-content>
              </ion-card>
            }
          </div>
        </div>
      }
    </ion-content>
  `,
  styles: [`
    ion-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
    }

    ion-card-subtitle {
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

    .info-item.clickable {
      cursor: pointer;
    }

    .info-item.clickable:hover .info-value {
      color: var(--ion-color-primary);
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

    /* Cards Grid */
    .cards-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0;
    }

    .stacked-cards {
      display: flex;
      flex-direction: column;
    }

    .stacked-cards ion-card {
      margin-top: 0;
    }

    /* Detail Grid */
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .detail-label {
      font-size: 12px;
      color: var(--ion-color-medium);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .detail-value {
      font-size: 15px;
      color: var(--ion-text-color);
      white-space: pre-wrap;
    }

    /* Cost Grid */
    .cost-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .cost-item {
      display: flex;
      flex-direction: column;
      padding: 12px;
      background: var(--ion-color-light);
      border-radius: 8px;
      text-align: center;
    }

    .cost-label {
      font-size: 11px;
      color: var(--ion-color-medium);
      text-transform: uppercase;
    }

    .cost-value {
      font-size: 15px;
      font-weight: 600;
    }

    .cost-value.highlight {
      color: var(--ion-color-success);
    }

    /* Notes Grid */
    .notes-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .note-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 12px;
      background: var(--ion-color-light);
      border-radius: 8px;
    }

    .note-item.danger {
      background: rgba(var(--ion-color-danger-rgb), 0.1);
    }

    .note-item.danger .note-label {
      color: var(--ion-color-danger);
    }

    .note-label {
      font-size: 12px;
      color: var(--ion-color-medium);
      font-weight: 500;
    }

    .note-value {
      font-size: 14px;
      white-space: pre-wrap;
    }

    .teeth-chips, .materials-list {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
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

      .info-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .cards-grid {
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }

      .cards-grid ion-card {
        margin: 0;
      }

      .detail-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .detail-item.full-width {
        grid-column: 1 / -1;
      }

      .notes-grid {
        grid-template-columns: repeat(2, 1fr);
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
export class TreatmentDetailPage implements OnInit, OnDestroy {
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private alertController = inject(AlertController);
  private modalController = inject(ModalController);
  private destroy$ = new Subject<void>();

  treatment$ = this.store.select(selectSelectedTreatment);
  loading$ = this.store.select(selectOdontologyLoading);
  error$ = this.store.select(selectOdontologyError);
  activeOdontogram$ = this.store.select(selectActiveOdontogram);

  treatmentId: number | null = null;
  teethData: Map<number, ToothImageData> = new Map();
  currentOdontogramId: number | null = null;

  constructor() {
    addIcons({
      createOutline,
      trashOutline,
      personOutline,
      calendarOutline,
      timeOutline,
      medkitOutline,
      cashOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      documentTextOutline
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.treatmentId = parseInt(idParam, 10);
      this.store.dispatch(OdontologyActions.loadDentalTreatment({ id: this.treatmentId }));
    }

    // Load odontograms when treatment is loaded
    this.treatment$
      .pipe(
        takeUntil(this.destroy$),
        filter(t => !!t && !!t.patient_id)
      )
      .subscribe(treatment => {
        if (treatment && treatment.patient_id) {
          this.store.dispatch(OdontologyActions.loadOdontograms({ patientId: treatment.patient_id }));
        }
      });

    // Update teeth data when active odontogram changes
    this.activeOdontogram$
      .pipe(takeUntil(this.destroy$))
      .subscribe(odontogram => {
        if (odontogram) {
          this.currentOdontogramId = odontogram.id;
          if (odontogram.teeth) {
            this.teethData.clear();
            odontogram.teeth.forEach(tooth => {
              this.teethData.set(tooth.tooth_number, {
                number: tooth.tooth_number,
                status: tooth.status,
                notes: tooth.notes || ''
              });
            });
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onRefresh(event: any): void {
    if (this.treatmentId) {
      this.store.dispatch(OdontologyActions.loadDentalTreatment({ id: this.treatmentId }));
    }
    setTimeout(() => event.target.complete(), 1000);
  }

  async onToothClick(tooth: ToothImageData) {
    if (!this.currentOdontogramId) return;

    const modal = await this.modalController.create({
      component: ToothActionModalComponent,
      componentProps: {
        tooth: tooth
      },
      breakpoints: [0, 0.5, 0.8],
      initialBreakpoint: 0.5
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data) {
      const toothUpdate: ToothUpdate = {
        status: data.status,
        notes: data.notes
      };

      this.store.dispatch(OdontologyActions.updateTooth({
        odontogramId: this.currentOdontogramId,
        toothNumber: tooth.number,
        tooth: toothUpdate
      }));
    }
  }

  getTreatmentLabel(type: string): string {
    const found = TREATMENT_TYPES.find(t => t.value === type);
    return found ? found.label : type;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'planned': return 'warning';
      case 'in_progress': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      case 'postponed': return 'medium';
      default: return 'medium';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'planned': return 'Planificado';
      case 'in_progress': return 'En Progreso';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      case 'postponed': return 'Pospuesto';
      default: return status;
    }
  }

  getAnesthesiaLabel(type: string): string {
    switch (type) {
      case 'local': return 'Local';
      case 'regional': return 'Regional';
      case 'general': return 'General';
      case 'sedation': return 'Sedación';
      default: return type || 'Sin anestesia';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount || 0);
  }

  async confirmDelete(treatment: DentalTreatment): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: `¿Está seguro de eliminar este tratamiento de ${this.getTreatmentLabel(treatment.treatment_type)}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.store.dispatch(OdontologyActions.deleteDentalTreatment({ id: treatment.id }));
          }
        }
      ]
    });
    await alert.present();
  }

  async completeTreatment(treatment: DentalTreatment): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Completar Tratamiento',
      message: '¿Marcar este tratamiento como completado?',
      inputs: [
        {
          name: 'notes',
          type: 'textarea',
          placeholder: 'Notas de finalización (opcional)'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Completar',
          handler: (data) => {
            this.store.dispatch(OdontologyActions.updateDentalTreatment({
              id: treatment.id,
              treatment: {
                status: 'completed',
                post_treatment_notes: data.notes || undefined
              }
            }));
          }
        }
      ]
    });
    await alert.present();
  }

  async cancelTreatment(treatment: DentalTreatment): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Cancelar Tratamiento',
      message: '¿Está seguro de cancelar este tratamiento?',
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
          role: 'destructive',
          handler: (data) => {
            this.store.dispatch(OdontologyActions.updateDentalTreatment({
              id: treatment.id,
              treatment: {
                status: 'cancelled',
                post_treatment_notes: data.reason || undefined
              }
            }));
          }
        }
      ]
    });
    await alert.present();
  }
}
