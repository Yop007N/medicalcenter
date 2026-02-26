import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ClinicalFile, FileService } from '../core/services/file.service';
import { pageShellStyles } from './page-shell.styles';

type ApiErrorShape = {
  error?: {
    message?: string;
    msg?: string;
    error?: string;
  };
};

@Component({
  selector: 'app-files-page',
  standalone: true,
  imports: [CommonModule, DatePipe, ReactiveFormsModule],
  template: `
    <section class="page">
      <h1>Archivos Clinicos</h1>
      <p>Carga, descarga y eliminacion de archivos asociados a historia clinica.</p>

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
        <button type="button" class="toolbar-button" (click)="toggleUploadForm()" [disabled]="uploading">
          @if (showUploadForm) { Ocultar carga } @else { Subir archivo }
        </button>
        <button type="button" class="toolbar-button" (click)="loadFiles()" [disabled]="loading">
          @if (loading) { Cargando... } @else { Actualizar }
        </button>
      </div>

      @if (errorMessage) {
        <div class="error-box" role="alert">{{ errorMessage }}</div>
      }

      @if (successMessage) {
        <div class="success-box" role="status">{{ successMessage }}</div>
      }

      @if (showUploadForm) {
        <article class="card form-card">
          <h2 class="card-title">Subir archivo clinico</h2>
          <form [formGroup]="uploadForm" (ngSubmit)="uploadFile()" class="form-grid" novalidate>
            <label>
              Medical record ID
              <input type="number" min="1" formControlName="medical_record_id" />
            </label>

            <label>
              Tipo
              <select formControlName="file_type">
                <option value="xray">xray</option>
                <option value="lab">lab</option>
                <option value="prescription">prescription</option>
                <option value="report">report</option>
                <option value="other">other</option>
              </select>
            </label>

            <label class="full-row">
              Descripcion
              <textarea rows="2" formControlName="description"></textarea>
            </label>

            <label class="full-row">
              Archivo
              <input type="file" (change)="onFileSelected($event)" />
            </label>

            @if (selectedFileName) {
              <p class="file-selected full-row">Seleccionado: {{ selectedFileName }}</p>
            }

            @if (fieldError) {
              <p class="field-error full-row">{{ fieldError }}</p>
            }

            <div class="form-actions full-row">
              <button class="primary-button" type="submit" [disabled]="uploading">
                @if (uploading) { Subiendo... } @else { Subir }
              </button>
              <button class="secondary-button" type="button" (click)="resetUploadForm()" [disabled]="uploading">
                Limpiar
              </button>
            </div>
          </form>
        </article>
      }

      @if (!loading && files.length === 0 && !errorMessage) {
        <article class="card empty">
          <h2 class="card-title">Sin archivos</h2>
          <p class="card-text">No hay archivos para el filtro aplicado.</p>
        </article>
      }

      @if (files.length > 0) {
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Archivo</th>
                <th>Paciente</th>
                <th>Record</th>
                <th>Tipo</th>
                <th>Tamano</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (file of files; track file.id) {
                <tr>
                  <td>#{{ file.id }}</td>
                  <td>{{ file.filename }}</td>
                  <td>{{ file.patient_id || '-' }}</td>
                  <td>{{ file.medical_record_id }}</td>
                  <td>{{ file.file_type }}</td>
                  <td>{{ formatFileSize(file.file_size) }}</td>
                  <td>{{ file.upload_date || file.created_at | date:'short' }}</td>
                  <td>
                    <div class="row-actions">
                      <button
                        type="button"
                        class="table-action"
                        (click)="download(file)"
                        [disabled]="downloadingIds.has(file.id)"
                      >
                        @if (downloadingIds.has(file.id)) { Descargando... } @else { Descargar }
                      </button>
                      <button
                        type="button"
                        class="table-action danger"
                        (click)="deleteFile(file)"
                        [disabled]="deletingIds.has(file.id)"
                      >
                        @if (deletingIds.has(file.id)) { Eliminando... } @else { Eliminar }
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
      input,
      textarea,
      select {
        border: 1px solid var(--ms-border);
        border-radius: 8px;
        font-size: 0.82rem;
        padding: 0.45rem 0.6rem;
      }

      .search-input {
        flex: 1 1 220px;
        min-width: 180px;
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

      .table-wrap {
        overflow-x: auto;
      }

      .table {
        border-collapse: collapse;
        min-width: 920px;
        width: 100%;
      }

      .table th,
      .table td {
        border-bottom: 1px solid var(--ms-border);
        font-size: 0.82rem;
        padding: 0.55rem 0.5rem;
        text-align: left;
        vertical-align: middle;
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

      .table-action.danger {
        border-color: var(--ms-danger-soft-border);
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

      .file-selected {
        color: var(--ms-text-secondary);
        font-size: 0.78rem;
        margin: 0;
      }

      .empty {
        margin-top: 0.75rem;
      }
    `
  ]
})
export class FilesPage implements OnInit {
  private readonly fileService = inject(FileService);
  private readonly fb = inject(NonNullableFormBuilder);

