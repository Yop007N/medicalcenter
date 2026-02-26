import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { take } from 'rxjs/operators';
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
import * as ProfessionalsActions from '../../../store/professionals/professionals.actions';
import { selectSelectedProfessional, selectProfessionalsLoading, selectProfessionalsError } from '../../../store/professionals/professionals.selectors';
import type { Professional } from '../../../models';
import { SpecialtiesApiService } from '../../../core/services/specialties-api.service';

type ProfessionalFormPayload = Partial<Professional> & { password?: string };
type ProfessionalWithLegacyAddress = Professional & { address?: string };

@Component({
  selector: 'app-professional-form',
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
          <ion-back-button defaultHref="/professionals"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ isEditMode ? 'Editar Profesional' : 'Nuevo Profesional' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="onSubmit()" [disabled]="professionalForm.invalid || (loading$ | async)">
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
        <form [formGroup]="professionalForm">
          <div class="form-grid">
            <!-- Left Column -->
            <div class="form-column">
              <!-- Personal Information -->
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
                    @if (professionalForm.get('first_name')?.touched && professionalForm.get('first_name')?.errors?.['required']) {
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
                    @if (professionalForm.get('last_name')?.touched && professionalForm.get('last_name')?.errors?.['required']) {
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
                    @if (professionalForm.get('email')?.touched && professionalForm.get('email')?.errors?.['required']) {
                      <ion-note color="danger">El email es requerido</ion-note>
                    }
                    @if (professionalForm.get('email')?.touched && professionalForm.get('email')?.errors?.['email']) {
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
                      @if (professionalForm.get('password')?.touched && professionalForm.get('password')?.errors?.['required']) {
                        <ion-note color="danger">La contraseña es requerida</ion-note>
                      }
                      @if (professionalForm.get('password')?.touched && professionalForm.get('password')?.errors?.['minlength']) {
                        <ion-note color="danger">La contraseña debe tener al menos 8 caracteres</ion-note>
                      }
                      @if (professionalForm.get('password')?.touched && professionalForm.get('password')?.errors?.['pattern']) {
                        <ion-note color="danger">Debe contener mayúscula, minúscula y número</ion-note>
                      }
                    </div>
                  </div>
                }
              </div>

              <!-- Professional Info -->
              <div class="form-section">
                <h3 class="section-title">Información Profesional</h3>
                <div class="form-row">
                  <div class="form-field">
                    <ion-item>
                      <ion-select
                        label="Especialidad *"
                        labelPlacement="stacked"
                        formControlName="specialty"
                        placeholder="Seleccione"
                      >
                        @for (specialty of specialtyOptions; track specialty.key) {
                          <ion-select-option [value]="specialty.label">{{ specialty.label }}</ion-select-option>
                        }
                      </ion-select>
                    </ion-item>
                    @if (professionalForm.get('specialty')?.touched && professionalForm.get('specialty')?.errors?.['required']) {
                      <ion-note color="danger">La especialidad es requerida</ion-note>
                    }
                  </div>
                  <div class="form-field">
                    <ion-item>
                      <ion-input
                        label="Número de Matrícula *"
                        labelPlacement="stacked"
                        formControlName="license_number"
                        placeholder="MN 12345"
                      ></ion-input>
                    </ion-item>
                    @if (professionalForm.get('license_number')?.touched && professionalForm.get('license_number')?.errors?.['required']) {
                      <ion-note color="danger">La matrícula es requerida</ion-note>
                    }
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-field full-width">
                    <ion-item>
                      <ion-textarea
                        label="Biografía"
                        labelPlacement="stacked"
                        formControlName="bio"
                        placeholder="Descripción profesional, experiencia, formación..."
                        [autoGrow]="true"
                        rows="4"
                      ></ion-textarea>
                    </ion-item>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column -->
            <div class="form-column">
              <!-- Office Info -->
              <div class="form-section">
                <h3 class="section-title">Consultorio</h3>
                <div class="form-row">
                  <div class="form-field full-width">
                    <ion-item>
                      <ion-input
                        label="Dirección del Consultorio"
                        labelPlacement="stacked"
                        formControlName="office_address"
                        placeholder="Calle, número, piso"
                      ></ion-input>
                    </ion-item>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-field full-width">
                    <ion-item>
                      <ion-input
                        label="Horario de Atención"
                        labelPlacement="stacked"
                        formControlName="working_hours"
                        placeholder="Lun-Vie 9:00-18:00"
                      ></ion-input>
                    </ion-item>
                  </div>
                </div>
              </div>

              <!-- Fees -->
              <div class="form-section">
                <h3 class="section-title">Honorarios</h3>
                <div class="form-row">
                  <div class="form-field full-width">
                    <ion-item>
                      <ion-input
                        label="Valor de Consulta"
                        labelPlacement="stacked"
                        type="number"
                        formControlName="consultation_fee"
                        placeholder="5000"
                      ></ion-input>
                    </ion-item>
                  </div>
                </div>
              </div>

              <!-- Status -->
              @if (isEditMode) {
                <div class="form-section">
                  <h3 class="section-title">Estado</h3>
                  <div class="form-row">
                    <div class="form-field full-width">
                      <ion-item>
                        <ion-toggle formControlName="is_active">Profesional Activo</ion-toggle>
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
export class ProfessionalFormPage implements OnInit {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private specialtiesApi = inject(SpecialtiesApiService);

  loading$ = this.store.select(selectProfessionalsLoading);
  error$ = this.store.select(selectProfessionalsError);
  professional$ = this.store.select(selectSelectedProfessional);

  professionalId: number | null = null;
  isEditMode = false;
  specialtyOptions: Array<{ key: string; label: string }> = [];

  professionalForm: FormGroup = this.fb.group({
    first_name: ['', [Validators.required]],
    last_name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)]],
    specialty: ['', [Validators.required]],
    phone: [''],
    license_number: ['', [Validators.required]],
    office_address: [''],
    working_hours: [''],
    consultation_fee: [null],
    bio: [''],
    is_active: [true]
  });

  constructor() {
    addIcons({ saveOutline });
  }

  ngOnInit(): void {
    this.loadSpecialtiesCatalog();

    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam && idParam !== 'new') {
      this.professionalId = parseInt(idParam, 10);
      this.isEditMode = true;
      // Password is only required when creating a professional.
      this.professionalForm.get('password')?.clearValidators();
      this.professionalForm.get('password')?.updateValueAndValidity();
      this.store.dispatch(ProfessionalsActions.loadProfessional({ id: this.professionalId }));

      this.professional$.subscribe(professional => {
        if (professional) {
          const legacyProfessional = professional as ProfessionalWithLegacyAddress;

          this.professionalForm.patchValue({
            first_name: professional.first_name,
            last_name: professional.last_name,
            email: professional.email,
            specialty: professional.specialty || '',
            phone: professional.phone || '',
            license_number: professional.license_number || '',
            office_address: professional.office_address || legacyProfessional.address || '',
            working_hours: professional.working_hours || '',
            consultation_fee: professional.consultation_fee || null,
            bio: professional.bio || '',
            is_active: professional.is_active
          });
          this.ensureSpecialtyOption(professional.specialty);
        }
      });
    }
  }

  onSubmit(): void {
    if (this.professionalForm.valid) {
      const formValue = this.professionalForm.getRawValue() as Record<string, unknown>;
      const professional = this.compactPayload<ProfessionalFormPayload>(
        formValue,
        this.isEditMode ? ['password'] : []
      );

      if (this.isEditMode && this.professionalId) {
        this.store.dispatch(ProfessionalsActions.updateProfessional({
          id: this.professionalId,
          professional
        }));
      } else {
        this.store.dispatch(ProfessionalsActions.createProfessional({ professional }));
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

  private loadSpecialtiesCatalog(): void {
    this.specialtiesApi
      .getCatalog()
      .pipe(take(1))
      .subscribe({
        next: (modules) => {
          const options = modules.map((module) => ({
            key: module.key,
            label: module.label
          }));
          this.specialtyOptions = this.sortSpecialties(options);
          this.ensureSpecialtyOption(this.professionalForm.get('specialty')?.value as string | null);
        },
        error: () => {
          this.specialtyOptions = [];
          this.ensureSpecialtyOption(this.professionalForm.get('specialty')?.value as string | null);
        }
      });
  }

  private ensureSpecialtyOption(value: string | null | undefined): void {
    const label = (value ?? '').trim();
    if (!label) {
      return;
    }

    const exists = this.specialtyOptions.some(
      (option) => this.normalizeSpecialty(option.label) === this.normalizeSpecialty(label)
    );
    if (exists) {
      return;
    }

    this.specialtyOptions = this.sortSpecialties([
      ...this.specialtyOptions,
      {
        key: `legacy-${this.normalizeSpecialty(label).replace(/\s+/g, '-')}`,
        label
      }
    ]);
  }

  private sortSpecialties(
    options: Array<{ key: string; label: string }>
  ): Array<{ key: string; label: string }> {
    return [...options].sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }));
  }

  private normalizeSpecialty(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
