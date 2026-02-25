import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { MedicalRecordService } from '../core/services/medical-record.service';
import { MedicalRecord } from '../shared/models/medical-record.model';
import { pageShellStyles } from './page-shell.styles';

type ApiErrorShape = {
  error?: {
    message?: string;
    msg?: string;
    error?: string;
  };
};

type FormMode = 'create' | 'edit';

@Component({
  selector: 'app-medical-records-page',
  standalone: true,
  imports: [CommonModule, DatePipe, ReactiveFormsModule],
  template: `
    <section class="page">
      <h1>Registros Medicos</h1>
      <p>Consulta y gestion de historial clinico por paciente.</p>

      <div class="toolbar">
        <input
          #patientInput
          type="number"
          min="1"
          class="search-input"
          placeholder="Filtrar por patient_id"
          (keyup.enter)="applyPatientFilter(patientInput.value)"
        />
        <button type="button" class="toolbar-button" (click)="applyPatientFilter(patientInput.value)" [disabled]="loading">
          Filtrar
        </button>
        <button type="button" class="toolbar-button" (click)="openCreateForm()" [disabled]="submitting">
          Nuevo registro
        </button>
        <button type="button" class="toolbar-button" (click)="loadRecords()" [disabled]="loading">
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
            @if (formMode === 'create') { Crear registro medico } @else { Editar registro #{{ editingRecordId }} }
          </h2>
          <form [formGroup]="recordForm" (ngSubmit)="submitForm()" class="form-grid" novalidate>
            <label>
              Patient ID
              <input type="number" min="1" formControlName="patient_id" [readonly]="formMode === 'edit'" />
            </label>
            <label>
              Queja principal
              <input type="text" formControlName="chief_complaint" />
            </label>
            <label>
              Diagnostico
              <input type="text" formControlName="diagnosis" />
            </label>
            <label>
              Tratamiento
              <input type="text" formControlName="treatment" />
            </label>
            <label class="full-row">
              Prescripciones
              <textarea rows="2" formControlName="prescriptions"></textarea>
            </label>
            <label class="full-row">
              Notas
              <textarea rows="2" formControlName="notes"></textarea>
            </label>
            @if (fieldError) {
              <p class="field-error full-row">{{ fieldError }}</p>
            }
            <div class="form-actions full-row">
              <button class="primary-button" type="submit" [disabled]="submitting">
                @if (submitting) { Guardando... } @else if (formMode === 'create') { Crear } @else { Guardar }
              </button>
              <button class="secondary-button" type="button" (click)="closeForm()" [disabled]="submitting">
                Cancelar
              </button>
            </div>
          </form>
        </article>
      }

      @if (!loading && records.length === 0 && !errorMessage) {
        <article class="card empty">
          <h2 class="card-title">Sin registros</h2>
          <p class="card-text">No se encontraron registros medicos para el filtro aplicado.</p>
        </article>
      }

      @if (records.length > 0) {
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Paciente</th>
                <th>Profesional</th>
                <th>Diagnostico</th>
                <th>Files</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (record of records; track record.id) {
                <tr>
                  <td>#{{ record.id }}</td>
                  <td>{{ record.record_date || record.created_at | date:'short' }}</td>
                  <td>
                    {{
                      record.patient
                        ? (record.patient.first_name + ' ' + record.patient.last_name)
                        : ('ID ' + record.patient_id)
                    }}
                  </td>
                  <td>
                    {{
                      record.professional
                        ? (record.professional.first_name + ' ' + record.professional.last_name)
                        : ('ID ' + record.professional_id)
                    }}
                  </td>
                  <td>{{ record.diagnosis || '-' }}</td>
                  <td>{{ record.files?.length || 0 }}</td>
                  <td>
                    <div class="row-actions">
                      <button class="table-action" type="button" (click)="startEdit(record)">Editar</button>
                      <button class="table-action danger" type="button" (click)="deleteRecord(record)">Eliminar</button>
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
        flex: 1 1 240px;
        min-width: 200px;
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

      .form-card {
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

      .table-wrap {
        overflow-x: auto;
      }

      .table {
        border-collapse: collapse;
        min-width: 960px;
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

      .table-action.danger {
        border-color: #fecdca;
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
export class MedicalRecordsPage implements OnInit {
  private readonly medicalRecordService = inject(MedicalRecordService);
  private readonly fb = inject(NonNullableFormBuilder);

  records: MedicalRecord[] = [];
  loading = false;
  submitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  fieldError: string | null = null;
  activePatientId: number | null = null;
  showForm = false;
  formMode: FormMode = 'create';
  editingRecordId: number | null = null;

  readonly recordForm = this.fb.group({
    patient_id: [1, [Validators.required, Validators.min(1)]],
    chief_complaint: [''],
    diagnosis: [''],
    treatment: [''],
    prescriptions: [''],
    notes: ['']
  });

  ngOnInit(): void {
    this.loadRecords();
  }

  applyPatientFilter(rawValue: string): void {
    const parsedValue = Number(rawValue);
    if (Number.isInteger(parsedValue) && parsedValue > 0) {
      this.activePatientId = parsedValue;
    } else {
      this.activePatientId = null;
    }
    this.loadRecords();
  }

  loadRecords(): void {
    this.loading = true;
    this.errorMessage = null;

    const filters = this.activePatientId ? { patient_id: this.activePatientId } : undefined;
    this.medicalRecordService
      .getMedicalRecords(filters)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (records) => {
          this.records = [...records].sort(
            (a, b) => new Date(b.record_date || b.created_at).getTime() - new Date(a.record_date || a.created_at).getTime()
          );
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  openCreateForm(): void {
    this.formMode = 'create';
    this.editingRecordId = null;
    this.showForm = true;
    this.successMessage = null;
    this.fieldError = null;
    this.recordForm.reset({
      patient_id: this.activePatientId ?? 1,
      chief_complaint: '',
      diagnosis: '',
      treatment: '',
      prescriptions: '',
      notes: ''
    });
  }

  closeForm(): void {
    this.showForm = false;
    this.fieldError = null;
  }

  startEdit(record: MedicalRecord): void {
    this.formMode = 'edit';
    this.editingRecordId = record.id;
    this.showForm = true;
    this.successMessage = null;
    this.fieldError = null;
    this.recordForm.patchValue({
      patient_id: record.patient_id,
      chief_complaint: record.chief_complaint || '',
      diagnosis: record.diagnosis || '',
      treatment: record.treatment || '',
      prescriptions: record.prescriptions || '',
      notes: record.notes || ''
    });
  }

  submitForm(): void {
    if (this.recordForm.invalid) {
      this.recordForm.markAllAsTouched();
      this.fieldError = 'Patient ID es obligatorio y debe ser mayor a cero.';
      return;
    }

    const formValue = this.recordForm.getRawValue();
    const payload: Partial<MedicalRecord> = this.cleanPayload({
      patient_id: formValue.patient_id,
      chief_complaint: formValue.chief_complaint,
      diagnosis: formValue.diagnosis,
      treatment: formValue.treatment,
      prescriptions: formValue.prescriptions,
      notes: formValue.notes
    });

    this.submitting = true;
    this.errorMessage = null;
    this.fieldError = null;
    this.successMessage = null;

    if (this.formMode === 'create') {
      this.medicalRecordService
        .createMedicalRecord(payload)
        .pipe(finalize(() => (this.submitting = false)))
        .subscribe({
          next: (createdRecord) => {
            this.records = [createdRecord, ...this.records];
            this.showForm = false;
            this.successMessage = `Registro #${createdRecord.id} creado correctamente.`;
          },
          error: (error: unknown) => {
            this.errorMessage = this.resolveErrorMessage(error);
          }
        });
      return;
    }

    if (!this.editingRecordId) {
      this.submitting = false;
      this.fieldError = 'No se encontro el registro medico a editar.';
      return;
    }

    this.medicalRecordService
      .updateMedicalRecord(this.editingRecordId, payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: (updatedRecord) => {
          this.records = this.records.map((record) =>
            record.id === updatedRecord.id ? { ...record, ...updatedRecord } : record
          );
          this.showForm = false;
          this.successMessage = `Registro #${updatedRecord.id} actualizado correctamente.`;
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  deleteRecord(record: MedicalRecord): void {
    const confirmed = window.confirm(`Eliminar registro medico #${record.id}?`);
    if (!confirmed) {
      return;
    }

    this.errorMessage = null;
    this.successMessage = null;
    this.medicalRecordService.deleteMedicalRecord(record.id).subscribe({
      next: () => {
        this.records = this.records.filter((item) => item.id !== record.id);
        this.successMessage = `Registro #${record.id} eliminado correctamente.`;
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  private cleanPayload(payload: Record<string, string | number>): Partial<MedicalRecord> {
    const result: Record<string, string | number> = {};
    Object.entries(payload).forEach(([key, value]) => {
      if (typeof value === 'number') {
        result[key] = value;
        return;
      }
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        result[key] = trimmed;
      }
    });
    return result;
  }

  private resolveErrorMessage(error: unknown): string {
    if (this.isApiErrorShape(error)) {
      const msg = error.error?.message ?? error.error?.msg ?? error.error?.error;
      if (typeof msg === 'string' && msg.trim().length > 0) {
        return msg;
      }
    }
    return 'No se pudieron gestionar los registros medicos.';
  }

  private isApiErrorShape(value: unknown): value is ApiErrorShape {
    return typeof value === 'object' && value !== null && 'error' in value;
  }
}
