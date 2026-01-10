import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { HttpClient } from '@angular/common/http';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonList,
  IonItem,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonSpinner,
  IonText,
  IonNote,
  IonItemDivider,
  IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { saveOutline } from 'ionicons/icons';
import * as MedicalRecordsActions from '../../../store/medical-records/medical-records.actions';
import {
  selectSelectedMedicalRecord,
  selectMedicalRecordsLoading,
  selectMedicalRecordsError
} from '../../../store/medical-records/medical-records.selectors';
import { environment } from '../../../../environments/environment';
import { Patient } from '../../../models/patient.model';

@Component({
  selector: 'app-medical-record-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonList,
    IonItem,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonSpinner,
    IonText,
    IonNote,
    IonItemDivider,
    IonLabel
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/medical-records"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ isEditMode ? 'Editar Historial' : 'Nuevo Historial' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="onSubmit()" [disabled]="recordForm.invalid || (loading$ | async)">
            @if (loading$ | async) {
              <ion-spinner name="crescent"></ion-spinner>
            } @else {
              Guardar
            }
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="form-container">
        <form [formGroup]="recordForm">
          <div class="form-grid">
            <!-- Left Column - Clinical Info -->
            <div class="form-column">
              <!-- Patient Selection (only for new records) -->
              @if (!isEditMode) {
                <div class="form-section">
                  <h3 class="section-title">Paciente</h3>
                  <div class="form-row">
                    <div class="form-field full-width">
                      <ion-item>
                        <ion-select
                          label="Paciente *"
                          labelPlacement="stacked"
                          formControlName="patient_id"
                          placeholder="Seleccione un paciente"
                          interface="action-sheet"
                        >
                          @for (patient of patients; track patient.id) {
                            <ion-select-option [value]="patient.id">
                              {{ patient.first_name }} {{ patient.last_name }}
                            </ion-select-option>
                          }
                        </ion-select>
                      </ion-item>
                      @if (recordForm.get('patient_id')?.touched && recordForm.get('patient_id')?.errors?.['required']) {
                        <ion-note color="danger">Debe seleccionar un paciente</ion-note>
                      }
                    </div>
                  </div>
                </div>
              }

              <!-- Clinical Information -->
              <div class="form-section">
                <h3 class="section-title">Información Clínica</h3>
                <div class="form-row">
                  <div class="form-field full-width">
                    <ion-item>
                      <ion-textarea
                        label="Motivo de Consulta"
                        labelPlacement="stacked"
                        formControlName="chief_complaint"
                        placeholder="¿Cuál es el motivo de la consulta?"
                        [autoGrow]="true"
                        rows="2"
                      ></ion-textarea>
                    </ion-item>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-field full-width">
                    <ion-item>
                      <ion-textarea
                        label="Síntomas"
                        labelPlacement="stacked"
                        formControlName="symptoms"
                        placeholder="Describa los síntomas del paciente"
                        [autoGrow]="true"
                        rows="3"
                      ></ion-textarea>
                    </ion-item>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-field full-width">
                    <ion-item>
                      <ion-textarea
                        label="Diagnóstico"
                        labelPlacement="stacked"
                        formControlName="diagnosis"
                        placeholder="Diagnóstico del paciente"
                        [autoGrow]="true"
                        rows="2"
                      ></ion-textarea>
                    </ion-item>
                  </div>
                </div>
              </div>

              <!-- Treatment Section -->
              <div class="form-section">
                <h3 class="section-title">Tratamiento</h3>
                <div class="form-row">
                  <div class="form-field full-width">
                    <ion-item>
                      <ion-textarea
                        label="Tratamiento"
                        labelPlacement="stacked"
                        formControlName="treatment"
                        placeholder="Tratamiento indicado"
                        [autoGrow]="true"
                        rows="3"
                      ></ion-textarea>
                    </ion-item>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-field full-width">
                    <ion-item>
                      <ion-textarea
                        label="Prescripciones"
                        labelPlacement="stacked"
                        formControlName="prescriptions"
                        placeholder="Medicamentos recetados"
                        [autoGrow]="true"
                        rows="3"
                      ></ion-textarea>
                    </ion-item>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column - Vital Signs & Notes -->
            <div class="form-column">
              <!-- Vital Signs -->
              <div class="form-section">
                <h3 class="section-title">Signos Vitales</h3>
                <div class="form-row">
                  <div class="form-field">
                    <ion-item>
                      <ion-input
                        label="Presión Arterial"
                        labelPlacement="stacked"
                        formControlName="blood_pressure"
                        placeholder="120/80"
                      ></ion-input>
                    </ion-item>
                  </div>
                  <div class="form-field">
                    <ion-item>
                      <ion-input
                        label="Frecuencia Cardíaca (bpm)"
                        labelPlacement="stacked"
                        type="number"
                        formControlName="heart_rate"
                        placeholder="72"
                      ></ion-input>
                    </ion-item>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-field">
                    <ion-item>
                      <ion-input
                        label="Temperatura (°C)"
                        labelPlacement="stacked"
                        type="number"
                        step="0.1"
                        formControlName="temperature"
                        placeholder="36.5"
                      ></ion-input>
                    </ion-item>
                  </div>
                  <div class="form-field">
                    <ion-item>
                      <ion-input
                        label="Peso (kg)"
                        labelPlacement="stacked"
                        type="number"
                        step="0.1"
                        formControlName="weight"
                        placeholder="70"
                      ></ion-input>
                    </ion-item>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-field">
                    <ion-item>
                      <ion-input
                        label="Altura (cm)"
                        labelPlacement="stacked"
                        type="number"
                        formControlName="height"
                        placeholder="170"
                      ></ion-input>
                    </ion-item>
                  </div>
                </div>
              </div>

              <!-- Notes Section -->
              <div class="form-section">
                <h3 class="section-title">Notas Adicionales</h3>
                <div class="form-row">
                  <div class="form-field full-width">
                    <ion-item>
                      <ion-textarea
                        label="Notas"
                        labelPlacement="stacked"
                        formControlName="notes"
                        placeholder="Notas adicionales"
                        [autoGrow]="true"
                        rows="5"
                      ></ion-textarea>
                    </ion-item>
                  </div>
                </div>
              </div>
            </div>
          </div>

          @if (error$ | async; as error) {
            <ion-text color="danger" class="ion-padding">
              <p>{{ error }}</p>
            </ion-text>
          }

          <ion-button expand="block" (click)="onSubmit()" [disabled]="recordForm.invalid" class="ion-margin-top">
            Guardar Historial
          </ion-button>
        </form>
      </div>
    </ion-content>
  `,
  styles: [`
    .form-container {
      max-width: 1400px;
      margin: 0 auto;
    }

    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .form-column {
      width: 100%;
    }

    .form-section {
      background: var(--ion-card-background);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }

    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--ion-color-primary);
      margin: 0 0 16px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--ion-color-primary);
    }

    .form-row {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .form-field {
      flex: 1;
      min-width: 0;
    }

    .form-field.full-width {
      width: 100%;
    }

    .form-field ion-item {
      --background: transparent;
      --padding-start: 0;
    }

    ion-note {
      display: block;
      font-size: 12px;
      margin: 4px 0 8px 0;
      padding-left: 4px;
    }

    @media (min-width: 768px) {
      .form-grid {
        flex-direction: row;
        gap: 24px;
      }

      .form-column {
        flex: 1;
        min-width: 0;
      }

      .form-row {
        flex-direction: row;
        gap: 16px;
      }

      .form-field.full-width {
        flex: 1 1 100%;
      }
    }

    @media (min-width: 1200px) {
      .form-section {
        padding: 20px;
      }
    }
  `]
})
export class MedicalRecordFormPage implements OnInit {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  loading$ = this.store.select(selectMedicalRecordsLoading);
  error$ = this.store.select(selectMedicalRecordsError);
  record$ = this.store.select(selectSelectedMedicalRecord);

  recordId: number | null = null;
  isEditMode = false;
  patients: Patient[] = [];

  recordForm: FormGroup = this.fb.group({
    patient_id: [null, [Validators.required]],
    chief_complaint: [''],
    symptoms: [''],
    diagnosis: [''],
    treatment: [''],
    prescriptions: [''],
    notes: [''],
    blood_pressure: [''],
    heart_rate: [null],
    temperature: [null],
    weight: [null],
    height: [null]
  });

  constructor() {
    addIcons({ saveOutline });
  }

  ngOnInit(): void {
    this.loadPatients();

    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam && idParam !== 'new') {
      this.recordId = parseInt(idParam, 10);
      this.isEditMode = true;
      this.store.dispatch(MedicalRecordsActions.loadMedicalRecord({ id: this.recordId }));

      this.record$.subscribe(record => {
        if (record) {
          this.recordForm.patchValue({
            patient_id: record.patient_id,
            chief_complaint: record.chief_complaint || '',
            symptoms: record.symptoms || '',
            diagnosis: record.diagnosis || '',
            treatment: record.treatment || '',
            prescriptions: record.prescriptions || '',
            notes: record.notes || '',
            blood_pressure: record.blood_pressure || '',
            heart_rate: record.heart_rate || null,
            temperature: record.temperature || null,
            weight: record.weight || null,
            height: record.height || null
          });
          // Disable patient selection in edit mode
          this.recordForm.get('patient_id')?.disable();
        }
      });
    }

    // Check if patient_id is passed as query param (for creating from patient detail)
    const patientId = this.route.snapshot.queryParamMap.get('patient_id');
    if (patientId && !this.isEditMode) {
      this.recordForm.patchValue({ patient_id: parseInt(patientId, 10) });
    }
  }

  loadPatients(): void {
    this.http.get<Patient[]>(`${environment.apiUrl}/patients`).subscribe({
      next: (patients) => this.patients = patients,
      error: (err) => console.error('Error loading patients:', err)
    });
  }

  onSubmit(): void {
    if (this.recordForm.valid) {
      const formValue = this.recordForm.getRawValue();

      // Clean empty strings and null values
      const medicalRecord = Object.keys(formValue).reduce((acc: any, key) => {
        const value = formValue[key];
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      if (this.isEditMode && this.recordId) {
        this.store.dispatch(MedicalRecordsActions.updateMedicalRecord({
          id: this.recordId,
          medicalRecord
        }));
      } else {
        this.store.dispatch(MedicalRecordsActions.createMedicalRecord({ medicalRecord }));
      }
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.recordForm.controls).forEach(key => {
        this.recordForm.get(key)?.markAsTouched();
      });
    }
  }
}
