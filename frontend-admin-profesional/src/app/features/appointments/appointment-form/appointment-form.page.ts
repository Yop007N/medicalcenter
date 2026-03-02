import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
  IonItem,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonSpinner,
  IonText,
  IonNote
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBackOutline, saveOutline } from 'ionicons/icons';
import { PatientsApiService, ProfessionalsApiService } from '../../../core/services';
import * as AppointmentsActions from '../../../store/appointments/appointments.actions';
import { selectSelectedAppointment, selectAppointmentsLoading, selectAppointmentsError } from '../../../store/appointments/appointments.selectors';
import { Patient, Professional } from '../../../models';

@Component({
  selector: 'app-appointment-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,

    IonButton,
    IonIcon,
    IonItem,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonSpinner,
    IonText,
    IonNote
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button fill="clear" [routerLink]="['/appointments']" [queryParams]="scopeQueryParams" aria-label="Volver a citas">
            <ion-icon slot="icon-only" name="chevron-back-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>{{ isEditMode ? 'Editar Cita' : 'Nueva Cita' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="onSubmit()" [disabled]="appointmentForm.invalid || (loading$ | async)">
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
        <form [formGroup]="appointmentForm">
          <div class="form-grid">
            <!-- Left Column -->
            <div class="form-column">
              <!-- Participantes -->
              <div class="form-section">
                <h3 class="section-title">Participantes</h3>
                <div class="form-row">
                  <div class="form-field full-width">
                    <ion-item>
                      <ion-select
                        label="Paciente *"
                        labelPlacement="stacked"
                        formControlName="patient_id"
                        placeholder="Seleccione paciente"
                      >
                        @for (patient of patients; track patient.id) {
                          <ion-select-option [value]="patient.id">
                            {{ patient.first_name }} {{ patient.last_name }}
                          </ion-select-option>
                        }
                      </ion-select>
                    </ion-item>
                    @if (appointmentForm.get('patient_id')?.touched && appointmentForm.get('patient_id')?.errors?.['required']) {
                      <ion-note color="danger">El paciente es requerido</ion-note>
                    }
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-field full-width">
                    <ion-item>
                      <ion-select
                        label="Profesional *"
                        labelPlacement="stacked"
                        formControlName="professional_id"
                        placeholder="Seleccione profesional"
                      >
                        @for (professional of professionals; track professional.id) {
                          <ion-select-option [value]="professional.id">
                            {{ professional.first_name }} {{ professional.last_name }} - {{ professional.specialty }}
                          </ion-select-option>
                        }
                      </ion-select>
                    </ion-item>
                    @if (appointmentForm.get('professional_id')?.touched && appointmentForm.get('professional_id')?.errors?.['required']) {
                      <ion-note color="danger">El profesional es requerido</ion-note>
                    }
                  </div>
                </div>
              </div>

              <!-- Fecha y Tipo -->
              <div class="form-section">
                <h3 class="section-title">Programación</h3>
                <div class="form-row">
                  <div class="form-field">
                    <ion-item>
                      <ion-input
                        label="Fecha *"
                        labelPlacement="stacked"
                        type="date"
                        formControlName="appointment_date_only"
                        [min]="minDateOnly"
                      ></ion-input>
                    </ion-item>
                  </div>
                  <div class="form-field">
                    <ion-item>
                      <ion-input
                        label="Hora *"
                        labelPlacement="stacked"
                        type="time"
                        formControlName="appointment_time"
                      ></ion-input>
                    </ion-item>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-field">
                    <ion-item>
                      <ion-input
                        label="Duración (minutos)"
                        labelPlacement="stacked"
                        type="number"
                        formControlName="duration_minutes"
                        placeholder="30"
                      ></ion-input>
                    </ion-item>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-field">
                    <ion-item>
                      <ion-select
                        label="Tipo de Cita *"
                        labelPlacement="stacked"
                        formControlName="appointment_type"
                        placeholder="Seleccione tipo"
                      >
                        <ion-select-option value="Consulta">Consulta</ion-select-option>
                        <ion-select-option value="Control">Control</ion-select-option>
                        <ion-select-option value="Tratamiento">Tratamiento</ion-select-option>
                        <ion-select-option value="Emergencia">Emergencia</ion-select-option>
                        <ion-select-option value="Evaluación">Evaluación</ion-select-option>
                        <ion-select-option value="Seguimiento">Seguimiento</ion-select-option>
                      </ion-select>
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
                          <ion-select-option value="pending">Pendiente</ion-select-option>
                          <ion-select-option value="confirmed">Confirmada</ion-select-option>
                          <ion-select-option value="completed">Completada</ion-select-option>
                          <ion-select-option value="cancelled">Cancelada</ion-select-option>
                          <ion-select-option value="no_show">No asistió</ion-select-option>
                        </ion-select>
                      </ion-item>
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- Right Column -->
            <div class="form-column">
              <!-- Detalles -->
              <div class="form-section">
                <h3 class="section-title">Detalles de la Cita</h3>
                <div class="form-row">
                  <div class="form-field full-width">
                    <ion-item>
                      <ion-textarea
                        label="Motivo de la Consulta"
                        labelPlacement="stacked"
                        formControlName="reason"
                        placeholder="Describa el motivo de la cita"
                        [autoGrow]="true"
                        rows="4"
                      ></ion-textarea>
                    </ion-item>
                  </div>
                </div>
              </div>

              <!-- Notas -->
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
export class AppointmentFormPage implements OnInit {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private patientsApi = inject(PatientsApiService);
  private professionalsApi = inject(ProfessionalsApiService);

  loading$ = this.store.select(selectAppointmentsLoading);
  error$ = this.store.select(selectAppointmentsError);
  appointment$ = this.store.select(selectSelectedAppointment);

  appointmentId: number | null = null;
  isEditMode = false;
  patients: Patient[] = [];
  professionals: Professional[] = [];
  minDateOnly = new Date().toISOString().split('T')[0];
  currentPatientId?: number;
  currentProfessionalId?: number;
  currentSpecialtyKey?: string;

  appointmentForm: FormGroup = this.fb.group({
    patient_id: [null, [Validators.required]],
    professional_id: [null, [Validators.required]],
    appointment_date_only: [this.minDateOnly, [Validators.required]],
    appointment_time: ['09:00', [Validators.required]],
    appointment_type: ['Consulta', [Validators.required]],
    duration_minutes: [30],
    status: ['pending'],
    reason: [''],
    notes: ['']
  });

  constructor() {
    addIcons({ saveOutline, chevronBackOutline });
  }

  ngOnInit(): void {
    this.loadPatients();
    this.loadProfessionals();
    this.currentPatientId = this.parseNumberParam(this.route.snapshot.queryParamMap.get('patient_id'));
    this.currentProfessionalId = this.parseNumberParam(this.route.snapshot.queryParamMap.get('professional_id'));
    this.currentSpecialtyKey = this.route.snapshot.queryParamMap.get('specialty_key') || undefined;

    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam && idParam !== 'new') {
      this.appointmentId = parseInt(idParam, 10);
      this.isEditMode = true;
      this.store.dispatch(AppointmentsActions.loadAppointment({ id: this.appointmentId }));

      this.appointment$.subscribe(appointment => {
        if (appointment) {
          const appointmentDate = new Date(appointment.appointment_date);
          const dateOnly = appointmentDate.toISOString().split('T')[0];
          const timeOnly = appointmentDate.toTimeString().slice(0, 5);

          this.appointmentForm.patchValue({
            patient_id: appointment.patient_id,
            professional_id: appointment.professional_id,
            appointment_date_only: dateOnly,
            appointment_time: timeOnly,
            appointment_type: appointment.appointment_type,
            duration_minutes: appointment.duration_minutes || 30,
            status: appointment.status,
            reason: appointment.reason || '',
            notes: appointment.notes || ''
          });
        }
      });
    }

    // Check for query params (e.g., from patient detail)
    if (this.currentPatientId) {
      this.appointmentForm.patchValue({ patient_id: this.currentPatientId });
    }
  }

  loadPatients(): void {
    this.patientsApi.list().subscribe({
      next: (data) => this.patients = data,
      error: () => this.patients = []
    });
  }

  loadProfessionals(): void {
    this.professionalsApi.list().subscribe({
      next: (data) => this.professionals = data.filter(p => p.is_active),
      error: () => this.professionals = []
    });
  }

  onSubmit(): void {
    if (this.appointmentForm.valid) {
      const formValue = this.appointmentForm.value;

      // Combine date and time into ISO string
      const dateTime = new Date(`${formValue.appointment_date_only}T${formValue.appointment_time}:00`);

      const appointment: any = {
        patient_id: formValue.patient_id,
        professional_id: formValue.professional_id,
        appointment_date: dateTime.toISOString(),
        appointment_type: formValue.appointment_type,
        duration_minutes: formValue.duration_minutes,
        status: formValue.status
      };

      if (formValue.reason) {
        appointment.reason = formValue.reason;
      }
      if (formValue.notes) {
        appointment.notes = formValue.notes;
      }

      if (this.isEditMode && this.appointmentId) {
        this.store.dispatch(AppointmentsActions.updateAppointment({
          id: this.appointmentId,
          appointment,
          navigationQueryParams: this.scopeQueryParams
        }));
      } else {
        this.store.dispatch(AppointmentsActions.createAppointment({
          appointment,
          navigationQueryParams: this.scopeQueryParams
        }));
      }
    }
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
}