  files: ClinicalFile[] = [];
  loading = false;
  uploading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  fieldError: string | null = null;
  showUploadForm = false;
  activePatientId: number | undefined;
  selectedFile: File | null = null;
  selectedFileName = '';
  downloadingIds = new Set<number>();
  deletingIds = new Set<number>();

  readonly uploadForm = this.fb.group({
    medical_record_id: [1, [Validators.required, Validators.min(1)]],
    file_type: ['other', [Validators.required]],
    description: ['']
  });

  ngOnInit(): void {
    this.loadFiles();
  }

  applyPatientFilter(rawValue: string): void {
    const patientId = Number(rawValue);
    this.activePatientId = Number.isInteger(patientId) && patientId > 0 ? patientId : undefined;
    this.loadFiles();
  }

  loadFiles(): void {
    this.loading = true;
    this.errorMessage = null;

    const filters = this.activePatientId ? { patient_id: this.activePatientId } : undefined;
    this.fileService
      .listFiles(filters)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (files) => {
          this.files = [...files].sort((a, b) => {
            const dateA = new Date(a.upload_date || a.created_at || '').getTime();
            const dateB = new Date(b.upload_date || b.created_at || '').getTime();
            return dateB - dateA;
          });
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  toggleUploadForm(): void {
    this.showUploadForm = !this.showUploadForm;
    if (!this.showUploadForm) {
      this.resetUploadForm();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.selectedFile = file;
    this.selectedFileName = file?.name || '';
  }

  uploadFile(): void {
    if (this.uploadForm.invalid) {
      this.uploadForm.markAllAsTouched();
      this.fieldError = 'Completa los campos requeridos.';
      return;
    }

    if (!this.selectedFile) {
      this.fieldError = 'Selecciona un archivo para continuar.';
      return;
    }

    const payload = this.uploadForm.getRawValue();
    this.fieldError = null;
    this.errorMessage = null;
    this.successMessage = null;
    this.uploading = true;

    this.fileService
      .uploadFile({
        file: this.selectedFile,
        medicalRecordId: payload.medical_record_id,
        fileType: payload.file_type,
        description: payload.description,
        patientId: this.activePatientId
      })
      .pipe(finalize(() => (this.uploading = false)))
      .subscribe({
        next: (uploadedFile) => {
          this.files = [uploadedFile, ...this.files];
          this.successMessage = `Archivo #${uploadedFile.id} subido correctamente.`;
          this.resetUploadForm();
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  download(file: ClinicalFile): void {
    this.downloadingIds.add(file.id);
    this.errorMessage = null;

    this.fileService.downloadFile(file.id).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = file.filename || `file-${file.id}`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(objectUrl);
        this.downloadingIds.delete(file.id);
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error);
        this.downloadingIds.delete(file.id);
      }
    });
  }

  deleteFile(file: ClinicalFile): void {
    const confirmed = globalThis.confirm(`Eliminar archivo #${file.id} (${file.filename})?`);
    if (!confirmed) {
      return;
    }

    this.deletingIds.add(file.id);
    this.errorMessage = null;
    this.successMessage = null;

    this.fileService.deleteFile(file.id).subscribe({
      next: () => {
        this.files = this.files.filter((item) => item.id !== file.id);
        this.successMessage = `Archivo #${file.id} eliminado.`;
        this.deletingIds.delete(file.id);
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error);
        this.deletingIds.delete(file.id);
      }
    });
  }

  resetUploadForm(): void {
    this.uploadForm.reset({
      medical_record_id: 1,
      file_type: 'other',
      description: ''
    });
    this.selectedFile = null;
    this.selectedFileName = '';
    this.fieldError = null;
  }

  formatFileSize(sizeInBytes: number): string {
    if (!sizeInBytes || sizeInBytes <= 0) {
      return '0 B';
    }

    if (sizeInBytes < 1024) {
      return `${sizeInBytes} B`;
    }
    if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    }
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private resolveErrorMessage(error: unknown): string {
    if (this.isApiErrorShape(error)) {
      const msg = error.error?.message ?? error.error?.msg ?? error.error?.error;
      if (typeof msg === 'string' && msg.trim().length > 0) {
        return msg;
      }
    }
    return 'No se pudieron completar las operaciones de archivos.';
  }

  private isApiErrorShape(value: unknown): value is ApiErrorShape {
    return typeof value === 'object' && value !== null && 'error' in value;
  }
}
