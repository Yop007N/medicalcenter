import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import {
  DentalTreatment,
  DentalTreatmentPayload,
  Odontogram,
  OdontogramPayload,
  OdontologyService,
  Tooth,
  ToothStatus,
  ToothUpsertPayload,
  TreatmentStatus
} from '../../core/services/odontology.service';
import { UiDialogService } from '../../shared/services/ui-dialog.service';
import { pageShellStyles } from '../../shared/styles/page-shell.styles';

type ApiErrorShape = {
  error?: {
    message?: string;
    msg?: string;
    error?: string;
  };
};

@Component({
  selector: 'app-odontology-page',
  standalone: true,
  imports: [CommonModule, DatePipe, ReactiveFormsModule],
  template: `
    <section class="page">
      <h1>Odontologia</h1>
      <p>Gestion operativa de odontogramas, dientes y tratamientos por paciente.</p>

      <div class="toolbar">
        <input
          #patientInput
          type="number"
          min="1"
          class="search-input"
          placeholder="Filtrar por patient_id"
          aria-label="Filtrar por ID de paciente"
          (keyup.enter)="applyPatientFilter(patientInput.value)"
        />
        <button type="button" class="toolbar-button" (click)="applyPatientFilter(patientInput.value)">
          Filtrar
        </button>
        <select class="status-select" aria-label="Filtrar por estado del tratamiento" (change)="setTreatmentStatusFilter($any($event.target).value)">
          <option value="">Todos los estados</option>
          @for (status of treatmentStatusOptions; track status) {
            <option [value]="status">{{ status }}</option>
          }
        </select>
        <button type="button" class="toolbar-button" (click)="refreshAll()" [disabled]="loadingAny">
          @if (loadingAny) { Cargando... } @else { Actualizar }
        </button>
      </div>

      @if (errorMessage) {
        <div class="error-box" role="alert">{{ errorMessage }}</div>
      }

      @if (successMessage) {
        <div class="success-box" role="status">{{ successMessage }}</div>
      }

      <article class="card form-card">
        <h2 class="card-title">Crear odontograma</h2>
        <form [formGroup]="odontogramForm" (ngSubmit)="createOdontogram()" class="form-grid" novalidate>
          <label>
            Patient ID
            <input type="number" min="1" formControlName="patient_id" />
          </label>
          <label class="full-row">
            Notas
            <textarea rows="2" formControlName="notes"></textarea>
          </label>
          <div class="form-actions full-row">
            <button class="primary-button" type="submit" [disabled]="creatingOdontogram">
              @if (creatingOdontogram) { Creando... } @else { Crear odontograma }
            </button>
          </div>
        </form>
      </article>

      @if (odontograms.length > 0) {
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Paciente</th>
                <th>Profesional</th>
                <th>Activo</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (odontogram of odontograms; track odontogram.id) {
                <tr [class.selected-row]="odontogram.id === selectedOdontogramId">
                  <td>#{{ odontogram.id }}</td>
                  <td>{{ odontogram.patient_id }}</td>
                  <td>{{ odontogram.professional_id }}</td>
                  <td>{{ odontogram.is_active ? 'Si' : 'No' }}</td>
                  <td>{{ odontogram.created_at | date:'short' }}</td>
                  <td>
                    <button class="table-action" type="button" (click)="selectOdontogram(odontogram.id)">
                      Ver dientes
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (selectedOdontogramId) {
        <article class="card form-card">
          <h2 class="card-title">Actualizar diente (odontograma #{{ selectedOdontogramId }})</h2>
          <form [formGroup]="toothForm" (ngSubmit)="saveTooth()" class="form-grid" novalidate>
            <label>
              Numero FDI
              <input type="number" min="11" max="85" formControlName="tooth_number" />
            </label>
            <label>
              Estado
              <select formControlName="status">
                @for (status of toothStatusOptions; track status) {
                  <option [value]="status">{{ status }}</option>
                }
              </select>
            </label>
            <label class="full-row">
              Tratamiento planeado
              <input type="text" formControlName="planned_treatment" />
            </label>
            <label class="full-row">
              Notas
              <textarea rows="2" formControlName="notes"></textarea>
            </label>
            <div class="form-actions full-row">
              <button class="primary-button" type="submit" [disabled]="savingTooth">
                @if (savingTooth) { Guardando... } @else { Guardar diente }
              </button>
            </div>
          </form>
        </article>
      }

      @if (teeth.length > 0) {
        <div class="table-wrap">
          <table class="table compact-table">
            <thead>
              <tr>
                <th>Diente</th>
                <th>Estado</th>
                <th>Tratamiento planeado</th>
                <th>Notas</th>
              </tr>
            </thead>
            <tbody>
              @for (tooth of teeth; track tooth.id) {
                <tr>
                  <td>{{ tooth.tooth_number }}</td>
                  <td>{{ tooth.status }}</td>
                  <td>{{ tooth.planned_treatment || '-' }}</td>
                  <td>{{ tooth.notes || '-' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <article class="card form-card">
        <h2 class="card-title">Nuevo tratamiento dental</h2>
        <form [formGroup]="treatmentForm" (ngSubmit)="createTreatment()" class="form-grid" novalidate>
          <label>
            Patient ID
            <input type="number" min="1" formControlName="patient_id" />
          </label>
          <label>
            Tipo de tratamiento
            <select formControlName="treatment_type">
              @for (type of treatmentTypeOptions; track type.value) {
                <option [value]="type.value">{{ type.label }}</option>
              }
            </select>
          </label>
          <label>
            Fecha
            <input type="date" formControlName="treatment_date" />
          </label>
          <label>
            Diente afectado (opcional)
            <input type="number" min="11" max="85" formControlName="tooth_number" />
          </label>
          <label>
            Costo estimado (opcional)
            <input type="number" min="0" step="0.01" formControlName="estimated_cost" />
          </label>
          <label class="full-row">
            Descripcion
            <textarea rows="2" formControlName="description"></textarea>
          </label>
          <div class="form-actions full-row">
            <button class="primary-button" type="submit" [disabled]="creatingTreatment">
              @if (creatingTreatment) { Creando... } @else { Crear tratamiento }
            </button>
          </div>
        </form>
      </article>

      @if (treatments.length === 0 && !loadingTreatments) {
        <article class="card empty">
          <h2 class="card-title">Sin tratamientos</h2>
          <p class="card-text">No hay tratamientos para los filtros aplicados.</p>
        </article>
      }

      @if (treatments.length > 0) {
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Paciente</th>
                <th>Tipo</th>
                <th>Dientes</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Costo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (treatment of treatments; track treatment.id) {
                <tr>
                  <td>#{{ treatment.id }}</td>
                  <td>{{ treatment.patient_id }}</td>
                  <td>{{ treatment.treatment_type }}</td>
                  <td>{{ treatment.affected_teeth?.join(', ') || '-' }}</td>
                  <td>{{ treatment.status }}</td>
                  <td>{{ treatment.treatment_date | date:'mediumDate' }}</td>
                  <td>{{ treatment.final_cost || treatment.estimated_cost || '-' }}</td>
                  <td>
                    <div class="row-actions">
                      <button
                        class="table-action"
                        type="button"
                        (click)="markInProgress(treatment)"
                        [disabled]="processingTreatmentIds.has(treatment.id) || treatment.status === 'in_progress'"
                      >
                        En curso
                      </button>
                      <button
                        class="table-action secondary"
                        type="button"
                        (click)="completeTreatment(treatment)"
                        [disabled]="processingTreatmentIds.has(treatment.id) || treatment.status === 'completed'"
                      >
                        Completar
                      </button>
                      <button
                        class="table-action danger"
                        type="button"
                        (click)="cancelTreatment(treatment)"
                        [disabled]="processingTreatmentIds.has(treatment.id) || treatment.status === 'cancelled'"
                      >
                        Cancelar
                      </button>
                      <button
                        class="table-action danger"
                        type="button"
                        (click)="deleteTreatment(treatment)"
                        [disabled]="deletingTreatmentIds.has(treatment.id)"
                      >
                        Eliminar
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
      .status-select,
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

      .primary-button:disabled {
        cursor: not-allowed;
        opacity: 0.7;
      }

      .table-wrap {
        margin-bottom: 0.75rem;
        overflow-x: auto;
      }

      .table {
        border-collapse: collapse;
        min-width: 980px;
        width: 100%;
      }

      .compact-table {
        min-width: 680px;
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

      .selected-row {
        background: var(--ms-primary-soft-bg);
      }

      .row-actions {
        display: flex;
        flex-wrap: wrap;
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

      .table-action.secondary {
        border-color: var(--ms-primary-soft-border);
        color: var(--ms-primary);
      }

      .table-action.danger {
        border-color: var(--ms-danger-soft-border);
        color: var(--ms-danger);
      }

      .table-action:disabled {
        cursor: not-allowed;
        opacity: 0.6;
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
    `
  ]
})
export class OdontologyPage implements OnInit {
  private readonly odontologyService = inject(OdontologyService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly dialog = inject(UiDialogService);

  readonly toothStatusOptions: ToothStatus[] = [
    'healthy',
    'caries',
    'filled',
    'crown',
    'implant',
    'missing',
    'root_canal',
    'fractured',
    'mobile',
    'to_extract',
    'extracted'
  ];

  readonly treatmentStatusOptions: TreatmentStatus[] = [
    'planned',
    'in_progress',
    'completed',
    'cancelled',
    'postponed'
  ];

  readonly treatmentTypeOptions = [
    { value: 'consultation', label: 'Consulta' },
    { value: 'cleaning', label: 'Limpieza' },
    { value: 'filling', label: 'Empaste' },
    { value: 'root_canal', label: 'Endodoncia' },
    { value: 'extraction', label: 'Extraccion' },
    { value: 'crown', label: 'Corona' },
    { value: 'implant', label: 'Implante' },
    { value: 'whitening', label: 'Blanqueamiento' }
  ];

  odontograms: Odontogram[] = [];
  selectedOdontogramId: number | null = null;
  teeth: Tooth[] = [];
  treatments: DentalTreatment[] = [];
  activePatientId: number | null = null;
  treatmentStatusFilter: TreatmentStatus | null = null;

  loadingOdontograms = false;
  loadingTeeth = false;
  loadingTreatments = false;
  creatingOdontogram = false;
  savingTooth = false;
  creatingTreatment = false;

  processingTreatmentIds = new Set<number>();
  deletingTreatmentIds = new Set<number>();

  errorMessage: string | null = null;
  successMessage: string | null = null;

  readonly odontogramForm = this.fb.group({
    patient_id: [1, [Validators.required, Validators.min(1)]],
    notes: ['']
  });

  readonly toothForm = this.fb.group({
    tooth_number: [11, [Validators.required, Validators.min(11), Validators.max(85)]],
    status: ['healthy' as ToothStatus, Validators.required],
    planned_treatment: [''],
    notes: ['']
  });

  readonly treatmentForm = this.fb.group({
    patient_id: [1, [Validators.required, Validators.min(1)]],
    treatment_type: ['consultation', Validators.required],
    treatment_date: [this.getTodayDate(), Validators.required],
    tooth_number: [''],
    estimated_cost: [''],
    description: ['']
  });

  get loadingAny(): boolean {
    return this.loadingOdontograms || this.loadingTeeth || this.loadingTreatments;
  }

  ngOnInit(): void {
    this.refreshAll();
  }

  applyPatientFilter(rawValue: string): void {
    const parsed = this.parsePositiveInt(rawValue);
    this.activePatientId = parsed;
    this.odontogramForm.patchValue({ patient_id: parsed ?? 1 });
    this.treatmentForm.patchValue({ patient_id: parsed ?? 1 });
    this.refreshAll();
  }

  setTreatmentStatusFilter(rawValue: string): void {
    if (rawValue.length === 0) {
      this.treatmentStatusFilter = null;
      this.loadTreatments();
      return;
    }

    if (this.treatmentStatusOptions.includes(rawValue as TreatmentStatus)) {
      this.treatmentStatusFilter = rawValue as TreatmentStatus;
      this.loadTreatments();
    }
  }

  refreshAll(): void {
    this.loadOdontograms();
    this.loadTreatments();
  }

  loadOdontograms(): void {
    this.loadingOdontograms = true;
    this.errorMessage = null;
    const previousSelectedId = this.selectedOdontogramId;

    this.odontologyService
      .listOdontograms(this.activePatientId ?? undefined)
      .pipe(finalize(() => (this.loadingOdontograms = false)))
      .subscribe({
        next: (odontograms) => {
          this.odontograms = [...odontograms].sort((a, b) => b.id - a.id);
          const selected =
            this.odontograms.find((item) => item.id === previousSelectedId) ??
            this.odontograms.find((item) => item.is_active) ??
            this.odontograms[0] ??
            null;

          if (!selected) {
            this.selectedOdontogramId = null;
            this.teeth = [];
            return;
          }

          this.selectedOdontogramId = selected.id;
          this.loadTeeth(selected.id);
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  selectOdontogram(odontogramId: number): void {
    this.selectedOdontogramId = odontogramId;
    this.loadTeeth(odontogramId);
  }

  createOdontogram(): void {
    if (this.odontogramForm.invalid) {
      this.odontogramForm.markAllAsTouched();
      this.errorMessage = 'Patient ID es obligatorio para crear el odontograma.';
      return;
    }

    const formValue = this.odontogramForm.getRawValue();
    const payload: OdontogramPayload = {
      patient_id: formValue.patient_id
    };
    const notes = formValue.notes.trim();
    if (notes.length > 0) {
      payload.notes = notes;
    }

    this.creatingOdontogram = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.odontologyService
      .createOdontogram(payload)
      .pipe(finalize(() => (this.creatingOdontogram = false)))
      .subscribe({
        next: (odontogram) => {
          this.successMessage = `Odontograma #${odontogram.id} creado correctamente.`;
          this.activePatientId = odontogram.patient_id;
          this.odontogramForm.patchValue({ patient_id: odontogram.patient_id, notes: '' });
          this.treatmentForm.patchValue({ patient_id: odontogram.patient_id });
          this.selectedOdontogramId = odontogram.id;
          this.loadOdontograms();
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  loadTeeth(odontogramId: number): void {
    this.loadingTeeth = true;
    this.errorMessage = null;

    this.odontologyService
      .listTeeth(odontogramId)
      .pipe(finalize(() => (this.loadingTeeth = false)))
      .subscribe({
        next: (teeth) => {
          this.teeth = [...teeth].sort((a, b) => a.tooth_number - b.tooth_number);
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  saveTooth(): void {
    if (!this.selectedOdontogramId) {
      this.errorMessage = 'Selecciona un odontograma antes de actualizar dientes.';
      return;
    }

    if (this.toothForm.invalid) {
      this.toothForm.markAllAsTouched();
      this.errorMessage = 'Numero FDI y estado del diente son obligatorios.';
      return;
    }

    const formValue = this.toothForm.getRawValue();
    const payload: ToothUpsertPayload = {
      status: formValue.status
    };

    const notes = formValue.notes.trim();
    if (notes.length > 0) {
      payload.notes = notes;
    }

    const plannedTreatment = formValue.planned_treatment.trim();
    if (plannedTreatment.length > 0) {
      payload.planned_treatment = plannedTreatment;
    }

    this.savingTooth = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.odontologyService
      .saveTooth(this.selectedOdontogramId, formValue.tooth_number, payload)
      .pipe(finalize(() => (this.savingTooth = false)))
      .subscribe({
        next: (tooth) => {
          const existingIndex = this.teeth.findIndex(
            (item) => item.tooth_number === tooth.tooth_number
          );
          if (existingIndex >= 0) {
            const updated = [...this.teeth];
            updated[existingIndex] = { ...updated[existingIndex], ...tooth };
            this.teeth = updated.sort((a, b) => a.tooth_number - b.tooth_number);
          } else {
            this.teeth = [...this.teeth, tooth].sort((a, b) => a.tooth_number - b.tooth_number);
          }

          this.successMessage = `Diente ${tooth.tooth_number} actualizado.`;
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  loadTreatments(): void {
    this.loadingTreatments = true;
    this.errorMessage = null;
    const filters: {
      patient_id?: number;
      status?: TreatmentStatus;
    } = {};

    if (this.activePatientId) {
      filters.patient_id = this.activePatientId;
    }
    if (this.treatmentStatusFilter) {
      filters.status = this.treatmentStatusFilter;
    }

    this.odontologyService
      .listTreatments(Object.keys(filters).length > 0 ? filters : undefined)
      .pipe(finalize(() => (this.loadingTreatments = false)))
      .subscribe({
        next: (treatments) => {
          this.treatments = [...treatments].sort(
            (a, b) => new Date(b.treatment_date).getTime() - new Date(a.treatment_date).getTime()
          );
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  createTreatment(): void {
    if (this.treatmentForm.invalid) {
      this.treatmentForm.markAllAsTouched();
      this.errorMessage = 'Patient ID, tipo y fecha son obligatorios para crear el tratamiento.';
      return;
    }

    const formValue = this.treatmentForm.getRawValue();
    const payload: DentalTreatmentPayload = {
      patient_id: formValue.patient_id,
      treatment_type: formValue.treatment_type,
      treatment_date: formValue.treatment_date
    };

    const parsedTooth = this.parsePositiveInt(formValue.tooth_number);
    if (parsedTooth) {
      payload.affected_teeth = [parsedTooth];
    }

    const estimatedCostRaw = formValue.estimated_cost.trim();
    if (estimatedCostRaw.length > 0) {
      const parsedCost = Number(estimatedCostRaw);
      if (!Number.isNaN(parsedCost) && parsedCost >= 0) {
        payload.estimated_cost = parsedCost;
      }
    }

    const description = formValue.description.trim();
    if (description.length > 0) {
      payload.description = description;
    }

    this.creatingTreatment = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.odontologyService
      .createTreatment(payload)
      .pipe(finalize(() => (this.creatingTreatment = false)))
      .subscribe({
        next: (treatment) => {
          this.treatments = [treatment, ...this.treatments];
          this.successMessage = `Tratamiento #${treatment.id} creado correctamente.`;
          this.activePatientId = treatment.patient_id;
          this.odontogramForm.patchValue({ patient_id: treatment.patient_id });
          this.treatmentForm.patchValue({
            patient_id: treatment.patient_id,
            treatment_type: 'consultation',
            treatment_date: this.getTodayDate(),
            tooth_number: '',
            estimated_cost: '',
            description: ''
          });
          this.loadOdontograms();
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  markInProgress(treatment: DentalTreatment): void {
    this.processingTreatmentIds.add(treatment.id);
    this.errorMessage = null;
    this.successMessage = null;

    this.odontologyService
      .updateTreatment(treatment.id, { status: 'in_progress' })
      .pipe(finalize(() => this.processingTreatmentIds.delete(treatment.id)))
      .subscribe({
        next: (updatedTreatment) => {
          this.replaceTreatment(updatedTreatment);
          this.successMessage = `Tratamiento #${treatment.id} marcado en curso.`;
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  async completeTreatment(treatment: DentalTreatment): Promise<void> {
    const finalCostRaw = await this.dialog.prompt({
      title: 'Completar tratamiento',
      message: `Costo final para el tratamiento #${treatment.id} (opcional).`,
      inputLabel: 'Costo final',
      placeholder: 'Ej: 350000',
      confirmText: 'Completar',
      cancelText: 'Cancelar',
      initialValue: ''
    });
    if (finalCostRaw === null) {
      return;
    }

    let finalCost: number | undefined;
    const parsed = Number(finalCostRaw.trim());
    if (!Number.isNaN(parsed) && parsed >= 0) {
      finalCost = parsed;
    }

    this.processingTreatmentIds.add(treatment.id);
    this.errorMessage = null;
    this.successMessage = null;

    this.odontologyService
      .completeTreatment(treatment.id, {
        completion_notes: 'Completado desde frontend profesional',
        final_cost: finalCost
      })
      .pipe(finalize(() => this.processingTreatmentIds.delete(treatment.id)))
      .subscribe({
        next: (updatedTreatment) => {
          this.replaceTreatment(updatedTreatment);
          this.successMessage = `Tratamiento #${treatment.id} completado.`;
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  async cancelTreatment(treatment: DentalTreatment): Promise<void> {
    const reason = await this.dialog.prompt({
      title: 'Cancelar tratamiento',
      message: `Motivo de cancelacion del tratamiento #${treatment.id}.`,
      inputLabel: 'Motivo',
      placeholder: 'Describe el motivo',
      confirmText: 'Cancelar tratamiento',
      cancelText: 'Volver',
      initialValue: ''
    });
    if (reason === null) {
      return;
    }

    this.processingTreatmentIds.add(treatment.id);
    this.errorMessage = null;
    this.successMessage = null;

    this.odontologyService
      .cancelTreatment(treatment.id, { cancellation_reason: reason.trim() || undefined })
      .pipe(finalize(() => this.processingTreatmentIds.delete(treatment.id)))
      .subscribe({
        next: (updatedTreatment) => {
          this.replaceTreatment(updatedTreatment);
          this.successMessage = `Tratamiento #${treatment.id} cancelado.`;
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  async deleteTreatment(treatment: DentalTreatment): Promise<void> {
    const confirmed = await this.dialog.confirm({
      title: 'Eliminar tratamiento',
      message: `Eliminar tratamiento #${treatment.id}?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      destructive: true
    });
    if (!confirmed) {
      return;
    }

    this.deletingTreatmentIds.add(treatment.id);
    this.errorMessage = null;
    this.successMessage = null;

    this.odontologyService
      .deleteTreatment(treatment.id)
      .pipe(finalize(() => this.deletingTreatmentIds.delete(treatment.id)))
      .subscribe({
        next: () => {
          this.treatments = this.treatments.filter((item) => item.id !== treatment.id);
          this.successMessage = `Tratamiento #${treatment.id} eliminado.`;
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  private replaceTreatment(updatedTreatment: DentalTreatment): void {
    this.treatments = this.treatments.map((item) =>
      item.id === updatedTreatment.id ? { ...item, ...updatedTreatment } : item
    );
  }

  private parsePositiveInt(raw: string): number | null {
    const value = Number(raw);
    return Number.isInteger(value) && value > 0 ? value : null;
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private resolveErrorMessage(error: unknown): string {
    if (this.isApiErrorShape(error)) {
      const msg = error.error?.message ?? error.error?.msg ?? error.error?.error;
      if (typeof msg === 'string' && msg.trim().length > 0) {
        return msg;
      }
    }
    return 'No se pudo completar la operacion odontologica.';
  }

  private isApiErrorShape(value: unknown): value is ApiErrorShape {
    return typeof value === 'object' && value !== null && 'error' in value;
  }
}
