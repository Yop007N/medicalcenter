import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';
import { MentalHealthModule, SpecialtyAccessService } from '../../core/auth/specialty-access.service';
import {
  InterventionSession,
  MentalHealthService,
  PsychopedagogyEvaluation,
  PsychologyEvaluation,
  TherapySession
} from '../../core/services/mental-health.service';
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
  selector: 'app-mental-health-page',
  standalone: true,
  imports: [CommonModule, DatePipe, ReactiveFormsModule],
  template: `
    <section class="page">
      <h1>Salud Mental</h1>
      <p>Gestion operativa de evaluaciones y sesiones de psicologia y psicopedagogia.</p>

      @if (allowedModules.length > 1) {
        <div class="module-switch">
          @if (canUsePsychology) {
            <button
              type="button"
              class="switch-button"
              [class.active]="activeModule === 'psychology'"
              (click)="setModule('psychology')"
            >
              Psicologia
            </button>
          }
          @if (canUsePsychopedagogy) {
            <button
              type="button"
              class="switch-button"
              [class.active]="activeModule === 'psychopedagogy'"
              (click)="setModule('psychopedagogy')"
            >
              Psicopedagogia
            </button>
          }
        </div>
      }

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
        <button type="button" class="toolbar-button" (click)="applyPatientFilter(patientInput.value)" [disabled]="loadingEvaluations">
          Filtrar
        </button>
        <button type="button" class="toolbar-button" (click)="loadEvaluations()" [disabled]="loadingEvaluations">
          @if (loadingEvaluations) { Cargando... } @else { Actualizar }
        </button>
      </div>

      @if (errorMessage) {
        <div class="error-box" role="alert">{{ errorMessage }}</div>
      }

      @if (successMessage) {
        <div class="success-box" role="status">{{ successMessage }}</div>
      }

      <article class="card form-card">
        <h2 class="card-title">
          @if (activeModule === 'psychology') { Nueva evaluacion psicologica } @else { Nueva evaluacion psicopedagogica }
        </h2>

        <form [formGroup]="evaluationForm" (ngSubmit)="createEvaluation()" class="form-grid" novalidate>
          <label>
            Patient ID
            <input type="number" min="1" formControlName="patient_id" />
          </label>

          <label class="full-row">
            Motivo
            <textarea rows="2" formControlName="reason"></textarea>
          </label>

          @if (activeModule === 'psychology') {
            <label>
              Diagnostico principal
              <input type="text" formControlName="primary_diagnosis" />
            </label>
            <label class="full-row">
              Recomendaciones de tratamiento
              <textarea rows="2" formControlName="recommendations"></textarea>
            </label>
          } @else {
            <label class="full-row">
              Recomendaciones
              <textarea rows="2" formControlName="recommendations"></textarea>
            </label>
          }

          <label>
            Fecha evaluacion
            <input type="date" formControlName="evaluation_date" />
          </label>

          @if (fieldError) {
            <p class="field-error full-row">{{ fieldError }}</p>
          }

          <div class="form-actions full-row">
            <button class="primary-button" type="submit" [disabled]="creatingEvaluation">
              @if (creatingEvaluation) { Guardando... } @else { Crear evaluacion }
            </button>
          </div>
        </form>
      </article>

      @if (!loadingEvaluations && currentEvaluations.length === 0 && !errorMessage) {
        <article class="card empty">
          <h2 class="card-title">Sin evaluaciones</h2>
          <p class="card-text">No hay evaluaciones para el modulo seleccionado.</p>
        </article>
      }

      @if (currentEvaluations.length > 0) {
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Paciente</th>
                <th>Motivo</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (evaluation of currentEvaluations; track evaluation.id) {
                <tr>
                  <td>#{{ evaluation.id }}</td>
                  <td>{{ evaluation.patient_id }}</td>
                  <td>{{ evaluation.reason }}</td>
                  <td>{{ evaluation.status }}</td>
                  <td>{{ evaluation.evaluation_date | date:'mediumDate' }}</td>
                  <td>
                    <div class="row-actions">
                      <button class="table-action" type="button" (click)="selectEvaluation(evaluation.id, evaluation.patient_id)">
                        Sesiones
                      </button>
                      <button
                        class="table-action secondary"
                        type="button"
                        (click)="closeEvaluation(evaluation.id)"
                        [disabled]="closingEvaluationIds.has(evaluation.id) || evaluation.status === 'completed'"
                      >
                        @if (closingEvaluationIds.has(evaluation.id)) { Cerrando... } @else { Cerrar }
                      </button>
                      <button
                        class="table-action danger"
                        type="button"
                        (click)="deleteEvaluation(evaluation.id)"
                        [disabled]="deletingEvaluationIds.has(evaluation.id)"
                      >
                        @if (deletingEvaluationIds.has(evaluation.id)) { Eliminando... } @else { Eliminar }
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (selectedEvaluationId) {
        <article class="card form-card">
          <h2 class="card-title">
            @if (activeModule === 'psychology') { Nueva sesion terapeutica } @else { Nueva sesion de intervencion }
            (evaluacion #{{ selectedEvaluationId }})
          </h2>

          <form [formGroup]="sessionForm" (ngSubmit)="createSession()" class="form-grid" novalidate>
            <label>
              Patient ID
              <input type="number" min="1" formControlName="patient_id" />
            </label>

            <label>
              Fecha sesion
              <input type="date" formControlName="session_date" />
            </label>

            @if (activeModule === 'psychology') {
              <label class="full-row">
                Notas de sesion
                <textarea rows="2" formControlName="session_notes"></textarea>
              </label>
            } @else {
              <label>
                Area foco
                <input type="text" formControlName="focus_area" />
              </label>
              <label class="full-row">
                Notas de progreso
                <textarea rows="2" formControlName="session_notes"></textarea>
              </label>
            }

            <div class="form-actions full-row">
              <button class="primary-button" type="submit" [disabled]="creatingSession">
                @if (creatingSession) { Guardando... } @else { Crear sesion }
              </button>
            </div>
          </form>
        </article>

        @if (loadingSessions) {
          <article class="card"><p class="card-text">Cargando sesiones...</p></article>
        }

        @if (!loadingSessions && currentSessions.length === 0) {
          <article class="card"><p class="card-text">Sin sesiones para esta evaluacion.</p></article>
        }

        @if (currentSessions.length > 0) {
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>#</th>
                  <th>Paciente</th>
                  <th>Fecha</th>
                  <th>Detalle</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (session of currentSessions; track session.id) {
                  <tr>
                    <td>#{{ session.id }}</td>
                    <td>{{ session.session_number || '-' }}</td>
                    <td>{{ session.patient_id }}</td>
                    <td>{{ session.session_date | date:'mediumDate' }}</td>
                    <td>
                      @if (activeModule === 'psychology') {
                        {{ asTherapySession(session).session_notes || '-' }}
                      } @else {
                        {{ asInterventionSession(session).focus_area || '-' }}
                      }
                    </td>
                    <td>
                      <button
                        class="table-action danger"
                        type="button"
                        (click)="deleteSession(session.id)"
                        [disabled]="deletingSessionIds.has(session.id)"
                      >
                        @if (deletingSessionIds.has(session.id)) { Eliminando... } @else { Eliminar }
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }
    </section>
  `,
  styles: [
    pageShellStyles,
    `
      .module-switch {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
      }

      .switch-button {
        background: var(--ms-bg-card);
        border: 1px solid var(--ms-border);
        border-radius: 8px;
        color: var(--ms-text-primary);
        cursor: pointer;
        font-size: 0.82rem;
        font-weight: 600;
        padding: 0.45rem 0.7rem;
      }

      .switch-button.active {
        background: var(--ms-primary-soft-bg);
        border-color: var(--ms-primary-soft-border);
        color: var(--ms-primary);
      }

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

      .primary-button:disabled {
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
        opacity: 0.5;
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
export class MentalHealthPage implements OnInit {
  private readonly mentalHealthService = inject(MentalHealthService);
  private readonly authService = inject(AuthService);
  private readonly specialtyAccess = inject(SpecialtyAccessService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly dialog = inject(UiDialogService);

  activeModule: MentalHealthModule = 'psychology';
  allowedModules: MentalHealthModule[] = [];
  professionalId: number | null = null;
  activePatientId: number | undefined;

  psychologyEvaluations: PsychologyEvaluation[] = [];
  psychopedagogyEvaluations: PsychopedagogyEvaluation[] = [];
  psychologySessions: TherapySession[] = [];
  psychopedagogySessions: InterventionSession[] = [];

  selectedEvaluationId: number | null = null;
  selectedEvaluationPatientId: number | null = null;

  loadingEvaluations = false;
  loadingSessions = false;
  creatingEvaluation = false;
  creatingSession = false;

  closingEvaluationIds = new Set<number>();
  deletingEvaluationIds = new Set<number>();
  deletingSessionIds = new Set<number>();

  errorMessage: string | null = null;
  successMessage: string | null = null;
  fieldError: string | null = null;

  readonly evaluationForm = this.fb.group({
    patient_id: [1, [Validators.required, Validators.min(1)]],
    reason: ['', [Validators.required]],
    primary_diagnosis: [''],
    recommendations: ['', [Validators.required]],
    evaluation_date: ['', [Validators.required]]
  });

  readonly sessionForm = this.fb.group({
    patient_id: [1, [Validators.required, Validators.min(1)]],
    session_date: ['', [Validators.required]],
    session_notes: [''],
    focus_area: ['']
  });

  get currentEvaluations(): Array<PsychologyEvaluation | PsychopedagogyEvaluation> {
    return this.activeModule === 'psychology' ? this.psychologyEvaluations : this.psychopedagogyEvaluations;
  }

  get currentSessions(): Array<TherapySession | InterventionSession> {
    return this.activeModule === 'psychology' ? this.psychologySessions : this.psychopedagogySessions;
  }

  get canUsePsychology(): boolean {
    return this.allowedModules.includes('psychology');
  }

  get canUsePsychopedagogy(): boolean {
    return this.allowedModules.includes('psychopedagogy');
  }

  ngOnInit(): void {
    this.resolveProfessionalContext();
    this.applyModuleValidators();
    this.loadEvaluations();
  }

  setModule(module: MentalHealthModule): void {
    if (!this.allowedModules.includes(module)) {
      return;
    }
    if (this.activeModule === module) {
      return;
    }
    this.activeModule = module;
    this.selectedEvaluationId = null;
    this.selectedEvaluationPatientId = null;
    this.successMessage = null;
    this.fieldError = null;
    this.applyModuleValidators();
    this.loadEvaluations();
  }

  applyPatientFilter(rawValue: string): void {
    const parsedValue = Number(rawValue);
    this.activePatientId = Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : undefined;
    this.loadEvaluations();
  }

  loadEvaluations(): void {
    if (!this.professionalId) {
      this.errorMessage = 'No se pudo resolver el profesional autenticado.';
      return;
    }

    this.loadingEvaluations = true;
    this.errorMessage = null;

    const handleNext = (items: Array<PsychologyEvaluation | PsychopedagogyEvaluation>) => {
      const filteredItems = this.activePatientId
        ? items.filter((item) => item.patient_id === this.activePatientId)
        : items;

      if (this.activeModule === 'psychology') {
        this.psychologyEvaluations = filteredItems as PsychologyEvaluation[];
      } else {
        this.psychopedagogyEvaluations = filteredItems as PsychopedagogyEvaluation[];
      }
      this.loadingEvaluations = false;
    };

    const handleError = (error: unknown) => {
      this.errorMessage = this.resolveErrorMessage(error);
      this.loadingEvaluations = false;
    };

    if (this.activeModule === 'psychology') {
      this.mentalHealthService.listProfessionalPsychologyEvaluations(this.professionalId).subscribe({
        next: (items) => handleNext(items),
        error: (error) => handleError(error)
      });
      return;
    }

    this.mentalHealthService.listProfessionalPsychopedagogyEvaluations(this.professionalId).subscribe({
      next: (items) => handleNext(items),
      error: (error) => handleError(error)
    });
  }

  selectEvaluation(evaluationId: number, patientId: number): void {
    this.selectedEvaluationId = evaluationId;
    this.selectedEvaluationPatientId = patientId;
    this.sessionForm.patchValue({ patient_id: patientId });
    this.loadSessions();
  }

  createEvaluation(): void {
    if (this.evaluationForm.invalid) {
      this.evaluationForm.markAllAsTouched();
      this.fieldError = 'Completa los campos requeridos de la evaluacion.';
      return;
    }

    const rawValue = this.evaluationForm.getRawValue();
    const basePayload = {
      patient_id: rawValue.patient_id,
      reason: rawValue.reason.trim(),
      evaluation_date: rawValue.evaluation_date
    };

    this.creatingEvaluation = true;
    this.errorMessage = null;
    this.successMessage = null;
    this.fieldError = null;

    if (this.activeModule === 'psychology') {
      const payload = {
        ...basePayload,
        primary_diagnosis: rawValue.primary_diagnosis.trim(),
        treatment_recommendations: rawValue.recommendations.trim()
      };
      this.mentalHealthService
        .createPsychologyEvaluation(payload)
        .pipe(finalize(() => (this.creatingEvaluation = false)))
        .subscribe({
          next: (evaluation) => {
            this.psychologyEvaluations = [evaluation, ...this.psychologyEvaluations];
            this.successMessage = `Evaluacion psicologica #${evaluation.id} creada.`;
            this.resetEvaluationForm(rawValue.patient_id);
          },
          error: (error: unknown) => {
            this.errorMessage = this.resolveErrorMessage(error);
          }
        });
      return;
    }

    const payload = {
      ...basePayload,
      recommendations: rawValue.recommendations.trim()
    };
    this.mentalHealthService
      .createPsychopedagogyEvaluation(payload)
      .pipe(finalize(() => (this.creatingEvaluation = false)))
      .subscribe({
        next: (evaluation) => {
          this.psychopedagogyEvaluations = [evaluation, ...this.psychopedagogyEvaluations];
          this.successMessage = `Evaluacion psicopedagogica #${evaluation.id} creada.`;
          this.resetEvaluationForm(rawValue.patient_id);
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  closeEvaluation(evaluationId: number): void {
    this.closingEvaluationIds.add(evaluationId);
    this.errorMessage = null;
    this.successMessage = null;

    const onSuccess = () => {
      if (this.activeModule === 'psychology') {
        this.psychologyEvaluations = this.psychologyEvaluations.map((evaluation) =>
          evaluation.id === evaluationId ? { ...evaluation, status: 'completed' } : evaluation
        );
      } else {
        this.psychopedagogyEvaluations = this.psychopedagogyEvaluations.map((evaluation) =>
          evaluation.id === evaluationId ? { ...evaluation, status: 'completed' } : evaluation
        );
      }
      this.successMessage = `Evaluacion #${evaluationId} marcada como completed.`;
      this.closingEvaluationIds.delete(evaluationId);
    };

    const onError = (error: unknown) => {
      this.errorMessage = this.resolveErrorMessage(error);
      this.closingEvaluationIds.delete(evaluationId);
    };

    if (this.activeModule === 'psychology') {
      this.mentalHealthService
        .updatePsychologyEvaluation(evaluationId, { status: 'completed' })
        .subscribe({ next: () => onSuccess(), error: (error) => onError(error) });
      return;
    }

    this.mentalHealthService
      .updatePsychopedagogyEvaluation(evaluationId, { status: 'completed' })
      .subscribe({ next: () => onSuccess(), error: (error) => onError(error) });
  }

  async deleteEvaluation(evaluationId: number): Promise<void> {
    const confirmed = await this.dialog.confirm({
      title: 'Eliminar evaluacion',
      message: `Eliminar evaluacion #${evaluationId}?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      destructive: true
    });
    if (!confirmed) {
      return;
    }

    this.deletingEvaluationIds.add(evaluationId);
    this.errorMessage = null;
    this.successMessage = null;

    const onSuccess = () => {
      if (this.activeModule === 'psychology') {
        this.psychologyEvaluations = this.psychologyEvaluations.filter((item) => item.id !== evaluationId);
      } else {
        this.psychopedagogyEvaluations = this.psychopedagogyEvaluations.filter((item) => item.id !== evaluationId);
      }

      if (this.selectedEvaluationId === evaluationId) {
        this.selectedEvaluationId = null;
        this.selectedEvaluationPatientId = null;
        this.psychologySessions = [];
        this.psychopedagogySessions = [];
      }

      this.successMessage = `Evaluacion #${evaluationId} eliminada.`;
      this.deletingEvaluationIds.delete(evaluationId);
    };

    const onError = (error: unknown) => {
      this.errorMessage = this.resolveErrorMessage(error);
      this.deletingEvaluationIds.delete(evaluationId);
    };

    if (this.activeModule === 'psychology') {
      this.mentalHealthService.deletePsychologyEvaluation(evaluationId).subscribe({
        next: () => onSuccess(),
        error: (error) => onError(error)
      });
      return;
    }

    this.mentalHealthService.deletePsychopedagogyEvaluation(evaluationId).subscribe({
      next: () => onSuccess(),
      error: (error) => onError(error)
    });
  }

  loadSessions(): void {
    if (!this.selectedEvaluationId) {
      return;
    }

    this.loadingSessions = true;
    this.errorMessage = null;

    if (this.activeModule === 'psychology') {
      this.mentalHealthService
        .listPsychologySessions(this.selectedEvaluationId)
        .pipe(finalize(() => (this.loadingSessions = false)))
        .subscribe({
          next: (sessions) => {
            this.psychologySessions = sessions;
          },
          error: (error: unknown) => {
            this.errorMessage = this.resolveErrorMessage(error);
          }
        });
      return;
    }

    this.mentalHealthService
      .listPsychopedagogySessions(this.selectedEvaluationId)
      .pipe(finalize(() => (this.loadingSessions = false)))
      .subscribe({
        next: (sessions) => {
          this.psychopedagogySessions = sessions;
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  createSession(): void {
    if (!this.selectedEvaluationId) {
      this.fieldError = 'Selecciona primero una evaluacion para agregar sesiones.';
      return;
    }
    if (this.sessionForm.invalid) {
      this.sessionForm.markAllAsTouched();
      this.fieldError = 'Completa los campos requeridos de la sesion.';
      return;
    }

    const rawValue = this.sessionForm.getRawValue();
    this.creatingSession = true;
    this.errorMessage = null;
    this.successMessage = null;
    this.fieldError = null;

    if (this.activeModule === 'psychology') {
      const payload = {
        evaluation_id: this.selectedEvaluationId,
        patient_id: rawValue.patient_id,
        session_date: rawValue.session_date,
        session_notes: rawValue.session_notes.trim()
      };

      this.mentalHealthService
        .createPsychologySession(payload)
        .pipe(finalize(() => (this.creatingSession = false)))
        .subscribe({
          next: (session) => {
            this.psychologySessions = [...this.psychologySessions, session];
            this.successMessage = `Sesion #${session.id} creada.`;
            this.resetSessionForm(rawValue.patient_id);
          },
          error: (error: unknown) => {
            this.errorMessage = this.resolveErrorMessage(error);
          }
        });
      return;
    }

    const payload = {
      evaluation_id: this.selectedEvaluationId,
      patient_id: rawValue.patient_id,
      session_date: rawValue.session_date,
      focus_area: rawValue.focus_area.trim(),
      progress_notes: rawValue.session_notes.trim()
    };
    this.mentalHealthService
      .createPsychopedagogySession(payload)
      .pipe(finalize(() => (this.creatingSession = false)))
      .subscribe({
        next: (session) => {
          this.psychopedagogySessions = [...this.psychopedagogySessions, session];
          this.successMessage = `Sesion #${session.id} creada.`;
          this.resetSessionForm(rawValue.patient_id);
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  async deleteSession(sessionId: number): Promise<void> {
    const confirmed = await this.dialog.confirm({
      title: 'Eliminar sesion',
      message: `Eliminar sesion #${sessionId}?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      destructive: true
    });
    if (!confirmed) {
      return;
    }

    this.deletingSessionIds.add(sessionId);
    this.errorMessage = null;
    this.successMessage = null;

    const onSuccess = () => {
      if (this.activeModule === 'psychology') {
        this.psychologySessions = this.psychologySessions.filter((item) => item.id !== sessionId);
      } else {
        this.psychopedagogySessions = this.psychopedagogySessions.filter((item) => item.id !== sessionId);
      }
      this.successMessage = `Sesion #${sessionId} eliminada.`;
      this.deletingSessionIds.delete(sessionId);
    };

    const onError = (error: unknown) => {
      this.errorMessage = this.resolveErrorMessage(error);
      this.deletingSessionIds.delete(sessionId);
    };

    if (this.activeModule === 'psychology') {
      this.mentalHealthService.deletePsychologySession(sessionId).subscribe({
        next: () => onSuccess(),
        error: (error) => onError(error)
      });
      return;
    }

    this.mentalHealthService.deletePsychopedagogySession(sessionId).subscribe({
      next: () => onSuccess(),
      error: (error) => onError(error)
    });
  }

  asTherapySession(session: TherapySession | InterventionSession): TherapySession {
    return session as TherapySession;
  }

  asInterventionSession(session: TherapySession | InterventionSession): InterventionSession {
    return session as InterventionSession;
  }

  private resolveProfessionalContext(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser?.id) {
      this.allowedModules = this.specialtyAccess.getMentalHealthModules(currentUser.specialty);
      if (this.allowedModules.length === 0) {
        this.errorMessage = 'Tu especialidad no tiene acceso al modulo de salud mental.';
        this.professionalId = null;
        return;
      }
      this.activeModule = this.specialtyAccess.getDefaultMentalHealthModule(currentUser.specialty);
      this.professionalId = currentUser.id;
      this.evaluationForm.patchValue({ patient_id: 1 });
      this.sessionForm.patchValue({ patient_id: 1 });
      return;
    }
    this.allowedModules = [];
    this.professionalId = null;
  }

  private applyModuleValidators(): void {
    if (this.activeModule === 'psychology') {
      this.evaluationForm.controls.primary_diagnosis.setValidators([Validators.required]);
      this.evaluationForm.controls.recommendations.setValidators([Validators.required]);
      this.sessionForm.controls.session_notes.setValidators([Validators.required]);
      this.sessionForm.controls.focus_area.clearValidators();
    } else {
      this.evaluationForm.controls.primary_diagnosis.clearValidators();
      this.evaluationForm.controls.recommendations.setValidators([Validators.required]);
      this.sessionForm.controls.session_notes.setValidators([Validators.required]);
      this.sessionForm.controls.focus_area.setValidators([Validators.required]);
    }

    this.evaluationForm.controls.primary_diagnosis.updateValueAndValidity({ emitEvent: false });
    this.evaluationForm.controls.recommendations.updateValueAndValidity({ emitEvent: false });
    this.sessionForm.controls.session_notes.updateValueAndValidity({ emitEvent: false });
    this.sessionForm.controls.focus_area.updateValueAndValidity({ emitEvent: false });
  }

  private resetEvaluationForm(patientId: number): void {
    this.evaluationForm.reset({
      patient_id: patientId,
      reason: '',
      primary_diagnosis: '',
      recommendations: '',
      evaluation_date: ''
    });
  }

  private resetSessionForm(patientId: number): void {
    this.sessionForm.reset({
      patient_id: patientId,
      session_date: '',
      session_notes: '',
      focus_area: ''
    });
  }

  private resolveErrorMessage(error: unknown): string {
    if (this.isApiErrorShape(error)) {
      const msg = error.error?.message ?? error.error?.msg ?? error.error?.error;
      if (typeof msg === 'string' && msg.trim().length > 0) {
        return msg;
      }
    }
    return 'No se pudo completar la operacion de salud mental.';
  }

  private isApiErrorShape(value: unknown): value is ApiErrorShape {
    return typeof value === 'object' && value !== null && 'error' in value;
  }
}
