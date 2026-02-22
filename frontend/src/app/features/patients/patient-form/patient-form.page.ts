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
  IonToggle,
  IonNote
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { saveOutline } from 'ionicons/icons';
import * as PatientsActions from '../../../store/patients/patients.actions';
import { selectSelectedPatient, selectPatientsLoading, selectPatientsError } from '../../../store/patients/patients.selectors';
import type { Patient } from '../../../models';

type PatientFormPayload = Partial<Patient> & { password?: string };

@Component({
  selector: 'app-patient-form',
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
    IonToggle,
    IonNote
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/patients"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ isEditMode ? 'Editar Paciente' : 'Nuevo Paciente' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="onSubmit()" [disabled]="patientForm.invalid || (loading$ | async)">
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
        <form [formGroup]="patientForm">
          <div class="form-grid">
            <!-- Left Column -->
            <div class="form-column">
              <!-- Personal Information Section -->
              <div class="form-section">
                <h3 class="section-title">Información Personal</h3>
                <div class="form-row">
                  <div class="form-field">
                    <ion-item>
                      <ion-input
                        label="Nombre *"
                        labelPlacement="stacked"
                        formControlName="first_name"
                        placeholder="Ingrese nombre"
                      ></ion-input>
                    </ion-item>
                    @if (patientForm.get('first_name')?.touched && patientForm.get('first_name')?.errors?.['required']) {
                      <ion-note color="danger">El nombre es requerido</ion-note>
                    }
                  </div>
                  <div class="form-field">
                    <ion-item>
                      <ion-input
                        label="Apellido *"
                        labelPlacement="stacked"
                        formControlName="last_name"
                        placeholder="Ingrese apellido"
                      ></ion-input>
                    </ion-item>
                    @if (patientForm.get('last_name')?.touched && patientForm.get('last_name')?.errors?.['required']) {
                      <ion-note color="danger">El apellido es requerido</ion-note>
                    }
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-field">
                    <ion-item>
                      <ion-input
                        label="Email *"
                        labelPlacement="stacked"
                        type="email"
                        formControlName="email"
                        placeholder="ejemplo@correo.com"
                      ></ion-input>
                    </ion-item>
                    @if (patientForm.get('email')?.touched && patientForm.get('email')?.errors?.['required']) {
                      <ion-note color="danger">El email es requerido</ion-note>
                    }
                    @if (patientForm.get('email')?.touched && patientForm.get('email')?.errors?.['email']) {
                      <ion-note color="danger">Ingrese un email válido</ion-note>
                    }
                  </div>
                  <div class="form-field">
                    <ion-item>
                      <ion-input
                        label="Teléfono"
                        labelPlacement="stacked"
                        type="tel"
                        formControlName="phone"
                        placeholder="+54 11 1234-5678"
                      ></ion-input>
                    </ion-item>
                  </div>
                </div>

                @if (!isEditMode) {
                  <div class="form-row">
                    <div class="form-field full-width">
                      <ion-item>
                        <ion-input
                          label="Contraseña *"
                          labelPlacement="stacked"
                          type="password"
                          formControlName="password"
                          placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número"
                        ></ion-input>
                      </ion-item>
                      @if (patientForm.get('password')?.touched && patientForm.get('password')?.errors?.['required']) {
                        <ion-note color="danger">La contraseña es requerida</ion-note>
                      }
                      @if (patientForm.get('password')?.touched && patientForm.get('password')?.errors?.['minlength']) {
                        <ion-note color="danger">La contraseña debe tener al menos 8 caracteres</ion-note>
                      }
                      @if (patientForm.get('password')?.touched && patientForm.get('password')?.errors?.['pattern']) {
                        <ion-note color="danger">Debe contener mayúscula, minúscula y número</ion-note>
                      }
                    </div>
                  </div>
                }
              </div>

              <!-- Document Section -->
              <div class="form-section">
                <h3 class="section-title">Documento e Identificación</h3>
                <div class="form-row">
                  <div class="form-field">
                    <ion-item>
                      <ion-select
                        label="Tipo de Documento"
                        labelPlacement="stacked"
                        formControlName="document_type"
                        placeholder="Seleccione"
                      >
                        <ion-select-option value="DNI">DNI</ion-select-option>
                        <ion-select-option value="PASSPORT">Pasaporte</ion-select-option>
                        <ion-select-option value="CUIT">CUIT</ion-select-option>
                        <ion-select-option value="OTHER">Otro</ion-select-option>
                      </ion-select>
                    </ion-item>
                  </div>
                  <div class="form-field">
                    <ion-item>
                      <ion-input
                        label="Número de Documento"
                        labelPlacement="stacked"
                        formControlName="document_number"
                        placeholder="12345678"
                      ></ion-input>
                    </ion-item>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-field">
                    <ion-item>
                      <ion-input
                        label="Fecha de Nacimiento"
                        labelPlacement="stacked"
                        formControlName="date_of_birth"
                        type="date"
                      ></ion-input>
                    </ion-item>
                  </div>
                  <div class="form-field">
                    <ion-item>
                      <ion-select
                        label="Género"
                        labelPlacement="stacked"
                        formControlName="gender"
                        placeholder="Seleccione"
                      >
                        <ion-select-option value="M">Masculino</ion-select-option>
                        <ion-select-option value="F">Femenino</ion-select-option>
                        <ion-select-option value="O">Otro</ion-select-option>
                      </ion-select>
                    </ion-item>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-field full-width">
                    <ion-item>
                      <ion-input
                        label="Dirección"
                        labelPlacement="stacked"
                        formControlName="address"
                        placeholder="Calle, número, ciudad"
                      ></ion-input>
                    </ion-item>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column -->
            <div class="form-column">
              <!-- Insurance Section -->
              <div class="form-section">
                <h3 class="section-title">Obra Social / Seguro</h3>
                <div class="form-row">
                  <div class="form-field full-width">
                    <ion-item>
                      <ion-input
                        label="Obra Social / Seguro"
                        labelPlacement="stacked"
                        formControlName="insurance_provider"
                        placeholder="Nombre de la obra social"
                      ></ion-input>
                    </ion-item>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-field full-width">
                    <ion-item>
                      <ion-input
                        label="Número de Afiliado"
                        labelPlacement="stacked"
                        formControlName="insurance_number"
                        placeholder="Número de afiliado"
                      ></ion-input>
                    </ion-item>
                  </div>
                </div>
              </div>

              <!-- Emergency Contact Section -->
              <div class="form-section">
                <h3 class="section-title">Contacto de Emergencia</h3>
                <div class="form-row">
                  <div class="form-field full-width">
                    <ion-item>
                      <ion-input
                        label="Nombre del Contacto"
                        labelPlacement="stacked"
                        formControlName="emergency_contact"
                        placeholder="Nombre del contacto"
                      ></ion-input>
                    </ion-item>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-field full-width">
                    <ion-item>
                      <ion-input
                        label="Teléfono de Emergencia"
                        labelPlacement="stacked"
                        type="tel"
                        formControlName="emergency_phone"
                        placeholder="+54 11 1234-5678"
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
                        placeholder="Observaciones adicionales"
                        [autoGrow]="true"
                        rows="4"
                      ></ion-textarea>
                    </ion-item>
                  </div>
                </div>

                @if (isEditMode) {
                  <div class="form-row">
                    <div class="form-field full-width">
                      <ion-item>
                        <ion-toggle formControlName="is_active">Paciente Activo</ion-toggle>
                      </ion-item>
                    </div>
                  </div>
                }
              </div>
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

    /* Tablet and Desktop */
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

    /* Large Desktop */
    @media (min-width: 1200px) {
      .form-section {
        padding: 20px;
      }
    }
  `]
})
export class PatientFormPage implements OnInit {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private route = inject(ActivatedRoute);

  loading$ = this.store.select(selectPatientsLoading);
  error$ = this.store.select(selectPatientsError);
  patient$ = this.store.select(selectSelectedPatient);

  patientId: number | null = null;
  isEditMode = false;

  patientForm: FormGroup = this.fb.group({
    first_name: ['', [Validators.required]],
    last_name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)]],
    phone: [''],
    document_type: ['DNI'],
    document_number: [''],
    date_of_birth: [''],
    gender: [''],
    address: [''],
    insurance_provider: [''],
    insurance_number: [''],
    emergency_contact: [''],
    emergency_phone: [''],
    notes: [''],
    is_active: [true]
  });

  constructor() {
    addIcons({ saveOutline });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam && idParam !== 'new') {
      this.patientId = parseInt(idParam, 10);
      this.isEditMode = true;
      // Remove password validation in edit mode
      this.patientForm.get('password')?.clearValidators();
      this.patientForm.get('password')?.updateValueAndValidity();
      this.store.dispatch(PatientsActions.loadPatient({ id: this.patientId }));

      this.patient$.subscribe(patient => {
        if (patient) {
          this.patientForm.patchValue({
            first_name: patient.first_name,
            last_name: patient.last_name,
            email: patient.email,
            phone: patient.phone || '',
            document_type: patient.document_type || 'DNI',
            document_number: patient.document_number || '',
            date_of_birth: patient.date_of_birth || '',
            gender: patient.gender || '',
            address: patient.address || '',
            insurance_provider: patient.insurance_provider || '',
            insurance_number: patient.insurance_number || '',
            emergency_contact: patient.emergency_contact || '',
            emergency_phone: patient.emergency_phone || '',
            notes: patient.notes || '',
            is_active: patient.is_active
          });
        }
      });
    }
  }

  onSubmit(): void {
    if (this.patientForm.valid) {
      const formValue = this.patientForm.getRawValue() as Record<string, unknown>;
      const patient = this.compactPayload<PatientFormPayload>(formValue);

      if (this.isEditMode && this.patientId) {
        this.store.dispatch(PatientsActions.updatePatient({
          id: this.patientId,
          patient
        }));
      } else {
        this.store.dispatch(PatientsActions.createPatient({ patient }));
      }
    }
  }

  private compactPayload<T extends Record<string, unknown>>(
    source: Record<string, unknown>,
    excludedKeys: readonly string[] = []
  ): T {
    const excluded = new Set(excludedKeys);

    return Object.entries(source).reduce<T>((acc, [key, value]) => {
      if (!excluded.has(key) && value !== '' && value !== null) {
        acc[key as keyof T] = value as T[keyof T];
      }
      return acc;
    }, {} as T);
  }
}
