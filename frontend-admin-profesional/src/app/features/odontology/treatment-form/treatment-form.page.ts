import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonItem,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonSpinner,
  IonText,
  IonNote,
  IonChip,
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { saveOutline, closeCircleOutline } from 'ionicons/icons';
import * as OdontologyActions from '../../../store/odontology/odontology.actions';
import { selectSelectedTreatment, selectOdontologyLoading, selectOdontologyError } from '../../../store/odontology/odontology.selectors';
import { selectAllPatients } from '../../../store/patients/patients.selectors';
import * as PatientsActions from '../../../store/patients/patients.actions';
import { TREATMENT_TYPES, PERMANENT_TEETH } from '../../../models/odontology.model';

@Component({
  selector: 'app-treatment-form',
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
    IonItem,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonSpinner,
    IonText,
    IonNote,
    IonChip,
    IonIcon
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/odontology/treatments"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ isEditMode ? 'Editar Tratamiento' : 'Nuevo Tratamiento' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="onSubmit()" [disabled]="treatmentForm.invalid || (loading$ | async)">
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
        <form [formGroup]="treatmentForm">
          <div class="form-grid">
            <!-- Left Column -->
            <div class="form-column">
              <!-- Información Básica -->
              <div class="form-section">
                <h3 class="section-title">Información Básica</h3>
                <div class="form-row">
                  <div class="form-field full-width">
                    <ion-item>
                      <ion-select
                        label="Paciente *"
                        labelPlacement="stacked"
                        formControlName="patient_id"
                        placeholder="Seleccione un paciente"
                      >
                        @for (patient of patients$ | async; track patient.id) {
                          <ion-select-option [value]="patient.id">
                            {{ patient.first_name }} {{ patient.last_name }}
                          </ion-select-option>
                        }
                      </ion-select>
                    </ion-item>
                    @if (treatmentForm.get('patient_id')?.touched && treatmentForm.get('patient_id')?.errors?.['required']) {
                      <ion-note color="danger">El paciente es requerido</ion-note>
                    }
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-field">
                    <ion-item>
                      <ion-select
                        label="Tipo de Tratamiento *"
                        labelPlacement="stacked"
                        formControlName="treatment_type"
                        placeholder="Seleccione el tipo"
                      >
                        @for (type of treatmentTypes; track type.value) {
                          <ion-select-option [value]="type.value">{{ type.label }}</ion-select-option>
                        }
                      </ion-select>
                    </ion-item>
                    @if (treatmentForm.get('treatment_type')?.touched && treatmentForm.get('treatment_type')?.errors?.['required']) {
                      <ion-note color="danger">El tipo es requerido</ion-note>
                    }
                  </div>
                  <div class="form-field">
                    <ion-item>
                      <ion-input
                        label="Fecha *"
                        labelPlacement="stacked"
                        type="date"
                        formControlName="treatment_date"
                      ></ion-input>
                    </ion-item>
                    @if (treatmentForm.get('treatment_date')?.touched && treatmentForm.get('treatment_date')?.errors?.['required']) {
                      <ion-note color="danger">La fecha es requerida</ion-note>
                    }
                  </div>
                </div>
              </div>

              <!-- Dientes Afectados -->
              <div class="form-section">
                <h3 class="section-title">Dientes Afectados</h3>
                <div class="teeth-selector">
                  <div class="selected-teeth">
                    @for (tooth of selectedTeeth; track tooth) {
                      <ion-chip (click)="removeTooth(tooth)">
                        {{ tooth }}
                        <ion-icon name="close-circle-outline"></ion-icon>
                      </ion-chip>
                    }
                    @if (selectedTeeth.length === 0) {
                      <span class="no-teeth">No hay dientes seleccionados</span>
                    }
                  </div>
                  <ion-item>
                    <ion-select
                      label="Agregar diente"
                      labelPlacement="stacked"
                      placeholder="Seleccione"
                      (ionChange)="addTooth($event)"
                      [value]="null"
                    >
                      @for (tooth of availableTeeth; track tooth) {
                        <ion-select-option [value]="tooth">Diente {{ tooth }}</ion-select-option>
                      }
                    </ion-select>
                  </ion-item>
                </div>
              </div>

              <!-- Detalles del Tratamiento -->
              <div class="form-section">
                <h3 class="section-title">Detalles del Tratamiento</h3>
                <div class="form-row">
                  <div class="form-field full-width">
                    <ion-item>
                      <ion-textarea
                        label="Descripción"
                        labelPlacement="stacked"
                        formControlName="description"
                        placeholder="Describa el tratamiento..."
                        [autoGrow]="true"
                        rows="3"
                      ></ion-textarea>
                    </ion-item>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-field">
                    <ion-item>
                      <ion-input
                        label="Técnica"
                        labelPlacement="stacked"
                        formControlName="technique"
                        placeholder="Técnica utilizada"
                      ></ion-input>
                    </ion-item>
                  </div>
                  <div class="form-field">
                    <ion-item>
                      <ion-select
                        label="Tipo de Anestesia"
                        labelPlacement="stacked"
                        formControlName="anesthesia_type"
                        placeholder="Seleccione"
                      >
                        <ion-select-option value="">Sin anestesia</ion-select-option>
                        <ion-select-option value="local">Local</ion-select-option>
                        <ion-select-option value="regional">Regional</ion-select-option>
                        <ion-select-option value="general">General</ion-select-option>
                        <ion-select-option value="sedation">Sedación</ion-select-option>
                      </ion-select>
                    </ion-item>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column -->
            <div class="form-column">
              <!-- Configuración -->
              <div class="form-section">
                <h3 class="section-title">Configuración</h3>
                <div class="form-row">
                  <div class="form-field">
                    <ion-item>
                      <ion-input
                        label="Duración (min)"
                        labelPlacement="stacked"
                        type="number"
                        formControlName="duration_minutes"
                        placeholder="30"
                      ></ion-input>
                    </ion-item>
                  </div>
                  <div class="form-field">
                    <ion-item>
                      <ion-input
                        label="Sesiones"
                        labelPlacement="stacked"
                        type="number"
                        formControlName="sessions_required"
                        placeholder="1"
                      ></ion-input>
                    </ion-item>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-field">
                    <ion-item>
                      <ion-input
                        label="Costo Estimado (PYG)"
                        labelPlacement="stacked"
                        type="number"
                        formControlName="estimated_cost"
                        placeholder="0"
                      ></ion-input>
                    </ion-item>
                  </div>
                  @if (isEditMode) {
                    <div class="form-field">
                      <ion-item>
                        <ion-select
                          label="Estado"
                          labelPlacement="stacked"
                          formControlName="status"
                        >
                          <ion-select-option value="planned">Planificado</ion-select-option>
                          <ion-select-option value="in_progress">En Progreso</ion-select-option>
                          <ion-select-option value="completed">Completado</ion-select-option>
                          <ion-select-option value="cancelled">Cancelado</ion-select-option>
                          <ion-select-option value="postponed">Pospuesto</ion-select-option>
                        </ion-select>
                      </ion-item>
                    </div>
                  }
                </div>
              </div>

              <!-- Materiales y Notas -->
              <div class="form-section">
                <h3 class="section-title">Materiales y Notas</h3>
                <div class="form-row">
                  <div class="form-field full-width">
                    <ion-item>
                      <ion-textarea
                        label="Materiales Utilizados"
                        labelPlacement="stacked"
                        formControlName="materials_used_text"
                        placeholder="Lista de materiales (separados por coma)"
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
                        label="Notas Pre-Tratamiento"
                        labelPlacement="stacked"
                        formControlName="pre_treatment_notes"
                        placeholder="Observaciones antes del tratamiento..."
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
                        label="Instrucciones de Cuidado"
                        labelPlacement="stacked"
                        formControlName="care_instructions"
                        placeholder="Indicaciones para el paciente..."
                        [autoGrow]="true"
                        rows="2"
                      ></ion-textarea>
                    </ion-item>
                  </div>
                </div>
              </div>

              @if (isEditMode) {
                <!-- Post-Tratamiento -->
                <div class="form-section">
                  <h3 class="section-title">Post-Tratamiento</h3>
                  <div class="form-row">
                    <div class="form-field full-width">
                      <ion-item>
                        <ion-textarea
                          label="Notas Post-Tratamiento"
                          labelPlacement="stacked"
                          formControlName="post_treatment_notes"
                          placeholder="Observaciones después del tratamiento..."
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
                          label="Complicaciones"
                          labelPlacement="stacked"
                          formControlName="complications"
                          placeholder="Registrar si hubo complicaciones..."
                          [autoGrow]="true"
                          rows="2"
                        ></ion-textarea>
                      </ion-item>
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-field">
                      <ion-item>
                        <ion-input
                          label="Costo Final (PYG)"
                          labelPlacement="stacked"
                          type="number"
                          formControlName="final_cost"
                          placeholder="0"
                        ></ion-input>
                      </ion-item>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>

          @if (error$ | async; as error) {
            <ion-text color="danger" class="ion-padding">
              <p>{{ error }}</p>
            </ion-text>
          }
        </form>
      </div>
    </ion-content>
  `,
  styles: [`
    .form-container {
      max-width: 1200px;
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

    .teeth-selector {
      background: var(--ion-color-light);
      border-radius: 8px;
      padding: 12px;
    }

    .selected-teeth {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      min-height: 40px;
      align-items: center;
      margin-bottom: 8px;
    }

    .no-teeth {
      color: var(--ion-color-medium);
      font-size: 14px;
    }

    ion-chip {
      cursor: pointer;
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
export class TreatmentFormPage implements OnInit {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private route = inject(ActivatedRoute);

  loading$ = this.store.select(selectOdontologyLoading);
  error$ = this.store.select(selectOdontologyError);
  treatment$ = this.store.select(selectSelectedTreatment);
  patients$ = this.store.select(selectAllPatients);

  treatmentId: number | null = null;
  isEditMode = false;
  treatmentTypes = TREATMENT_TYPES;
  selectedTeeth: number[] = [];

  // All permanent teeth
  allTeeth = [
    ...PERMANENT_TEETH.upperRight,
    ...PERMANENT_TEETH.upperLeft,
    ...PERMANENT_TEETH.lowerLeft,
    ...PERMANENT_TEETH.lowerRight
  ].sort((a, b) => a - b);

  treatmentForm: FormGroup = this.fb.group({
    patient_id: [null, [Validators.required]],
    treatment_type: ['', [Validators.required]],
    treatment_date: ['', [Validators.required]],
    description: [''],
    technique: [''],
    anesthesia_type: [''],
    duration_minutes: [30],
    sessions_required: [1],
    estimated_cost: [null],
    materials_used_text: [''],
    pre_treatment_notes: [''],
    care_instructions: [''],
    // Edit mode fields
    status: ['planned'],
    post_treatment_notes: [''],
    complications: [''],
    final_cost: [null]
  });

  constructor() {
    addIcons({ saveOutline, closeCircleOutline });
  }

  get availableTeeth(): number[] {
    return this.allTeeth.filter(t => !this.selectedTeeth.includes(t));
  }

  ngOnInit(): void {
    // Load patients for select
    this.store.dispatch(PatientsActions.loadPatients());

    const idParam = this.route.snapshot.paramMap.get('id');

    // Check for patient pre-selection from query params
    const patientIdParam = this.route.snapshot.queryParamMap.get('patientId');
    if (patientIdParam) {
      this.treatmentForm.patchValue({ patient_id: parseInt(patientIdParam, 10) });
    }

    if (idParam && idParam !== 'new') {
      this.treatmentId = parseInt(idParam, 10);
      this.isEditMode = true;
      this.store.dispatch(OdontologyActions.loadDentalTreatment({ id: this.treatmentId }));

      this.treatment$.subscribe(treatment => {
        if (treatment) {
          this.selectedTeeth = treatment.affected_teeth || [];
          this.treatmentForm.patchValue({
            patient_id: treatment.patient_id,
            treatment_type: treatment.treatment_type,
            treatment_date: treatment.treatment_date?.split('T')[0] || '',
            description: treatment.description || '',
            technique: treatment.technique || '',
            anesthesia_type: treatment.anesthesia_type || '',
            duration_minutes: treatment.duration_minutes || 30,
            sessions_required: treatment.sessions_required || 1,
            estimated_cost: treatment.estimated_cost,
            materials_used_text: (treatment.materials_used || []).join(', '),
            pre_treatment_notes: treatment.pre_treatment_notes || '',
            care_instructions: treatment.care_instructions || '',
            status: treatment.status || 'planned',
            post_treatment_notes: treatment.post_treatment_notes || '',
            complications: treatment.complications || '',
            final_cost: treatment.final_cost
          });
        }
      });
    } else {
      // Set default date to today
      const today = new Date().toISOString().split('T')[0];
      this.treatmentForm.patchValue({ treatment_date: today });
    }
  }

  addTooth(event: any): void {
    const toothNumber = event.detail.value;
    if (toothNumber && !this.selectedTeeth.includes(toothNumber)) {
      this.selectedTeeth = [...this.selectedTeeth, toothNumber].sort((a, b) => a - b);
    }
    // Reset select
    event.target.value = null;
  }

  removeTooth(toothNumber: number): void {
    this.selectedTeeth = this.selectedTeeth.filter(t => t !== toothNumber);
  }

  onSubmit(): void {
    if (this.treatmentForm.valid) {
      const formValue = this.treatmentForm.value;

      // Parse materials from text
      const materials_used = formValue.materials_used_text
        ? formValue.materials_used_text.split(',').map((m: string) => m.trim()).filter((m: string) => m)
        : [];

      // Build treatment object
      const treatment: any = {
        patient_id: formValue.patient_id,
        treatment_type: formValue.treatment_type,
        treatment_date: formValue.treatment_date,
        affected_teeth: this.selectedTeeth,
        description: formValue.description || undefined,
        technique: formValue.technique || undefined,
        anesthesia_type: formValue.anesthesia_type || undefined,
        duration_minutes: formValue.duration_minutes || undefined,
        sessions_required: formValue.sessions_required || undefined,
        estimated_cost: formValue.estimated_cost || undefined,
        materials_used: materials_used.length > 0 ? materials_used : undefined,
        pre_treatment_notes: formValue.pre_treatment_notes || undefined,
        care_instructions: formValue.care_instructions || undefined
      };

      // Clean undefined values
      Object.keys(treatment).forEach(key => {
        if (treatment[key] === undefined) {
          delete treatment[key];
        }
      });

      if (this.isEditMode && this.treatmentId) {
        // Add edit mode fields
        const updateData: any = {
          ...treatment,
          status: formValue.status,
          post_treatment_notes: formValue.post_treatment_notes || undefined,
          complications: formValue.complications || undefined,
          final_cost: formValue.final_cost || undefined
        };

        // Clean undefined values
        Object.keys(updateData).forEach(key => {
          if (updateData[key] === undefined) {
            delete updateData[key];
          }
        });

        this.store.dispatch(OdontologyActions.updateDentalTreatment({
          id: this.treatmentId,
          treatment: updateData
        }));
      } else {
        this.store.dispatch(OdontologyActions.createDentalTreatment({ treatment }));
      }
    }
  }
}
