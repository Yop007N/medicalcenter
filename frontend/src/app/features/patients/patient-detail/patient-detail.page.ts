import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { firstValueFrom, take } from 'rxjs';
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
  IonSkeletonText,
  IonSegment,
  IonSegmentButton,
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
  cardOutline,
  calendarOutline,
  documentTextOutline,
  personOutline,
  medkitOutline,
  addOutline,
  walletOutline,
  chevronForwardOutline,
  fitnessOutline,
  eyeOutline
} from 'ionicons/icons';
import * as PatientsActions from '../../../store/patients/patients.actions';
import { selectSelectedPatient, selectPatientsLoading } from '../../../store/patients/patients.selectors';
import { selectUser } from '../../../store/auth/auth.selectors';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { User } from '../../../models';

interface AppointmentSummary {
  id: number;
  appointment_date: string;
  appointment_type: string;
  status: string;
  professional_id?: number;
}

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
    IonSkeletonText,
    IonSegment,
    IonSegmentButton,
    IonRefresher,
    IonRefresherContent
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/patients"></ion-back-button>
        </ion-buttons>
        <ion-title>Detalle Paciente</ion-title>
        <ion-buttons slot="end">
          @if (patient$ | async; as patient) {
            <!-- Mobile: solo iconos -->
            <ion-button [routerLink]="['/patients', patient.id, 'edit']" class="hide-desktop">
              <ion-icon slot="icon-only" name="create-outline"></ion-icon>
            </ion-button>
            <ion-button color="danger" (click)="confirmDelete(patient)" class="hide-desktop">
              <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
            </ion-button>
            <!-- Desktop: con texto -->
            <ion-button [routerLink]="['/patients', patient.id, 'edit']" fill="outline" class="hide-mobile">
              <ion-icon slot="start" name="create-outline"></ion-icon>
              Editar
            </ion-button>
            <ion-button color="danger" fill="outline" (click)="confirmDelete(patient)" class="hide-mobile">
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
        <div class="detail-page-container">
          <ion-card>
            <ion-card-header>
              <ion-skeleton-text [animated]="true" style="width: 60%"></ion-skeleton-text>
              <ion-skeleton-text [animated]="true" style="width: 40%"></ion-skeleton-text>
            </ion-card-header>
            <ion-card-content>
              <ion-skeleton-text [animated]="true" style="width: 100%"></ion-skeleton-text>
              <ion-skeleton-text [animated]="true" style="width: 80%"></ion-skeleton-text>
            </ion-card-content>
          </ion-card>
        </div>
      } @else if (patient$ | async; as patient) {
        <div class="detail-page-container">
          <div class="detail-layout">
            <!-- Main Column -->
            <div class="detail-layout__main">
              <!-- Patient Header Card -->
              <ion-card class="header-card">
                <ion-card-header>
                  <ion-card-title>
                    {{ patient.first_name }} {{ patient.last_name }}
                  </ion-card-title>
                  <ion-card-subtitle>
                    <ion-badge [color]="patient.is_active ? 'success' : 'medium'">
                      {{ patient.is_active ? 'Activo' : 'Inactivo' }}
                    </ion-badge>
                  </ion-card-subtitle>
                </ion-card-header>
                <ion-card-content>
                  <div class="detail-info-grid">
                    <div class="detail-info-item">
                      <ion-icon name="mail-outline" color="primary"></ion-icon>
                      <div class="detail-info-item__content">
                        <span class="detail-info-item__label">Email</span>
                        <span class="detail-info-item__value">{{ patient.email }}</span>
                      </div>
                    </div>

                    @if (patient.phone) {
                      <div class="detail-info-item">
                        <ion-icon name="call-outline" color="success"></ion-icon>
                        <div class="detail-info-item__content">
                          <span class="detail-info-item__label">Teléfono</span>
                          <span class="detail-info-item__value">{{ patient.phone }}</span>
                        </div>
                      </div>
                    }

                    @if (patient.document_number) {
                      <div class="detail-info-item">
                        <ion-icon name="card-outline" color="tertiary"></ion-icon>
                        <div class="detail-info-item__content">
                          <span class="detail-info-item__label">{{ patient.document_type || 'Documento' }}</span>
                          <span class="detail-info-item__value">{{ patient.document_number }}</span>
                        </div>
                      </div>
                    }

                    @if (patient.date_of_birth) {
                      <div class="detail-info-item">
                        <ion-icon name="calendar-outline" color="warning"></ion-icon>
                        <div class="detail-info-item__content">
                          <span class="detail-info-item__label">Fecha de Nacimiento</span>
                          <span class="detail-info-item__value">{{ formatDate(patient.date_of_birth) }}</span>
                        </div>
                      </div>
                    }

                    @if (patient.address) {
                      <div class="detail-info-item detail-info-item--full">
                        <ion-icon name="location-outline" color="danger"></ion-icon>
                        <div class="detail-info-item__content">
                          <span class="detail-info-item__label">Dirección</span>
                          <span class="detail-info-item__value">{{ patient.address }}</span>
                        </div>
                      </div>
                    }
                  </div>
                </ion-card-content>
              </ion-card>

              <!-- Insurance & Emergency Contact in Grid -->
              @if (patient.insurance_provider || patient.insurance_number || patient.emergency_contact || patient.emergency_phone) {
                <div class="cards-row">
                  @if (patient.insurance_provider || patient.insurance_number) {
                    <ion-card>
                      <ion-card-header>
                        <ion-card-title>
                          <ion-icon name="medkit-outline"></ion-icon>
                          Obra Social
                        </ion-card-title>
                      </ion-card-header>
                      <ion-card-content>
                        <div class="clinical-info-grid" style="grid-template-columns: 1fr;">
                          @if (patient.insurance_provider) {
                            <div class="clinical-info-item">
                              <span class="clinical-info-item__label">Proveedor</span>
                              <span class="clinical-info-item__value">{{ patient.insurance_provider }}</span>
                            </div>
                          }
                          @if (patient.insurance_number) {
                            <div class="clinical-info-item">
                              <span class="clinical-info-item__label">Número de Afiliado</span>
                              <span class="clinical-info-item__value">{{ patient.insurance_number }}</span>
                            </div>
                          }
                        </div>
                      </ion-card-content>
                    </ion-card>
                  }

                  @if (patient.emergency_contact || patient.emergency_phone) {
                    <ion-card>
                      <ion-card-header>
                        <ion-card-title>
                          <ion-icon name="person-outline"></ion-icon>
                          Contacto de Emergencia
                        </ion-card-title>
                      </ion-card-header>
                      <ion-card-content>
                        <div class="clinical-info-grid" style="grid-template-columns: 1fr;">
                          @if (patient.emergency_contact) {
                            <div class="clinical-info-item">
                              <span class="clinical-info-item__label">Nombre</span>
                              <span class="clinical-info-item__value">{{ patient.emergency_contact }}</span>
                            </div>
                          }
                          @if (patient.emergency_phone) {
                            <div class="clinical-info-item">
                              <span class="clinical-info-item__label">Teléfono</span>
                              <span class="clinical-info-item__value">{{ patient.emergency_phone }}</span>
                            </div>
                          }
                        </div>
                      </ion-card-content>
                    </ion-card>
                  }
                </div>
              }

              <!-- Notes Card -->
              @if (patient.notes) {
                <ion-card>
                  <ion-card-header>
                    <ion-card-title>Notas</ion-card-title>
                  </ion-card-header>
                  <ion-card-content>
                    <p class="text-content">{{ patient.notes }}</p>
                  </ion-card-content>
                </ion-card>
              }
            </div>

            <!-- Side Column -->
            <div class="detail-layout__side">
              <!-- Tabs Section in Side Column on Desktop -->
              <ion-segment [(ngModel)]="selectedSegment" (ionChange)="segmentChanged($event)" [scrollable]="true" class="segment-tabs">
                <ion-segment-button value="appointments">
                  <ion-label>Citas</ion-label>
                </ion-segment-button>
                <ion-segment-button value="odontology">
                  <ion-label>Odontología</ion-label>
                </ion-segment-button>
                <ion-segment-button value="history">
                  <ion-label>Historial</ion-label>
                </ion-segment-button>
                <ion-segment-button value="budgets">
                  <ion-label>Presupuestos</ion-label>
                </ion-segment-button>
              </ion-segment>

        @if (selectedSegment === 'appointments') {
          <ion-card>
            <ion-card-header>
              <ion-card-title>Próximas Citas</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              @if (appointments.length > 0) {
                <ion-list>
                  @for (apt of appointments; track apt.id) {
                    <ion-item>
                      <ion-icon name="calendar-outline" slot="start"></ion-icon>
                      <ion-label>
                        <h3>{{ formatDateTime(apt.appointment_date) }}</h3>
                        <p>{{ apt.appointment_type }}</p>
                      </ion-label>
                      <ion-badge slot="end" [color]="getStatusColor(apt.status)">
                        {{ apt.status }}
                      </ion-badge>
                    </ion-item>
                  }
                </ion-list>
              } @else {
                <p class="ion-text-center">No hay citas programadas</p>
              }
            </ion-card-content>
          </ion-card>
        }

        @if (selectedSegment === 'odontology') {
          <!-- Odontogram Card -->
          <ion-card>
            <ion-card-header>
              <div class="card-header-with-action">
                <ion-card-title>
                  <ion-icon name="fitness-outline"></ion-icon>
                  Odontograma
                </ion-card-title>
                @if (!odontogram) {
                  <ion-button size="small" (click)="createOdontogram()">
                    <ion-icon slot="start" name="add-outline"></ion-icon>
                    Crear
                  </ion-button>
                } @else {
                  <ion-button size="small" [routerLink]="['/odontology/odontogram', odontogram.id]">
                    <ion-icon slot="start" name="eye-outline"></ion-icon>
                    Ver Completo
                  </ion-button>
                }
              </div>
            </ion-card-header>
            <ion-card-content>
              @if (loadingOdontology) {
                <ion-skeleton-text [animated]="true" style="width: 100%; height: 100px"></ion-skeleton-text>
              } @else if (odontogram) {
                <div class="odontogram-summary">
                  <div class="teeth-summary">
                    <div class="summary-item">
                      <span class="count">{{ getTeethCount('healthy') }}</span>
                      <span class="label">Sanos</span>
                    </div>
                    <div class="summary-item warning">
                      <span class="count">{{ getTeethCount('caries') }}</span>
                      <span class="label">Con caries</span>
                    </div>
                    <div class="summary-item success">
                      <span class="count">{{ getTeethCount('filled') }}</span>
                      <span class="label">Restaurados</span>
                    </div>
                    <div class="summary-item danger">
                      <span class="count">{{ getTeethCount('missing') + getTeethCount('extracted') }}</span>
                      <span class="label">Ausentes</span>
                    </div>
                  </div>
                  <p class="last-update">
                    Última actualización: {{ formatDate(odontogram.updated_at) }}
                  </p>
                </div>
              } @else {
                <div class="empty-state">
                  <ion-icon name="fitness-outline"></ion-icon>
                  <p>No hay odontograma registrado</p>
                  <ion-button size="small" (click)="createOdontogram()">
                    Crear Odontograma
                  </ion-button>
                </div>
              }
            </ion-card-content>
          </ion-card>

          <!-- Dental Treatments Card -->
          <ion-card>
            <ion-card-header>
              <div class="card-header-with-action">
                <ion-card-title>
                  <ion-icon name="medkit-outline"></ion-icon>
                  Tratamientos Dentales
                </ion-card-title>
                <ion-button size="small" [routerLink]="['/odontology/treatments/new']" [queryParams]="{patient_id: patientId}">
                  <ion-icon slot="start" name="add-outline"></ion-icon>
                  Nuevo
                </ion-button>
              </div>
            </ion-card-header>
            <ion-card-content>
              @if (loadingOdontology) {
                <ion-skeleton-text [animated]="true" style="width: 100%"></ion-skeleton-text>
                <ion-skeleton-text [animated]="true" style="width: 80%"></ion-skeleton-text>
              } @else if (dentalTreatments.length > 0) {
                <ion-list>
                  @for (treatment of dentalTreatments; track treatment.id) {
                    <ion-item button [routerLink]="['/odontology/treatments', treatment.id]" detail="true">
                      <ion-icon name="medkit-outline" slot="start" [color]="getTreatmentStatusColor(treatment.status)"></ion-icon>
                      <ion-label>
                        <h3>{{ getTreatmentTypeLabel(treatment.treatment_type) }}</h3>
                        <p>
                          @if (treatment.affected_teeth && treatment.affected_teeth.length > 0) {
                            Dientes: {{ treatment.affected_teeth.join(', ') }}
                          }
                          @if (treatment.treatment_date) {
                            - {{ formatDate(treatment.treatment_date) }}
                          }
                        </p>
                      </ion-label>
                      <ion-badge slot="end" [color]="getTreatmentStatusColor(treatment.status)">
                        {{ getTreatmentStatusLabel(treatment.status) }}
                      </ion-badge>
                    </ion-item>
                  }
                </ion-list>
                @if (dentalTreatments.length >= 5) {
                  <ion-button expand="block" fill="clear" [routerLink]="['/odontology/treatments']" [queryParams]="{patient_id: patientId}">
                    Ver todos los tratamientos
                    <ion-icon slot="end" name="chevron-forward-outline"></ion-icon>
                  </ion-button>
                }
              } @else {
                <div class="empty-state">
                  <ion-icon name="medkit-outline"></ion-icon>
                  <p>No hay tratamientos registrados</p>
                  <ion-button size="small" [routerLink]="['/odontology/treatments/new']" [queryParams]="{patient_id: patientId}">
                    Crear Tratamiento
                  </ion-button>
                </div>
              }
            </ion-card-content>
          </ion-card>
        }

        @if (selectedSegment === 'history') {
          <ion-card>
            <ion-card-header>
              <ion-card-title>Historial Médico</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              @if (medicalRecords.length > 0) {
                <ion-list>
                  @for (record of medicalRecords; track record.id) {
                    <ion-item>
                      <ion-icon name="document-text-outline" slot="start"></ion-icon>
                      <ion-label>
                        <h3>{{ formatDate(record.record_date) }}</h3>
                        <p>{{ record.diagnosis || 'Sin diagnóstico' }}</p>
                      </ion-label>
                    </ion-item>
                  }
                </ion-list>
              } @else {
                <p class="ion-text-center">No hay registros médicos</p>
              }
            </ion-card-content>
          </ion-card>
        }

        @if (selectedSegment === 'budgets') {
          <ion-card>
            <ion-card-header>
              <div class="card-header-with-action">
                <ion-card-title>
                  <ion-icon name="wallet-outline"></ion-icon>
                  Presupuestos
                </ion-card-title>
                <ion-button size="small" [routerLink]="['/budgets/new']" [queryParams]="{patient_id: patientId}">
                  <ion-icon slot="start" name="add-outline"></ion-icon>
                  Nuevo
                </ion-button>
              </div>
            </ion-card-header>
            <ion-card-content>
              @if (budgets.length > 0) {
                <ion-list>
                  @for (budget of budgets; track budget.id) {
                    <ion-item button [routerLink]="['/budgets', budget.id]" detail="true">
                      <ion-icon name="wallet-outline" slot="start" [color]="getBudgetStatusColor(budget.status)"></ion-icon>
                      <ion-label>
                        <h3>{{ budget.title || 'Presupuesto #' + budget.id }}</h3>
                        <p class="budget-amounts">
                          <span class="total">Total: {{ formatCurrency(budget.total_amount, budget.currency) }}</span>
                          @if (budget.total_paid !== undefined) {
                            <span class="paid">Pagado: {{ formatCurrency(budget.total_paid, budget.currency) }}</span>
                          }
                        </p>
                        @if (budget.total_paid !== undefined && budget.total_amount > 0) {
                          <div class="progress-bar">
                            <div class="progress-fill" [style.width.%]="getPaymentProgress(budget)"></div>
                          </div>
                          <p class="payment-status">
                            @if (budget.total_paid >= budget.total_amount) {
                              <span class="completed">Pagado completo</span>
                            } @else {
                              <span class="pending">Pendiente: {{ formatCurrency(budget.total_amount - budget.total_paid, budget.currency) }}</span>
                            }
                          </p>
                        }
                      </ion-label>
                      <ion-badge slot="end" [color]="getBudgetStatusColor(budget.status)">
                        {{ getBudgetStatusLabel(budget.status) }}
                      </ion-badge>
                    </ion-item>
                  }
                </ion-list>
              } @else {
                <div class="empty-state">
                  <ion-icon name="wallet-outline"></ion-icon>
                  <p>No hay presupuestos</p>
                  <ion-button size="small" [routerLink]="['/budgets/new']" [queryParams]="{patient_id: patientId}">
                    Crear Presupuesto
                  </ion-button>
                </div>
              }
            </ion-card-content>
          </ion-card>
        }
            </div>
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

    .segment-tabs {
      margin: 0 0 16px;
    }

    ion-list ion-item h3 {
      font-weight: 500;
    }

    ion-list ion-item p {
      color: var(--ion-color-medium);
      font-size: 12px;
    }

    .budget-amounts {
      display: flex;
      gap: 16px;
      margin-top: 4px;
    }

    .budget-amounts .total {
      font-weight: 500;
      color: var(--ion-color-dark);
    }

    .budget-amounts .paid {
      color: var(--ion-color-success);
    }

    .progress-bar {
      height: 6px;
      background: var(--ion-color-light);
      border-radius: 3px;
      margin: 8px 0;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: var(--ion-color-success);
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .payment-status {
      font-size: 11px;
      margin: 0;
    }

    .payment-status .completed {
      color: var(--ion-color-success);
      font-weight: 500;
    }

    .payment-status .pending {
      color: var(--ion-color-warning);
    }

    .empty-state {
      text-align: center;
      padding: 24px;
    }

    .empty-state ion-icon {
      font-size: 48px;
      color: var(--ion-color-medium);
    }

    .empty-state p {
      margin: 12px 0;
      color: var(--ion-color-medium);
    }

    .odontogram-summary {
      padding: 8px 0;
    }

    .teeth-summary {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      text-align: center;
    }

    @media (min-width: 576px) {
      .teeth-summary {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .summary-item {
      background: var(--ion-color-light);
      border-radius: 8px;
      padding: 12px 8px;
    }

    .summary-item .count {
      display: block;
      font-size: 24px;
      font-weight: 700;
      color: var(--ion-color-primary);
    }

    .summary-item .label {
      display: block;
      font-size: 11px;
      color: var(--ion-color-medium);
      margin-top: 4px;
    }

    .summary-item.warning .count {
      color: var(--ion-color-warning);
    }

    .summary-item.success .count {
      color: var(--ion-color-success);
    }

    .summary-item.danger .count {
      color: var(--ion-color-danger);
    }

    .last-update {
      text-align: center;
      font-size: 12px;
      color: var(--ion-color-medium);
      margin-top: 16px;
      margin-bottom: 0;
    }
  `]
})
export class PatientDetailPage implements OnInit {
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private alertController = inject(AlertController);
  private http = inject(HttpClient);

  patient$ = this.store.select(selectSelectedPatient);
  loading$ = this.store.select(selectPatientsLoading);

  selectedSegment = 'appointments';
  appointments: AppointmentSummary[] = [];
  medicalRecords: any[] = [];
  budgets: any[] = [];
  patientId: number | null = null;

  // Odontology data
  odontogram: any = null;
  dentalTreatments: any[] = [];
  loadingOdontology = false;

  constructor() {
    addIcons({
      createOutline,
      trashOutline,
      callOutline,
      mailOutline,
      locationOutline,
      cardOutline,
      calendarOutline,
      documentTextOutline,
      personOutline,
      medkitOutline,
      addOutline,
      walletOutline,
      chevronForwardOutline,
      fitnessOutline,
      eyeOutline
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.patientId = parseInt(idParam, 10);
      this.store.dispatch(PatientsActions.loadPatient({ id: this.patientId }));
      this.loadAppointments();
    }
  }

  onRefresh(event: any): void {
    if (this.patientId) {
      this.store.dispatch(PatientsActions.loadPatient({ id: this.patientId }));
      this.loadAppointments();
    }
    setTimeout(() => event.target.complete(), 1000);
  }

  segmentChanged(event: any): void {
    this.selectedSegment = event.detail.value;
    if (this.patientId) {
      if (this.selectedSegment === 'appointments' && this.appointments.length === 0) {
        this.loadAppointments();
      } else if (this.selectedSegment === 'history' && this.medicalRecords.length === 0) {
        this.loadMedicalRecords();
      } else if (this.selectedSegment === 'budgets' && this.budgets.length === 0) {
        this.loadBudgets();
      } else if (this.selectedSegment === 'odontology' && !this.odontogram) {
        this.loadOdontologyData();
      }
    }
  }

  loadAppointments(): void {
    this.http.get<unknown>(`${environment.apiUrl}/patients/${this.patientId}/appointments`)
      .subscribe({
        next: (data) => this.appointments = this.normalizeAppointments(data),
        error: () => this.appointments = []
      });
  }

  loadMedicalRecords(): void {
    this.http.get<any[]>(`${environment.apiUrl}/patients/${this.patientId}/medical-records`)
      .subscribe({
        next: (data) => this.medicalRecords = data,
        error: () => this.medicalRecords = []
      });
  }

  loadBudgets(): void {
    this.http.get<any[]>(`${environment.apiUrl}/patients/${this.patientId}/budgets`)
      .subscribe({
        next: (data) => this.budgets = data,
        error: () => this.budgets = []
      });
  }

  loadOdontologyData(): void {
    this.loadingOdontology = true;

    // Load odontograms for this patient
    this.http.get<any[]>(`${environment.apiUrl}/odontograms`, {
      params: { patient_id: this.patientId!.toString() }
    }).subscribe({
      next: (odontograms) => {
        // Get active odontogram or the first one
        this.odontogram = odontograms.find(o => o.is_active) || odontograms[0] || null;
        this.loadingOdontology = false;
      },
      error: () => {
        this.odontogram = null;
        this.loadingOdontology = false;
      }
    });

    // Load dental treatments for this patient
    this.http.get<any>(`${environment.apiUrl}/dental-treatments`, {
      params: { patient_id: this.patientId!.toString() }
    }).subscribe({
      next: (response) => {
        this.dentalTreatments = response?.items || response || [];
      },
      error: () => {
        this.dentalTreatments = [];
      }
    });
  }

  async createOdontogram(): Promise<void> {
    const patient = await firstValueFrom(this.patient$.pipe(take(1)));
    const currentUser = await firstValueFrom(this.store.select(selectUser).pipe(take(1)));
    if (!patient) {
      return;
    }

    const professionalId = this.resolveProfessionalId(currentUser);
    if (!professionalId) {
      console.error('Cannot create odontogram without a professional_id');
      return;
    }

    const odontogramData = {
      patient_id: patient.id,
      professional_id: professionalId,
      is_active: true
    };
    this.http.post<any>(`${environment.apiUrl}/odontograms`, odontogramData)
      .subscribe({
        next: (odontogram) => {
          this.odontogram = odontogram;
        },
        error: (err) => {
          console.error('Error creating odontogram:', err);
        }
      });
  }

  private normalizeAppointments(data: unknown): AppointmentSummary[] {
    if (!Array.isArray(data)) {
      return [];
    }

    return data
      .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
      .map((item) => ({
        id: Number(item['id']),
        appointment_date: typeof item['appointment_date'] === 'string' ? item['appointment_date'] : '',
        appointment_type: typeof item['appointment_type'] === 'string' ? item['appointment_type'] : '',
        status: typeof item['status'] === 'string' ? item['status'] : '',
        professional_id: typeof item['professional_id'] === 'number' ? item['professional_id'] : undefined,
      }))
      .filter((item) => Number.isFinite(item.id));
  }

  private resolveProfessionalId(user: User | null): number | null {
    if (user?.role === 'professional' && Number.isFinite(user.id)) {
      return user.id;
    }

    const fromAppointments = this.appointments.find((appointment) => Number.isFinite(appointment.professional_id))?.professional_id;
    return typeof fromAppointments === 'number' ? fromAppointments : null;
  }

  getTeethCount(status: string): number {
    if (!this.odontogram?.teeth) return 0;
    return this.odontogram.teeth.filter((t: any) => t.status === status).length;
  }

  getTreatmentTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'filling': 'Obturación',
      'root_canal': 'Endodoncia',
      'extraction': 'Extracción',
      'cleaning': 'Limpieza',
      'crown': 'Corona',
      'implant': 'Implante',
      'orthodontics': 'Ortodoncia',
      'whitening': 'Blanqueamiento',
      'veneer': 'Carilla',
      'bridge': 'Puente',
      'denture': 'Prótesis',
      'scaling': 'Raspado',
      'surgery': 'Cirugía',
      'consultation': 'Consulta',
      'emergency': 'Emergencia'
    };
    return labels[type] || type;
  }

  getTreatmentStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'planned': 'Planificado',
      'in_progress': 'En Progreso',
      'completed': 'Completado',
      'cancelled': 'Cancelado',
      'postponed': 'Pospuesto'
    };
    return labels[status] || status;
  }

  getTreatmentStatusColor(status: string): string {
    switch (status) {
      case 'planned': return 'warning';
      case 'in_progress': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      case 'postponed': return 'medium';
      default: return 'medium';
    }
  }

  async confirmDelete(patient: any): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: `¿Está seguro de eliminar a ${patient.first_name} ${patient.last_name}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.store.dispatch(PatientsActions.deletePatient({ id: patient.id }));
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
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number, currency: string = 'ARS'): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency || 'ARS'
    }).format(amount || 0);
  }

  getPaymentProgress(budget: any): number {
    if (!budget.total_amount || budget.total_amount === 0) return 0;
    const progress = ((budget.total_paid || 0) / budget.total_amount) * 100;
    return Math.min(progress, 100);
  }

  getBudgetStatusLabel(status: string): string {
    switch (status) {
      case 'draft': return 'Borrador';
      case 'sent': return 'Enviado';
      case 'accepted': return 'Aceptado';
      case 'rejected': return 'Rechazado';
      case 'expired': return 'Expirado';
      default: return status;
    }
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

  getBudgetStatusColor(status: string): string {
    switch (status) {
      case 'draft': return 'medium';
      case 'sent': return 'warning';
      case 'accepted': return 'success';
      case 'rejected': return 'danger';
      default: return 'medium';
    }
  }
}
