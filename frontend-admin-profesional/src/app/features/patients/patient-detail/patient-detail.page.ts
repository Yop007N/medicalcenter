import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
import {
  AppointmentsApiService,
  BudgetsApiService,
  FilesApiService,
  MedicalRecordsApiService,
  OdontologyApiService
} from '../../../core/services';
import { FileCategory, MedicalFile, formatFileSize, getFileCategoryLabel, getFileIcon } from '../../../models/file.model';
import { User } from '../../../models';

interface AppointmentSummary {
  id: number;
  appointment_date: string;
  appointment_type: string;
  status: string;
  professional_id?: number;
}

type ApiErrorShape = {
  error?: {
    msg?: string;
    message?: string;
    error?: string;
  };
};

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
            <ion-button [routerLink]="['/patients', patient.id, 'edit']" [queryParams]="moduleQueryParams" class="hide-desktop" aria-label="Editar">
              <ion-icon slot="icon-only" name="create-outline"></ion-icon>
            </ion-button>
            <ion-button color="danger" (click)="confirmDelete(patient)" class="hide-desktop" aria-label="Eliminar">
              <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
            </ion-button>
            <!-- Desktop: con texto -->
            <ion-button [routerLink]="['/patients', patient.id, 'edit']" [queryParams]="moduleQueryParams" fill="outline" class="hide-mobile">
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

              <!-- Modules in vertical cards -->
              <div class="modules-stack">
                <!-- Citas -->
                <ion-card class="module-card clickable-card" (click)="openAppointmentsModule()" tabindex="0" role="button">
                  <ion-card-header>
                    <div class="card-header-with-action">
                      <ion-card-title>
                        <ion-icon name="calendar-outline"></ion-icon>
                        Citas
                      </ion-card-title>
                      <ion-badge color="primary">{{ appointments.length }}</ion-badge>
                    </div>
                  </ion-card-header>
                  <ion-card-content>
                    @if (appointments.length > 0) {
                      <ion-list class="compact-list">
                        @for (apt of appointments.slice(0, 3); track apt.id) {
                          <ion-item
                            button
                            [routerLink]="['/appointments', apt.id]"
                            [queryParams]="moduleQueryParams"
                            detail="true"
                            (click)="$event.stopPropagation()"
                          >
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
                      <p class="empty-small">No hay citas registradas para este paciente.</p>
                    }

                    <div class="module-actions">
                      <ion-button size="small" fill="outline" (click)="openAppointmentsModule($event)">
                        Ver módulo
                      </ion-button>
                      <ion-button size="small" (click)="createAppointment($event)">
                        Nueva cita
                      </ion-button>
                    </div>
                  </ion-card-content>
                </ion-card>

                <!-- Odontología -->
                <ion-card class="module-card clickable-card" (click)="openOdontologyModule()" tabindex="0" role="button">
                  <ion-card-header>
                    <div class="card-header-with-action">
                      <ion-card-title>
                        <ion-icon name="fitness-outline"></ion-icon>
                        Odontología
                      </ion-card-title>
                      <ion-badge color="tertiary">{{ dentalTreatments.length }}</ion-badge>
                    </div>
                  </ion-card-header>
                  <ion-card-content>
                    @if (loadingOdontology) {
                      <ion-skeleton-text [animated]="true" style="width: 100%; height: 80px"></ion-skeleton-text>
                    } @else {
                      @if (odontogram) {
                        <div class="odontogram-summary">
                          <div class="teeth-summary">
                            <div class="summary-item">
                              <span class="count">{{ getTeethCount('healthy') }}</span>
                              <span class="label">Sanos</span>
                            </div>
                            <div class="summary-item warning">
                              <span class="count">{{ getTeethCount('caries') }}</span>
                              <span class="label">Caries</span>
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
                        </div>
                      } @else {
                        <p class="empty-small">No hay odontograma activo.</p>
                      }

                      @if (dentalTreatments.length > 0) {
                        <ion-list class="compact-list">
                          @for (treatment of dentalTreatments.slice(0, 3); track treatment.id) {
                            <ion-item
                              button
                              [routerLink]="['/odontology/treatments', treatment.id]"
                              [queryParams]="moduleQueryParams"
                              detail="true"
                              (click)="$event.stopPropagation()"
                            >
                              <ion-icon name="medkit-outline" slot="start" [color]="getTreatmentStatusColor(treatment.status)"></ion-icon>
                              <ion-label>
                                <h3>{{ getTreatmentTypeLabel(treatment.treatment_type) }}</h3>
                                <p>{{ formatDate(treatment.treatment_date) }}</p>
                              </ion-label>
                              <ion-badge slot="end" [color]="getTreatmentStatusColor(treatment.status)">
                                {{ getTreatmentStatusLabel(treatment.status) }}
                              </ion-badge>
                            </ion-item>
                          }
                        </ion-list>
                      }
                    }

                    <div class="module-actions">
                      <ion-button size="small" fill="outline" (click)="openOdontologyModule($event)">
                        Ver módulo
                      </ion-button>
                      @if (odontogram) {
                        <ion-button
                          size="small"
                          [routerLink]="['/odontology/odontograms', odontogram.id]"
                          [queryParams]="moduleQueryParams"
                          (click)="$event.stopPropagation()"
                        >
                          Ver odontograma
                        </ion-button>
                      } @else {
                        <ion-button size="small" (click)="createOdontogramFromCard($event)" [disabled]="creatingOdontogram">
                          Crear odontograma
                        </ion-button>
                      }
                    </div>
                  </ion-card-content>
                </ion-card>

                <!-- Historial Médico -->
                <ion-card class="module-card clickable-card" (click)="openMedicalRecordsModule()" tabindex="0" role="button">
                  <ion-card-header>
                    <div class="card-header-with-action">
                      <ion-card-title>
                        <ion-icon name="document-text-outline"></ion-icon>
                        Historial Médico
                      </ion-card-title>
                      <ion-badge color="secondary">{{ medicalRecords.length }}</ion-badge>
                    </div>
                  </ion-card-header>
                  <ion-card-content>
                    @if (medicalRecords.length > 0) {
                      <ion-list class="compact-list">
                        @for (record of medicalRecords.slice(0, 3); track record.id) {
                          <ion-item
                            button
                            [routerLink]="['/medical-records', record.id]"
                            [queryParams]="moduleQueryParams"
                            detail="true"
                            (click)="$event.stopPropagation()"
                          >
                            <ion-icon name="document-text-outline" slot="start"></ion-icon>
                            <ion-label>
                              <h3>{{ formatDate(record.record_date) }}</h3>
                              <p>{{ record.diagnosis || 'Sin diagnóstico' }}</p>
                            </ion-label>
                          </ion-item>
                        }
                      </ion-list>
                    } @else {
                      <p class="empty-small">No hay historiales registrados.</p>
                    }

                    <div class="module-actions">
                      <ion-button size="small" fill="outline" (click)="openMedicalRecordsModule($event)">
                        Ver módulo
                      </ion-button>
                      <ion-button size="small" (click)="createMedicalRecord($event)">
                        Nuevo historial
                      </ion-button>
                    </div>
                  </ion-card-content>
                </ion-card>

                <!-- Presupuestos -->
                <ion-card class="module-card clickable-card" (click)="openBudgetsModule()" tabindex="0" role="button">
                  <ion-card-header>
                    <div class="card-header-with-action">
                      <ion-card-title>
                        <ion-icon name="wallet-outline"></ion-icon>
                        Presupuestos
                      </ion-card-title>
                      <ion-badge color="warning">{{ budgets.length }}</ion-badge>
                    </div>
                  </ion-card-header>
                  <ion-card-content>
                    @if (budgets.length > 0) {
                      <ion-list class="compact-list">
                        @for (budget of budgets.slice(0, 3); track budget.id) {
                          <ion-item
                            button
                            [routerLink]="['/budgets', budget.id]"
                            [queryParams]="moduleQueryParams"
                            detail="true"
                            (click)="$event.stopPropagation()"
                          >
                            <ion-icon name="wallet-outline" slot="start" [color]="getBudgetStatusColor(budget.status)"></ion-icon>
                            <ion-label>
                              <h3>{{ budget.title || 'Presupuesto #' + budget.id }}</h3>
                              <p class="budget-amounts">
                                <span class="total">{{ formatCurrency(budget.total_amount, budget.currency) }}</span>
                                @if (budget.total_paid !== undefined) {
                                  <span class="paid">Pagado: {{ formatCurrency(budget.total_paid, budget.currency) }}</span>
                                }
                              </p>
                              @if (budget.total_paid !== undefined && budget.total_amount > 0) {
                                <div class="progress-bar">
                                  <div class="progress-fill" [style.width.%]="getPaymentProgress(budget)"></div>
                                </div>
                              }
                            </ion-label>
                            <ion-badge slot="end" [color]="getBudgetStatusColor(budget.status)">
                              {{ getBudgetStatusLabel(budget.status) }}
                            </ion-badge>
                          </ion-item>
                        }
                      </ion-list>
                    } @else {
                      <p class="empty-small">No hay presupuestos registrados.</p>
                    }

                    <div class="module-actions">
                      <ion-button size="small" fill="outline" (click)="openBudgetsModule($event)">
                        Ver módulo
                      </ion-button>
                      <ion-button size="small" (click)="createBudget($event)">
                        Nuevo presupuesto
                      </ion-button>
                    </div>
                  </ion-card-content>
                </ion-card>

                <!-- Archivos -->
                <ion-card class="module-card clickable-card" (click)="openFilesModule()" tabindex="0" role="button">
                  <ion-card-header>
                    <div class="card-header-with-action">
                      <ion-card-title>
                        <ion-icon name="document-text-outline"></ion-icon>
                        Archivos
                      </ion-card-title>
                      <ion-badge color="medium">{{ files.length }}</ion-badge>
                    </div>
                  </ion-card-header>
                  <ion-card-content>
                    @if (loadingFiles) {
                      <ion-skeleton-text [animated]="true" style="width: 100%; height: 60px"></ion-skeleton-text>
                    } @else if (files.length > 0) {
                      <ion-list class="compact-list files-list">
                        @for (file of files.slice(0, 4); track file.id) {
                          <ion-item button (click)="openFilesModule($event)">
                            <ion-icon [name]="getFileIconName(file.file_type)" slot="start"></ion-icon>
                            <ion-label>
                              <h3>{{ file.original_filename || file.filename }}</h3>
                              <p>{{ getFileCategory(file.category) }} · {{ formatDate(file.upload_date) }}</p>
                            </ion-label>
                            <ion-badge slot="end" color="medium">{{ getFileSize(file.file_size) }}</ion-badge>
                          </ion-item>
                        }
                      </ion-list>
                    } @else {
                      <p class="empty-small">No hay archivos cargados para este paciente.</p>
                    }

                    <div class="module-actions">
                      <ion-button size="small" fill="outline" (click)="openFilesModule($event)">
                        Ver módulo
                      </ion-button>
                      <ion-button size="small" (click)="openFilesModule($event)">
                        Subir archivo
                      </ion-button>
                    </div>
                  </ion-card-content>
                </ion-card>
              </div>
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

    .detail-layout__main {
      max-width: 100% !important;
    }

    .modules-stack {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .module-card {
      margin: 12px 0;
    }

    .clickable-card {
      cursor: pointer;
      transition: transform 0.18s ease, box-shadow 0.18s ease;
    }

    .clickable-card:hover {
      transform: translateY(-1px);
      box-shadow: var(--medical-shadow-md);
    }

    .compact-list ion-item {
      --padding-start: 0;
      --inner-padding-end: 0;
      --min-height: 48px;
    }

    .module-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }

    .empty-small {
      color: var(--ion-color-medium);
      font-size: 0.9rem;
      margin: 4px 0 0;
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
      flex-wrap: wrap;
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
  private router = inject(Router);
  private alertController = inject(AlertController);
  private appointmentsApi = inject(AppointmentsApiService);
  private medicalRecordsApi = inject(MedicalRecordsApiService);
  private budgetsApi = inject(BudgetsApiService);
  private odontologyApi = inject(OdontologyApiService);
  private filesApi = inject(FilesApiService);

  patient$ = this.store.select(selectSelectedPatient);
  loading$ = this.store.select(selectPatientsLoading);

  appointments: AppointmentSummary[] = [];
  medicalRecords: any[] = [];
  budgets: any[] = [];
  files: MedicalFile[] = [];
  patientId: number | null = null;
  currentSpecialtyKey: string | null = null;
  loadingFiles = false;

  // Odontology data
  odontogram: any = null;
  dentalTreatments: any[] = [];
  loadingOdontology = false;
  creatingOdontogram = false;

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
      this.currentSpecialtyKey = this.normalizeSpecialtyKey(
        this.route.snapshot.queryParamMap.get('specialty_key')
      );
      this.loadAppointments();
      this.loadMedicalRecords();
      this.loadBudgets();
      this.loadOdontologyData();
      this.loadFiles();
    }

    this.route.queryParamMap.subscribe((params) => {
      const nextSpecialtyKey = this.normalizeSpecialtyKey(params.get('specialty_key'));
      if (nextSpecialtyKey === this.currentSpecialtyKey) {
        return;
      }
      this.currentSpecialtyKey = nextSpecialtyKey;
      if (this.patientId) {
        this.loadAppointments();
        this.loadMedicalRecords();
        this.loadBudgets();
        this.loadFiles();
      }
    });
  }

  onRefresh(event: any): void {
    if (this.patientId) {
      this.store.dispatch(PatientsActions.loadPatient({ id: this.patientId }));
      this.loadAppointments();
      this.loadMedicalRecords();
      this.loadBudgets();
      this.loadOdontologyData();
      this.loadFiles();
    }
    setTimeout(() => event.target.complete(), 1000);
  }

  loadAppointments(): void {
    if (!this.patientId) {
      this.appointments = [];
      return;
    }

    this.appointmentsApi.list(this.patientId, undefined, this.currentSpecialtyKey || undefined)
      .subscribe({
        next: (data) => {
          this.appointments = this.normalizeAppointments(data)
            .sort((a, b) => this.getTimestamp(b.appointment_date) - this.getTimestamp(a.appointment_date));
        },
        error: () => this.appointments = []
      });
  }

  loadMedicalRecords(): void {
    if (!this.patientId) {
      this.medicalRecords = [];
      return;
    }

    this.medicalRecordsApi.list(this.patientId, undefined, this.currentSpecialtyKey || undefined)
      .subscribe({
        next: (data) => {
          this.medicalRecords = [...data].sort(
            (a, b) => this.getTimestamp(b.record_date) - this.getTimestamp(a.record_date)
          );
        },
        error: () => this.medicalRecords = []
      });
  }

  loadBudgets(): void {
    if (!this.patientId) {
      this.budgets = [];
      return;
    }

    this.budgetsApi.list(this.patientId, this.currentSpecialtyKey || undefined)
      .subscribe({
        next: (data) => {
          this.budgets = [...data].sort((a, b) => {
            const dateA = this.getTimestamp(a.updated_at || a.created_at || a.valid_until);
            const dateB = this.getTimestamp(b.updated_at || b.created_at || b.valid_until);
            return dateB - dateA;
          });
        },
        error: () => this.budgets = []
      });
  }

  loadOdontologyData(): void {
    if (!this.patientId) {
      this.odontogram = null;
      this.dentalTreatments = [];
      return;
    }

    this.loadingOdontology = true;

    // Load odontograms for this patient
    this.odontologyApi.listOdontograms(this.patientId).subscribe({
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
    this.odontologyApi.listDentalTreatments(this.patientId).subscribe({
      next: (treatments) => {
        this.dentalTreatments = [...treatments].sort((a, b) => {
          const dateA = this.getTimestamp(a.treatment_date || a.created_at);
          const dateB = this.getTimestamp(b.treatment_date || b.created_at);
          return dateB - dateA;
        });
      },
      error: () => {
        this.dentalTreatments = [];
      }
    });
  }

  loadFiles(): void {
    if (!this.patientId) {
      this.files = [];
      return;
    }

    this.loadingFiles = true;
    this.filesApi.list(this.patientId, this.currentSpecialtyKey || undefined).subscribe({
      next: (files) => {
        this.files = [...files].sort((a, b) => {
          const dateA = this.getTimestamp(a.upload_date || a.created_at);
          const dateB = this.getTimestamp(b.upload_date || b.created_at);
          return dateB - dateA;
        });
        this.loadingFiles = false;
      },
      error: () => {
        this.files = [];
        this.loadingFiles = false;
      }
    });
  }

  async createOdontogram(): Promise<void> {
    if (this.creatingOdontogram) {
      return;
    }

    const patient = await firstValueFrom(this.patient$.pipe(take(1)));
    const currentUser = await firstValueFrom(this.store.select(selectUser).pipe(take(1)));
    if (!patient) {
      return;
    }

    const professionalId = this.resolveProfessionalId(currentUser);
    if (!professionalId && currentUser?.role !== 'professional') {
      await this.presentMessage(
        'No se pudo crear odontograma',
        'No hay profesional asociado al paciente. Crea una cita con profesional o ingresa con un usuario profesional.'
      );
      return;
    }

    const odontogramData: {
      patient_id: number;
      is_active: boolean;
      professional_id?: number;
    } = {
      patient_id: patient.id,
      is_active: true
    };

    if (professionalId) {
      odontogramData.professional_id = professionalId;
    }

    this.creatingOdontogram = true;

    this.odontologyApi.createOdontogram(odontogramData)
      .subscribe({
        next: (odontogram) => {
          this.odontogram = odontogram;
          this.creatingOdontogram = false;
          this.loadOdontologyData();
        },
        error: async (err: unknown) => {
          this.creatingOdontogram = false;
          await this.presentMessage(
            'Error al crear odontograma',
            this.resolveApiErrorMessage(err, 'No se pudo crear el odontograma.')
          );
        }
      });
  }

  createOdontogramFromCard(event: Event): void {
    this.stopCardClick(event);
    void this.createOdontogram();
  }

  openAppointmentsModule(event?: Event): void {
    this.stopCardClick(event);
    if (this.appointments.length > 0) {
      void this.router.navigate(['/appointments', this.appointments[0].id], { queryParams: this.moduleQueryParams });
      return;
    }
    if (this.patientId) {
      void this.router.navigate(['/appointments/new'], { queryParams: this.moduleQueryParams });
    }
  }

  createAppointment(event: Event): void {
    this.stopCardClick(event);
    if (this.patientId) {
      void this.router.navigate(['/appointments/new'], { queryParams: this.moduleQueryParams });
    }
  }

  openOdontologyModule(event?: Event): void {
    this.stopCardClick(event);
    if (this.patientId) {
      void this.router.navigate(['/odontology/clinical-history', this.patientId], {
        queryParams: this.moduleQueryParams
      });
    }
  }

  openMedicalRecordsModule(event?: Event): void {
    this.stopCardClick(event);
    if (this.medicalRecords.length > 0) {
      void this.router.navigate(['/medical-records', this.medicalRecords[0].id], { queryParams: this.moduleQueryParams });
      return;
    }
    if (this.patientId) {
      void this.router.navigate(['/medical-records/new'], { queryParams: this.moduleQueryParams });
    }
  }

  createMedicalRecord(event: Event): void {
    this.stopCardClick(event);
    if (this.patientId) {
      void this.router.navigate(['/medical-records/new'], { queryParams: this.moduleQueryParams });
    }
  }

  openBudgetsModule(event?: Event): void {
    this.stopCardClick(event);
    if (this.budgets.length > 0) {
      void this.router.navigate(['/budgets', this.budgets[0].id], { queryParams: this.moduleQueryParams });
      return;
    }
    if (this.patientId) {
      void this.router.navigate(['/budgets/new'], { queryParams: this.moduleQueryParams });
    }
  }

  createBudget(event: Event): void {
    this.stopCardClick(event);
    if (this.patientId) {
      void this.router.navigate(['/budgets/new'], { queryParams: this.moduleQueryParams });
    }
  }

  openFilesModule(event?: Event): void {
    this.stopCardClick(event);
    if (this.patientId) {
      void this.router.navigate(['/files'], { queryParams: this.moduleQueryParams });
    }
  }

  get moduleQueryParams(): { patient_id?: number; specialty_key?: string } {
    return {
      patient_id: this.patientId ?? undefined,
      specialty_key: this.currentSpecialtyKey || undefined
    };
  }

  getFileCategory(category: string): string {
    return getFileCategoryLabel(category as FileCategory);
  }

  getFileSize(bytes: number): string {
    return formatFileSize(bytes);
  }

  getFileIconName(fileType: string): string {
    return getFileIcon(fileType);
  }

  private stopCardClick(event?: Event): void {
    event?.stopPropagation();
  }

  private normalizeSpecialtyKey(rawValue: string | null): string | null {
    if (!rawValue) {
      return null;
    }
    const normalized = rawValue.trim().toLowerCase();
    return /^[a-z0-9-]+$/.test(normalized) ? normalized : null;
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

  private getTimestamp(dateValue: string | null | undefined): number {
    if (!dateValue) {
      return 0;
    }
    const parsed = new Date(dateValue).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private resolveProfessionalId(user: User | null): number | null {
    if (user?.role === 'professional' && Number.isFinite(user.id)) {
      return user.id;
    }

    const fromAppointments = this.appointments.find((appointment) => Number.isFinite(appointment.professional_id))?.professional_id;
    if (typeof fromAppointments === 'number') {
      return fromAppointments;
    }

    const fromTreatments = this.dentalTreatments.find((treatment) => Number.isFinite(treatment?.professional_id))?.professional_id;
    return typeof fromTreatments === 'number' ? fromTreatments : null;
  }

  private resolveApiErrorMessage(error: unknown, fallback: string): string {
    if (this.isApiErrorShape(error)) {
      const message = error.error?.msg ?? error.error?.message ?? error.error?.error;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }

    return fallback;
  }

  private isApiErrorShape(value: unknown): value is ApiErrorShape {
    return typeof value === 'object' && value !== null && 'error' in value;
  }

  private async presentMessage(header: string, message: string): Promise<void> {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
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

  formatCurrency(amount: number, currency: string = 'PYG'): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency || 'PYG'
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
