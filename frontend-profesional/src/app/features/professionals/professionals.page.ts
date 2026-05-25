import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';
import {
  CreateProfessionalPayload,
  ProfessionalService,
  UpdateProfessionalPayload
} from '../../core/services/professional.service';
import { Professional } from '../../shared/models/user.model';
import { pageShellStyles } from '../../shared/styles/page-shell.styles';

type ApiErrorShape = {
  error?: {
    message?: string;
    msg?: string;
    error?: string;
  };
};

type ProfessionalFormMode = 'create' | 'edit';

@Component({
  selector: 'app-professionals-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="page">
      <h1>Profesionales</h1>
      <p>Gestion de plantilla clinica, especialidades y estado operativo.</p>

      <div class="toolbar">
        <input
          #specialtyInput
          type="search"
          class="search-input"
          placeholder="Filtrar por especialidad"
          aria-label="Filtrar por especialidad"
          (keyup.enter)="applySpecialty(specialtyInput.value)"
        />
        <button type="button" class="toolbar-button" (click)="applySpecialty(specialtyInput.value)" [disabled]="loading">
          Filtrar
        </button>
        @if (canCreateProfessional) {
          <button type="button" class="toolbar-button" (click)="openCreateForm()" [disabled]="formSubmitting">
            Nuevo profesional
          </button>
        }
        <button type="button" class="toolbar-button" (click)="loadProfessionals()" [disabled]="loading">
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
            @if (formMode === 'create') { Crear profesional } @else { Editar profesional #{{ editingProfessionalId }} }
          </h2>

          <form [formGroup]="professionalForm" (ngSubmit)="submitForm()" novalidate class="form-grid">
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
              <input type="email" formControlName="email" [readonly]="formMode === 'edit'" />
            </label>

            <label>
              Password
              <input type="password" formControlName="password" placeholder="********" />
            </label>

            <label>
              Matricula
              <input type="text" formControlName="license_number" />
            </label>

            <label>
              Especialidad
              <input type="text" formControlName="specialty" />
            </label>

            <label>
              Telefono
              <input type="text" formControlName="phone" />
            </label>

            <label class="full-row">
              Direccion
              <input type="text" formControlName="address" />
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

      @if (selectedProfessional && !detailLoading) {
        <article class="card detail-card">
          <h2 class="card-title">Detalle profesional #{{ selectedProfessional.id }}</h2>
          <div class="detail-grid">
            <p><strong>Nombre:</strong> {{ selectedProfessional.first_name }} {{ selectedProfessional.last_name }}</p>
            <p><strong>Email:</strong> {{ selectedProfessional.email }}</p>
            <p><strong>Especialidad:</strong> {{ selectedProfessional.specialty || '-' }}</p>
            <p><strong>Matricula:</strong> {{ selectedProfessional.license_number || '-' }}</p>
            <p><strong>Telefono:</strong> {{ selectedProfessional.phone || '-' }}</p>
            <p class="full-width"><strong>Direccion:</strong> {{ selectedProfessional.address || '-' }}</p>
          </div>
        </article>
      }

      @if (!loading && professionals.length === 0 && !errorMessage) {
        <article class="card empty">
          <h2 class="card-title">Sin profesionales</h2>
          <p class="card-text">No se encontraron profesionales para el filtro aplicado.</p>
        </article>
      }

      @if (professionals.length > 0) {
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Especialidad</th>
                <th>Matricula</th>
                <th>Activo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (professional of professionals; track professional.id) {
                <tr>
                  <td>#{{ professional.id }}</td>
                  <td>{{ professional.first_name }} {{ professional.last_name }}</td>
                  <td>{{ professional.email }}</td>
                  <td>{{ professional.specialty || '-' }}</td>
                  <td>{{ professional.license_number || '-' }}</td>
                  <td>
                    <span class="badge" [class]="professional.is_active ? 'status-active' : 'status-inactive'">
                      {{ professional.is_active ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td>
                    <div class="row-actions">
                      <button class="table-action" type="button" (click)="viewProfessional(professional.id)">Ver</button>
                      <button
                        class="table-action"
                        type="button"
                        (click)="startEdit(professional)"
                        [disabled]="!canEditProfessional(professional)"
                      >
                        Editar
                      </button>
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
      input {
        border: 1px solid var(--ms-border);
        border-radius: 8px;
        font-size: 0.82rem;
        padding: 0.45rem 0.6rem;
      }

      .search-input {
        flex: 1 1 260px;
        min-width: 220px;
      }

      .toolbar-button {
        background: var(--ms-bg-card);
        border: 1px solid var(--ms-border);
        border-radius: 8px;
        color: var(--ms-text-primary);
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
        color: var(--ms-text-primary);
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
        background: var(--ms-primary);
        border: 0;
        border-radius: 8px;
        color: var(--ms-bg-card);
        cursor: pointer;
        font-size: 0.8rem;
        font-weight: 600;
        padding: 0.45rem 0.75rem;
      }

      .secondary-button {
        background: var(--ms-bg-card);
        border: 1px solid var(--ms-border);
        border-radius: 8px;
        color: var(--ms-text-primary);
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
        border-bottom: 1px solid var(--ms-border);
        font-size: 0.82rem;
        padding: 0.55rem 0.5rem;
        text-align: left;
      }

      .table th {
        color: var(--ms-text-secondary);
        font-weight: 600;
      }

      .row-actions {
        display: flex;
        gap: 0.35rem;
      }

      .table-action {
        background: var(--ms-bg-card);
        border: 1px solid var(--ms-border);
        border-radius: 8px;
        color: var(--ms-text-primary);
        cursor: pointer;
        font-size: 0.74rem;
        font-weight: 600;
        padding: 0.22rem 0.45rem;
      }

      .table-action:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }

      .badge {
        border-radius: 999px;
        display: inline-block;
        font-size: 0.72rem;
        font-weight: 600;
        padding: 0.2rem 0.5rem;
      }

      .status-active {
        background: var(--ms-success-soft-bg);
        color: var(--ms-success);
      }

      .status-inactive {
        background: var(--ms-danger-soft-bg);
        color: var(--ms-danger);
      }

      .error-box,
      .success-box {
        border-radius: 8px;
        font-size: 0.82rem;
        margin-bottom: 0.75rem;
        padding: 0.55rem 0.7rem;
      }

      .error-box {
        background: var(--ms-danger-soft-bg);
        border: 1px solid var(--ms-danger-soft-border);
        color: var(--ms-danger);
      }

      .success-box {
        background: var(--ms-success-soft-bg);
        border: 1px solid var(--ms-success-soft-border);
        color: var(--ms-success);
      }

      .field-error {
        color: var(--ms-danger);
        font-size: 0.78rem;
        margin: 0;
      }

      .empty {
        margin-top: 0.75rem;
      }
    `
  ]
})
export class ProfessionalsPage implements OnInit {
  private readonly professionalService = inject(ProfessionalService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(NonNullableFormBuilder);

  professionals: Professional[] = [];
  selectedProfessional: Professional | null = null;
  loading = false;
  detailLoading = false;
  formSubmitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  fieldError: string | null = null;
  activeSpecialty = '';
  showForm = false;
  formMode: ProfessionalFormMode = 'create';
  editingProfessionalId: number | null = null;
  currentUserRole = '';
  currentUserId: number | null = null;

  readonly professionalForm = this.fb.group({
    first_name: ['', [Validators.required]],
    last_name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.minLength(8)]],
    license_number: ['', [Validators.required]],
    specialty: [''],
    phone: [''],
    address: ['']
  });

  get canCreateProfessional(): boolean {
    return this.currentUserRole === 'admin';
  }

  ngOnInit(): void {
    const currentUser = this.authService.currentUserValue;
    this.currentUserRole = currentUser?.role ?? '';
    this.currentUserId = currentUser?.id ?? null;
    this.loadProfessionals();
  }

  applySpecialty(specialty: string): void {
    this.activeSpecialty = specialty.trim();
    this.loadProfessionals();
  }

  loadProfessionals(): void {
    this.loading = true;
    this.errorMessage = null;

    const filters = this.activeSpecialty ? { specialty: this.activeSpecialty } : undefined;
    this.professionalService
      .getProfessionals(filters)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (professionals) => {
          this.professionals = professionals;
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  viewProfessional(professionalId: number): void {
    this.showForm = false;
    this.fieldError = null;
    this.successMessage = null;
    this.detailLoading = true;
    this.errorMessage = null;

    this.professionalService
      .getProfessionalById(professionalId)
      .pipe(finalize(() => (this.detailLoading = false)))
      .subscribe({
        next: (professional) => {
          this.selectedProfessional = professional;
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  openCreateForm(): void {
    if (!this.canCreateProfessional) {
      this.errorMessage = 'Solo administradores pueden crear profesionales.';
      return;
    }

    this.formMode = 'create';
    this.editingProfessionalId = null;
    this.showForm = true;
    this.selectedProfessional = null;
    this.successMessage = null;
    this.fieldError = null;
    this.professionalForm.reset({
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      license_number: '',
      specialty: '',
      phone: '',
      address: ''
    });
    this.professionalForm.controls.password.setValidators([Validators.required, Validators.minLength(8)]);
    this.professionalForm.controls.password.updateValueAndValidity();
  }

  closeForm(): void {
    this.showForm = false;
    this.fieldError = null;
  }

  canEditProfessional(professional: Professional): boolean {
    return this.currentUserRole === 'admin' || this.currentUserId === professional.id;
  }

  startEdit(professional: Professional): void {
    if (!this.canEditProfessional(professional)) {
      this.errorMessage = 'No tienes permisos para editar este profesional.';
      return;
    }

    this.showForm = true;
    this.formMode = 'edit';
    this.editingProfessionalId = professional.id;
    this.successMessage = null;
    this.fieldError = null;
    this.selectedProfessional = professional;
    this.professionalForm.controls.password.clearValidators();
    this.professionalForm.controls.password.setValidators([Validators.minLength(8)]);
    this.professionalForm.controls.password.updateValueAndValidity();
    this.professionalForm.patchValue({
      first_name: professional.first_name || '',
      last_name: professional.last_name || '',
      email: professional.email || '',
      password: '',
      license_number: professional.license_number || '',
      specialty: professional.specialty || '',
      phone: professional.phone || '',
      address: professional.address || ''
    });
  }

  submitForm(): void {
    if (this.professionalForm.invalid) {
      this.professionalForm.markAllAsTouched();
      this.fieldError = 'Revisa los campos requeridos y el formato del formulario.';
      return;
    }

    const formValue = this.professionalForm.getRawValue();
    const firstName = formValue.first_name.trim();
    const lastName = formValue.last_name.trim();
    const email = formValue.email.trim();
    const password = formValue.password.trim();
    const licenseNumber = formValue.license_number.trim();
    this.formSubmitting = true;
    this.errorMessage = null;
    this.fieldError = null;
    this.successMessage = null;

    if (this.formMode === 'create') {
      if (!firstName || !lastName || !email || !password || !licenseNumber) {
        this.formSubmitting = false;
        this.fieldError = 'Nombre, apellido, correo, password y matricula son obligatorios.';
        return;
      }

      const createPayload: CreateProfessionalPayload = {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        license_number: licenseNumber,
        specialty: this.trimOrNull(formValue.specialty),
        phone: this.trimOrNull(formValue.phone),
        address: this.trimOrNull(formValue.address)
      };

      this.professionalService
        .createProfessional(createPayload)
        .pipe(finalize(() => (this.formSubmitting = false)))
        .subscribe({
          next: (createdProfessional) => {
            this.professionals = [createdProfessional, ...this.professionals];
            this.selectedProfessional = createdProfessional;
            this.showForm = false;
            this.successMessage = `Profesional #${createdProfessional.id} creado correctamente.`;
          },
          error: (error: unknown) => {
            this.errorMessage = this.resolveErrorMessage(error);
          }
        });
      return;
    }

    if (!this.editingProfessionalId) {
      this.formSubmitting = false;
      this.fieldError = 'No se encontro el profesional a editar.';
      return;
    }

    const updatePayload: UpdateProfessionalPayload = this.cleanOptionalStrings({
      first_name: formValue.first_name,
      last_name: formValue.last_name,
      license_number: formValue.license_number,
      specialty: formValue.specialty,
      phone: formValue.phone,
      address: formValue.address,
      password: formValue.password
    });

    this.professionalService
      .updateProfessional(this.editingProfessionalId, updatePayload)
      .pipe(finalize(() => (this.formSubmitting = false)))
      .subscribe({
        next: (updatedProfessional) => {
          this.professionals = this.professionals.map((professional) =>
            professional.id === updatedProfessional.id ? { ...professional, ...updatedProfessional } : professional
          );
          this.selectedProfessional = updatedProfessional;
          this.showForm = false;
          this.successMessage = `Profesional #${updatedProfessional.id} actualizado correctamente.`;
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
    return 'No se pudo completar la operacion de profesionales.';
  }

  private isApiErrorShape(value: unknown): value is ApiErrorShape {
    return typeof value === 'object' && value !== null && 'error' in value;
  }
}
