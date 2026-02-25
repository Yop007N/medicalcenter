import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import {
  CreatePatientPayload,
  PatientService,
  UpdatePatientPayload
} from '../core/services/patient.service';
import { Patient } from '../shared/models/user.model';
import { pageShellStyles } from './page-shell.styles';

type ApiErrorShape = {
  error?: {
    message?: string;
    msg?: string;
    error?: string;
  };
};

type PatientFormMode = 'create' | 'edit';

@Component({
  selector: 'app-patients-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="page">
      <h1>Pacientes</h1>
      <p>Gestion de perfiles, contacto y seguimiento clinico.</p>

      <div class="toolbar">
        <input
          #searchInput
          type="search"
          class="search-input"
          placeholder="Buscar por nombre, apellido o email"
          (keyup.enter)="applySearch(searchInput.value)"
        />
        <button type="button" class="toolbar-button" (click)="applySearch(searchInput.value)" [disabled]="loading">
          Buscar
        </button>
        <button type="button" class="toolbar-button" (click)="openCreateForm()" [disabled]="formSubmitting">
          Nuevo paciente
        </button>
        <button type="button" class="toolbar-button" (click)="loadPatients()" [disabled]="loading">
          @if (loading) { Cargando... } @else { Actualizar }
        </button>
      </div>

      @if (errorMessage) {
        <div class="error-box" role="alert">{{ errorMessage }}</div>
      }

      @if (successMessage) {
        <div class="success-box" role="status">{{ successMessage }}</div>
      }

      @if (showForm) {
        <article class="card form-card">
          <h2 class="card-title">
            @if (formMode === 'create') { Crear paciente } @else { Editar paciente #{{ editingPatientId }} }
          </h2>

          <form [formGroup]="patientForm" (ngSubmit)="submitForm()" novalidate class="form-grid">
            <label>
              Nombre
              <input type="text" formControlName="first_name" />
            </label>

            <label>
              Apellido
              <input type="text" formControlName="last_name" />
            </label>

            <label>
              Correo
              <input type="email" formControlName="email" />
            </label>

            <label>
              Password
              <input type="password" formControlName="password" placeholder="********" />
            </label>

            <label>
              Fecha nacimiento
              <input type="date" formControlName="date_of_birth" />
            </label>

            <label>
              Telefono
              <input type="text" formControlName="phone" />
            </label>

            <label>
              Tipo de sangre
              <input type="text" formControlName="blood_type" />
            </label>

            <label>
              Contacto emergencia
              <input type="text" formControlName="emergency_contact" />
            </label>

            <label>
              Telefono emergencia
              <input type="text" formControlName="emergency_phone" />
            </label>

            <label class="full-row">
              Direccion
              <input type="text" formControlName="address" />
            </label>

            <label class="full-row">
              Alergias
              <textarea rows="2" formControlName="allergies"></textarea>
            </label>

            <label class="full-row">
              Historial medico
              <textarea rows="3" formControlName="medical_history"></textarea>
            </label>

            @if (fieldError) {
              <p class="field-error full-row">{{ fieldError }}</p>
            }

            <div class="form-actions full-row">
              <button class="primary-button" type="submit" [disabled]="formSubmitting">
                @if (formSubmitting) { Guardando... } @else if (formMode === 'create') { Crear } @else { Guardar }
              </button>
              <button class="secondary-button" type="button" (click)="closeForm()" [disabled]="formSubmitting">
                Cancelar
              </button>
            </div>
          </form>
        </article>
      }

      @if (detailLoading) {
        <article class="card detail-card">
          <p class="card-text">Cargando detalle...</p>
        </article>
      }

      @if (selectedPatient && !detailLoading) {
        <article class="card detail-card">
          <h2 class="card-title">Detalle paciente #{{ selectedPatient.id }}</h2>
          <div class="detail-grid">
            <p><strong>Nombre:</strong> {{ selectedPatient.first_name }} {{ selectedPatient.last_name }}</p>
            <p><strong>Email:</strong> {{ selectedPatient.email }}</p>
            <p><strong>Telefono:</strong> {{ selectedPatient.phone || '-' }}</p>
            <p><strong>Fecha nacimiento:</strong> {{ selectedPatient.date_of_birth || '-' }}</p>
            <p><strong>Tipo sangre:</strong> {{ selectedPatient.blood_type || '-' }}</p>
            <p><strong>Contacto emergencia:</strong> {{ selectedPatient.emergency_contact || '-' }}</p>
            <p><strong>Tel emergencia:</strong> {{ selectedPatient.emergency_phone || '-' }}</p>
            <p class="full-width"><strong>Direccion:</strong> {{ selectedPatient.address || '-' }}</p>
            <p class="full-width"><strong>Alergias:</strong> {{ selectedPatient.allergies || '-' }}</p>
            <p class="full-width"><strong>Historial:</strong> {{ selectedPatient.medical_history || '-' }}</p>
          </div>
        </article>
      }

      @if (!loading && patients.length === 0 && !errorMessage) {
        <article class="card empty">
          <h2 class="card-title">Sin pacientes</h2>
          <p class="card-text">No se encontraron pacientes para el filtro aplicado.</p>
        </article>
      }

      @if (patients.length > 0) {
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Telefono</th>
                <th>Sangre</th>
                <th>Activo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (patient of patients; track patient.id) {
                <tr>
                  <td>#{{ patient.id }}</td>
                  <td>{{ patient.first_name }} {{ patient.last_name }}</td>
                  <td>{{ patient.email }}</td>
                  <td>{{ patient.phone || '-' }}</td>
                  <td>{{ patient.blood_type || '-' }}</td>
                  <td>
                    <span class="badge" [class]="patient.is_active ? 'status-active' : 'status-inactive'">
                      {{ patient.is_active ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td>
                    <div class="row-actions">
                      <button class="table-action" type="button" (click)="viewPatient(patient.id)">Ver</button>
                      <button class="table-action" type="button" (click)="startEdit(patient)">Editar</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
  styles: [
    pageShellStyles,
    `
      .toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
      }

      .search-input,
      input,
      textarea {
        border: 1px solid #d0d5dd;
        border-radius: 8px;
        font-size: 0.82rem;
        padding: 0.45rem 0.6rem;
      }

      .search-input {
        flex: 1 1 300px;
        min-width: 220px;
      }

      .toolbar-button {
        background: #ffffff;
        border: 1px solid #d0d5dd;
        border-radius: 8px;
        color: #344054;
        cursor: pointer;
        font-size: 0.82rem;
        font-weight: 600;
        padding: 0.45rem 0.7rem;
      }

      .toolbar-button:disabled {
        cursor: not-allowed;
        opacity: 0.65;
      }

      .form-card,
      .detail-card {
        margin-bottom: 0.75rem;
      }

      .form-grid {
        display: grid;
        gap: 0.6rem;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        margin-top: 0.5rem;
      }

      .form-grid label {
        color: #344054;
        display: grid;
        font-size: 0.78rem;
        font-weight: 600;
        gap: 0.3rem;
      }

      .full-row {
        grid-column: 1 / -1;
      }

      .form-actions {
        display: flex;
        gap: 0.5rem;
      }

      .primary-button {
        background: #1d4ed8;
        border: 0;
        border-radius: 8px;
        color: #ffffff;
        cursor: pointer;
        font-size: 0.8rem;
        font-weight: 600;
        padding: 0.45rem 0.75rem;
      }

      .secondary-button {
        background: #ffffff;
        border: 1px solid #d0d5dd;
        border-radius: 8px;
        color: #344054;
        cursor: pointer;
        font-size: 0.8rem;
        font-weight: 600;
        padding: 0.45rem 0.75rem;
      }

      .primary-button:disabled,
      .secondary-button:disabled {
        cursor: not-allowed;
        opacity: 0.7;
      }

      .detail-grid {
        display: grid;
        gap: 0.45rem;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }

      .detail-grid p {
        margin: 0;
      }

      .full-width {
        grid-column: 1 / -1;
      }

      .table-wrap {
        overflow-x: auto;
      }

      .table {
        border-collapse: collapse;
        min-width: 900px;
        width: 100%;
      }

      .table th,
      .table td {
        border-bottom: 1px solid #eaecf0;
        font-size: 0.82rem;
        padding: 0.55rem 0.5rem;
        text-align: left;
      }

      .table th {
        color: #475467;
        font-weight: 600;
      }

      .row-actions {
        display: flex;
        gap: 0.35rem;
      }

      .table-action {
        background: #ffffff;
        border: 1px solid #d0d5dd;
        border-radius: 8px;
        color: #344054;
        cursor: pointer;
        font-size: 0.74rem;
        font-weight: 600;
        padding: 0.22rem 0.45rem;
      }

      .badge {
        border-radius: 999px;
        display: inline-block;
        font-size: 0.72rem;
        font-weight: 600;
        padding: 0.2rem 0.5rem;
      }

      .status-active {
        background: #ecfdf3;
        color: #067647;
      }

      .status-inactive {
        background: #fef3f2;
        color: #b42318;
      }

      .error-box,
      .success-box {
        border-radius: 8px;
        font-size: 0.82rem;
        margin-bottom: 0.75rem;
        padding: 0.55rem 0.7rem;
      }

      .error-box {
        background: #fef3f2;
        border: 1px solid #fecdca;
        color: #b42318;
      }

      .success-box {
        background: #ecfdf3;
        border: 1px solid #abefc6;
        color: #067647;
      }

      .field-error {
        color: #b42318;
        font-size: 0.78rem;
        margin: 0;
      }

      .empty {
        margin-top: 0.75rem;
      }
    `
  ]
})
export class PatientsPage implements OnInit {
  private readonly patientService = inject(PatientService);
  private readonly fb = inject(NonNullableFormBuilder);

  patients: Patient[] = [];
  selectedPatient: Patient | null = null;
  loading = false;
  detailLoading = false;
  formSubmitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  fieldError: string | null = null;
  activeSearch = '';
  showForm = false;
  formMode: PatientFormMode = 'create';
  editingPatientId: number | null = null;

  readonly patientForm = this.fb.group({
    first_name: ['', [Validators.required]],
    last_name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.minLength(8)]],
    date_of_birth: [''],
    phone: [''],
    address: [''],
    emergency_contact: [''],
    emergency_phone: [''],
    blood_type: [''],
    allergies: [''],
    medical_history: ['']
  });

  ngOnInit(): void {
    this.loadPatients();
  }

  applySearch(searchValue: string): void {
    this.activeSearch = searchValue.trim();
    this.loadPatients();
  }

  loadPatients(): void {
    this.loading = true;
    this.errorMessage = null;

    const filters = this.activeSearch ? { search: this.activeSearch } : undefined;
    this.patientService
      .getPatients(filters)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (patients) => {
          this.patients = patients;
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  openCreateForm(): void {
    this.formMode = 'create';
    this.editingPatientId = null;
    this.showForm = true;
    this.selectedPatient = null;
    this.successMessage = null;
    this.fieldError = null;
    this.patientForm.reset({
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      date_of_birth: '',
      phone: '',
      address: '',
      emergency_contact: '',
      emergency_phone: '',
      blood_type: '',
      allergies: '',
      medical_history: ''
    });
    this.patientForm.controls.password.setValidators([Validators.required, Validators.minLength(8)]);
    this.patientForm.controls.password.updateValueAndValidity();
  }

  closeForm(): void {
    this.showForm = false;
    this.fieldError = null;
  }

  viewPatient(patientId: number): void {
    this.showForm = false;
    this.fieldError = null;
    this.successMessage = null;
    this.detailLoading = true;
    this.errorMessage = null;

    this.patientService
      .getPatientById(patientId)
      .pipe(finalize(() => (this.detailLoading = false)))
      .subscribe({
        next: (patient) => {
          this.selectedPatient = patient;
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  startEdit(patient: Patient): void {
    this.showForm = true;
    this.formMode = 'edit';
    this.editingPatientId = patient.id;
    this.successMessage = null;
    this.fieldError = null;
    this.selectedPatient = patient;
    this.patientForm.controls.password.clearValidators();
    this.patientForm.controls.password.setValidators([Validators.minLength(8)]);
    this.patientForm.controls.password.updateValueAndValidity();
    this.patientForm.patchValue({
      first_name: patient.first_name || '',
      last_name: patient.last_name || '',
      email: patient.email || '',
      password: '',
      date_of_birth: patient.date_of_birth || '',
      phone: patient.phone || '',
      address: patient.address || '',
      emergency_contact: patient.emergency_contact || '',
      emergency_phone: patient.emergency_phone || '',
      blood_type: patient.blood_type || '',
      allergies: patient.allergies || '',
      medical_history: patient.medical_history || ''
    });
  }

  submitForm(): void {
    if (this.patientForm.invalid) {
      this.patientForm.markAllAsTouched();
      this.fieldError = 'Revisa los campos requeridos y el formato del formulario.';
      return;
    }

    const formValue = this.patientForm.getRawValue();
    const firstName = formValue.first_name.trim();
    const lastName = formValue.last_name.trim();
    const email = formValue.email.trim();
    const password = formValue.password.trim();

    this.formSubmitting = true;
    this.errorMessage = null;
    this.fieldError = null;
    this.successMessage = null;

    if (this.formMode === 'create') {
      if (!firstName || !lastName || !email || !password) {
        this.formSubmitting = false;
        this.fieldError = 'Nombre, apellido, correo y password son obligatorios.';
        return;
      }

      const createPayload: CreatePatientPayload = {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        date_of_birth: this.trimOrNull(formValue.date_of_birth),
        phone: this.trimOrNull(formValue.phone),
        address: this.trimOrNull(formValue.address),
        emergency_contact: this.trimOrNull(formValue.emergency_contact),
        emergency_phone: this.trimOrNull(formValue.emergency_phone),
        blood_type: this.trimOrNull(formValue.blood_type),
        allergies: this.trimOrNull(formValue.allergies),
        medical_history: this.trimOrNull(formValue.medical_history)
      };

      this.patientService
        .createPatient(createPayload)
        .pipe(finalize(() => (this.formSubmitting = false)))
        .subscribe({
          next: (createdPatient) => {
            this.patients = [createdPatient, ...this.patients];
            this.selectedPatient = createdPatient;
            this.showForm = false;
            this.successMessage = `Paciente #${createdPatient.id} creado correctamente.`;
          },
          error: (error: unknown) => {
            this.errorMessage = this.resolveErrorMessage(error);
          }
        });
      return;
    }

    if (!this.editingPatientId) {
      this.formSubmitting = false;
      this.fieldError = 'No se encontro el paciente a editar.';
      return;
    }

    const updatePayload: UpdatePatientPayload = this.cleanOptionalStrings({
      first_name: formValue.first_name,
      last_name: formValue.last_name,
      email: formValue.email,
      password: formValue.password,
      date_of_birth: formValue.date_of_birth,
      phone: formValue.phone,
      address: formValue.address,
      emergency_contact: formValue.emergency_contact,
      emergency_phone: formValue.emergency_phone,
      blood_type: formValue.blood_type,
      allergies: formValue.allergies,
      medical_history: formValue.medical_history
    });

    this.patientService
      .updatePatient(this.editingPatientId, updatePayload)
      .pipe(finalize(() => (this.formSubmitting = false)))
      .subscribe({
        next: (updatedPatient) => {
          this.patients = this.patients.map((patient) =>
            patient.id === updatedPatient.id ? { ...patient, ...updatedPatient } : patient
          );
          this.selectedPatient = updatedPatient;
          this.showForm = false;
          this.successMessage = `Paciente #${updatedPatient.id} actualizado correctamente.`;
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  private cleanOptionalStrings(payload: Record<string, string>): Record<string, string> {
    const cleanPayload: Record<string, string> = {};
    Object.entries(payload).forEach(([key, value]) => {
      const trimmedValue = value.trim();
      if (trimmedValue.length > 0) {
        cleanPayload[key] = trimmedValue;
      }
    });
    return cleanPayload;
  }

  private trimOrNull(value: string): string | null {
    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : null;
  }

  private resolveErrorMessage(error: unknown): string {
    if (this.isApiErrorShape(error)) {
      const msg = error.error?.message ?? error.error?.msg ?? error.error?.error;
      if (typeof msg === 'string' && msg.trim().length > 0) {
        return msg;
      }
    }
    return 'No se pudo completar la operacion de pacientes.';
  }

  private isApiErrorShape(value: unknown): value is ApiErrorShape {
    return typeof value === 'object' && value !== null && 'error' in value;
  }
}
