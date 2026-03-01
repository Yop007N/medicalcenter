import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormControl,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import {
  CreateSpecialtyEncounterPayload,
  SpecialtyEncounter,
  SpecialtyModuleContext,
  SpecialtyModuleOverview,
  SpecialtyModuleService
} from '../core/services/specialty-module.service';
import { pageShellStyles } from './page-shell.styles';
import {
  buildProfessionalSpecialtyBoardSections,
  buildProfessionalSpecialtyInsightCards,
  LEGACY_SPECIALTY_MODULES,
  SpecialtyBoardSectionView,
  SpecialtyFieldDefinition,
  SpecialtyInsightCard,
  SpecialtyPrimaryQuickAction,
  resolveProfessionalSpecialtyFields,
  resolveProfessionalSpecialtyPrimaryQuickAction,
} from './specialty-module.config';
import { UiDialogService } from '../shared/services/ui-dialog.service';

type ApiErrorShape = {
  error?: {
    message?: string;
    msg?: string;
    error?: string;
  };
};
@Component({
  selector: 'app-specialty-module-page',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, RouterLink, ReactiveFormsModule],
  template: `
    <section class="page">
      <h1>{{ context?.module?.label || 'Modulo de especialidad' }}</h1>
      <p>{{ context?.module?.description || 'Gestion clinica especializada por profesional y pacientes asignados.' }}</p>

      <div class="toolbar">
        <button type="button" class="refresh-button" (click)="loadData()" [disabled]="loading">
          @if (loading) { Cargando... } @else { Actualizar }
        </button>
      </div>

      @if (errorMessage) {
        <div class="error-box" role="alert">{{ errorMessage }}</div>
      }

      @if (successMessage) {
        <div class="success-box" role="status">{{ successMessage }}</div>
      }

      @if (context) {
        <article class="card">
          <h2 class="card-title">Bloques funcionales</h2>
          <div class="chip-grid">
            @for (section of context.module.coreSections; track section) {
              <span class="chip">{{ section }}</span>
            }
          </div>
          <div class="quick-actions">
            <a [routerLink]="['/patients']" [queryParams]="buildScopeQueryParams()" class="quick-link">Pacientes</a>
            <a [routerLink]="['/appointments']" [queryParams]="buildScopeQueryParams()" class="quick-link">Citas</a>
            <a [routerLink]="['/medical-records']" [queryParams]="buildScopeQueryParams()" class="quick-link">Registros</a>
            <a [routerLink]="['/budgets']" [queryParams]="buildScopeQueryParams()" class="quick-link">Presupuestos</a>
            <a [routerLink]="['/files']" [queryParams]="buildScopeQueryParams()" class="quick-link">Archivos</a>
            <a [routerLink]="['/payments']" [queryParams]="buildScopeQueryParams()" class="quick-link">Pagos</a>
            @if (primaryQuickAction; as action) {
              <a [routerLink]="action.route" class="quick-link primary">{{ action.label }}</a>
            }
          </div>
        </article>
      }

      @if (overview) {
        <div class="grid">
          <article class="card">
            <h2 class="card-title">Pacientes</h2>
            <p class="metric">{{ overview.totals.patients }}</p>
            <p class="card-text">Activos: {{ overview.totals.patients_active }}</p>
          </article>
          <article class="card">
            <h2 class="card-title">Citas</h2>
            <p class="metric">{{ overview.totals.appointments_total }}</p>
            <p class="card-text">Proximas: {{ overview.totals.appointments_upcoming }}</p>
          </article>
          <article class="card">
            <h2 class="card-title">Registros clinicos</h2>
            <p class="metric">{{ overview.totals.medical_records }}</p>
            <p class="card-text">Historial de evolucion del modulo.</p>
          </article>
          <article class="card">
            <h2 class="card-title">Facturacion</h2>
            <p class="metric">
              {{ overview.totals.revenue_completed | currency:(overview.totals.currency || 'ARS'):'symbol':'1.0-2' }}
            </p>
            <p class="card-text">Pagos completados: {{ overview.totals.payments_completed }}</p>
          </article>
        </div>

        <div class="grid lower-grid">
          <article class="card">
            <h2 class="card-title">Pacientes asignados</h2>
            @if (overview.patients.length === 0) {
              <p class="card-text">No hay pacientes asignados a tu modulo.</p>
            } @else {
              <ul class="simple-list">
                @for (patient of overview.patients; track patient.id) {
                  <li>
                    <span>#{{ patient.id }} - {{ patient.first_name }} {{ patient.last_name }}</span>
                    <small>{{ patient.email }}</small>
                  </li>
                }
              </ul>
            }
          </article>

          <article class="card">
            <h2 class="card-title">Proximas citas</h2>
            @if (overview.upcoming_appointments.length === 0) {
              <p class="card-text">Sin citas proximas para esta especialidad.</p>
            } @else {
              <ul class="simple-list">
                @for (appointment of overview.upcoming_appointments; track appointment.id) {
                  <li>
                    <span>#{{ appointment.id }} - {{ appointment.patient_name }}</span>
                    <strong>{{ appointment.appointment_date | date:'short' }}</strong>
                  </li>
                }
              </ul>
            }
          </article>
        </div>

        @if (specialtyInsightCards.length > 0) {
          <article class="card lower-grid">
            <h2 class="card-title">Indicadores clínicos del módulo</h2>
            <div class="grid">
              @for (insight of specialtyInsightCards; track insight.label) {
                <article class="card">
                  <h2 class="card-title">{{ insight.label }}</h2>
                  <p class="metric">{{ insight.value }}</p>
                  <p class="card-text">{{ insight.description }}</p>
                </article>
              }
            </div>
          </article>
        }

        @if (specialtyBoardSections.length > 0) {
          <article class="card lower-grid">
            <h2 class="card-title">Panel clínico del dominio</h2>
            <div class="board-grid">
              @for (section of specialtyBoardSections; track section.title) {
                <section class="board-section">
                  <h3>{{ section.title }}</h3>
                  <p class="card-text">{{ section.description }}</p>
                  <dl class="board-list">
                    @for (item of section.items; track item.label) {
                      <div>
                        <dt>{{ item.label }}</dt>
                        <dd>{{ item.value }}</dd>
                      </div>
                    }
                  </dl>
                </section>
              }
            </div>
          </article>
        }

        @if (isClinicalModuleEnabled) {
          <article class="card lower-grid">
            <h2 class="card-title">
              @if (editingEncounterId) {
                Editar consulta #{{ editingEncounterId }} · {{ context?.module?.label }}
              } @else {
                Nueva consulta de {{ context?.module?.label }}
              }
            </h2>

            <form [formGroup]="encounterForm" (ngSubmit)="submitEncounter()" class="form-grid" novalidate>
              <label>
                Paciente
                <select formControlName="patient_id">
                  <option [ngValue]="0">Selecciona paciente</option>
                  @for (patient of overview.patients; track patient.id) {
                    <option [ngValue]="patient.id">
                      {{ patient.first_name }} {{ patient.last_name }} (#{{ patient.id }})
                    </option>
                  }
                </select>
              </label>

              <label>
                Fecha de consulta
                <input type="date" formControlName="visit_date" />
              </label>

              <label>
                Estado
                <select formControlName="status">
                  <option value="open">Abierto</option>
                  <option value="in_progress">En progreso</option>
                  <option value="closed">Cerrado</option>
                </select>
              </label>

              <label class="full-row">
                Motivo de consulta
                <textarea rows="2" formControlName="chief_complaint"></textarea>
              </label>

              <label>
                Diagnostico
                <input type="text" formControlName="diagnosis" />
              </label>

              <label>
                Evaluacion clinica
                <input type="text" formControlName="assessment" />
              </label>

              <label class="full-row">
                Plan terapeutico
                <textarea rows="2" formControlName="plan"></textarea>
              </label>

              <label class="full-row">
                Notas
                <textarea rows="2" formControlName="notes"></textarea>
              </label>

              <h3 class="subsection-title full-row">Campos de {{ context?.module?.label }}</h3>
              @for (field of moduleFields; track field.key) {
                <label [class.full-row]="field.type === 'textarea'">
                  {{ field.label }}
                  @switch (field.type) {
                    @case ('select') {
                      <select [formControlName]="field.key">
                        <option value="">Sin definir</option>
                        @for (option of field.options || []; track option.value) {
                          <option [value]="option.value">{{ option.label }}</option>
                        }
                      </select>
                    }
                    @case ('textarea') {
                      <textarea
                        rows="2"
                        [attr.placeholder]="field.placeholder || null"
                        [formControlName]="field.key"
                      ></textarea>
                    }
                    @default {
                      <input
                        [type]="field.type"
                        [attr.min]="field.min ?? null"
                        [attr.step]="field.step ?? null"
                        [attr.placeholder]="field.placeholder || null"
                        [formControlName]="field.key"
                      />
                    }
                  }
                </label>
              }

              @if (fieldError) {
                <p class="field-error full-row">{{ fieldError }}</p>
              }

              <div class="form-actions full-row">
                <button class="primary-button" type="submit" [disabled]="encounterSubmitting">
                  @if (encounterSubmitting) {
                    Guardando...
                  } @else if (editingEncounterId) {
                    Guardar cambios
                  } @else {
                    Registrar consulta
                  }
                </button>
                @if (editingEncounterId) {
                  <button class="secondary-button" type="button" (click)="cancelEditEncounter()">
                    Cancelar edicion
                  </button>
                }
              </div>
            </form>
          </article>

          <article class="card lower-grid">
            <h2 class="card-title">Consultas registradas</h2>
            <form class="filter-grid" [formGroup]="encounterFilterForm" novalidate>
              <label>
                Paciente
                <select formControlName="patient_id">
                  <option [ngValue]="0">Todos</option>
                  @for (patient of overview.patients; track patient.id) {
                    <option [ngValue]="patient.id">
                      {{ patient.first_name }} {{ patient.last_name }} (#{{ patient.id }})
                    </option>
                  }
                </select>
              </label>
              <label>
                Estado
                <select formControlName="status">
                  <option value="">Todos</option>
                  <option value="open">Abierto</option>
                  <option value="in_progress">En progreso</option>
                  <option value="closed">Cerrado</option>
                </select>
              </label>
              <label>
                Desde
                <input type="date" formControlName="date_from" />
              </label>
              <label>
                Hasta
                <input type="date" formControlName="date_to" />
              </label>
              <label class="full-row">
                Buscar por motivo, diagnostico o notas
                <input type="text" formControlName="search" placeholder="Ej: control, dolor, riesgo..." />
              </label>
              <div class="form-actions full-row">
                <button class="secondary-button" type="button" (click)="resetEncounterFilters()">
                  Limpiar filtros
                </button>
              </div>
            </form>

            @if (filteredEncounters.length === 0) {
              <p class="card-text">Sin consultas registradas para esta especialidad.</p>
            } @else {
              <ul class="simple-list">
                @for (encounter of filteredEncounters; track encounter.id) {
                  <li>
                    <div>
                      <strong>#{{ encounter.id }} · {{ encounter.patient_name || ('Paciente #' + encounter.patient_id) }}</strong>
                      <p class="list-secondary">{{ encounter.chief_complaint }}</p>
                      @if (getEncounterHighlightsText(encounter)) {
                        <small class="list-secondary">{{ getEncounterHighlightsText(encounter) }}</small>
                      }
                      <small>{{ encounter.visit_date | date:'short' }} · {{ encounter.status }}</small>
                    </div>
                    <div class="row-actions">
                      <button class="secondary-action" type="button" (click)="startEditEncounter(encounter)">
                        Editar
                      </button>
                      <button class="danger-action" type="button" (click)="deleteEncounter(encounter.id)">
                        Eliminar
                      </button>
                    </div>
                  </li>
                }
              </ul>
            }
          </article>
        } @else {
          <article class="card lower-grid">
            <h2 class="card-title">Implementacion de dominio</h2>
            <p class="card-text">
              Este modulo usa un flujo dedicado. Accede desde el acceso rapido superior para operar su historia clinica.
            </p>
          </article>
        }

        <article class="card lower-grid">
          <h2 class="card-title">Registros recientes</h2>
          @if (overview.recent_medical_records.length === 0) {
            <p class="card-text">Sin registros recientes en este modulo.</p>
          } @else {
            <ul class="simple-list">
              @for (record of overview.recent_medical_records; track record.id) {
                <li>
                  <span>#{{ record.id }} - {{ record.patient_name }}</span>
                  <small>{{ record.record_date | date:'shortDate' }}</small>
                </li>
              }
            </ul>
          }
        </article>
      }
    </section>
  `,
  styles: [
    pageShellStyles,
    `
      .toolbar {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 0.75rem;
      }

      .refresh-button {
        background: var(--ms-bg-card);
        border: 1px solid var(--ms-border);
        border-radius: 8px;
        color: var(--ms-text-primary);
        cursor: pointer;
        font-size: 0.82rem;
        font-weight: 600;
        padding: 0.45rem 0.7rem;
      }

      .refresh-button:disabled {
        cursor: not-allowed;
        opacity: 0.65;
      }

      .chip-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        margin: 0.4rem 0 0.5rem;
      }

      .chip {
        background: var(--ms-primary-soft-bg);
        border: 1px solid var(--ms-primary-soft-border);
        border-radius: 999px;
        color: var(--ms-primary);
        font-size: 0.74rem;
        font-weight: 600;
        padding: 0.2rem 0.55rem;
      }

      .quick-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
      }

      .quick-link {
        background: var(--ms-bg-card);
        border: 1px solid var(--ms-border);
        border-radius: 8px;
        color: var(--ms-text-primary);
        font-size: 0.78rem;
        font-weight: 600;
        padding: 0.3rem 0.55rem;
        text-decoration: none;
      }

      .quick-link.primary {
        background: var(--ms-primary);
        border-color: var(--ms-primary);
        color: var(--ms-bg-card);
      }

      .metric {
        color: var(--ms-text-strong);
        font-size: 1.2rem;
        font-weight: 700;
        margin: 0;
      }

      .board-grid {
        display: grid;
        gap: 0.75rem;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      }

      .board-section {
        border: 1px solid var(--ms-border);
        border-radius: 10px;
        padding: 0.75rem;
      }

      .board-list {
        display: grid;
        gap: 0.45rem;
        margin: 0;
      }

      .board-list div + div { border-top: 1px dashed var(--ms-border); padding-top: 0.45rem; }

      .board-list dt {
        color: var(--ms-text-secondary);
        font-size: 0.72rem;
        margin: 0;
        text-transform: uppercase;
      }

      .board-list dd {
        color: var(--ms-text-strong);
        font-size: 0.84rem;
        margin: 0;
      }

      .lower-grid {
        margin-top: 0.75rem;
      }

      .simple-list {
        list-style: none;
        margin: 0.35rem 0 0;
        padding: 0;
      }

      .simple-list li {
        align-items: center;
        border-bottom: 1px solid var(--ms-border);
        display: flex;
        font-size: 0.8rem;
        justify-content: space-between;
        gap: 0.5rem;
        padding: 0.4rem 0;
      }

      .simple-list small,
      .list-secondary {
        color: var(--ms-text-secondary);
      }

      .list-secondary {
        margin: 0.2rem 0;
      }

      .form-grid {
        display: grid;
        gap: 0.6rem;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        margin-top: 0.5rem;
      }

      .filter-grid {
        border: 1px solid var(--ms-border);
        border-radius: 10px;
        display: grid;
        gap: 0.55rem;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        margin: 0.5rem 0;
        padding: 0.55rem;
      }

      .form-grid label {
        color: var(--ms-text-primary);
        display: grid;
        font-size: 0.78rem;
        font-weight: 600;
        gap: 0.3rem;
      }

      .filter-grid label {
        color: var(--ms-text-primary);
        display: grid;
        font-size: 0.76rem;
        font-weight: 600;
        gap: 0.3rem;
      }

      .subsection-title {
        color: var(--ms-text-primary);
        font-size: 0.86rem;
        margin: 0.2rem 0 0;
      }

      .full-row {
        grid-column: 1 / -1;
      }

      .form-grid input,
      .form-grid textarea,
      .form-grid select,
      .filter-grid input,
      .filter-grid textarea,
      .filter-grid select {
        border: 1px solid var(--ms-border);
        border-radius: 8px;
        font-size: 0.82rem;
        padding: 0.45rem 0.6rem;
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

      .secondary-button:hover,
      .secondary-button:focus-visible {
        border-color: var(--ms-primary);
        color: var(--ms-primary);
      }

      .row-actions {
        display: inline-flex;
        gap: 0.35rem;
      }

      .secondary-action {
        background: var(--ms-bg-card);
        border: 1px solid var(--ms-border);
        border-radius: 8px;
        color: var(--ms-text-primary);
        cursor: pointer;
        font-size: 0.74rem;
        font-weight: 600;
        padding: 0.3rem 0.55rem;
      }

      .danger-action {
        background: var(--ms-bg-card);
        border: 1px solid var(--ms-danger-soft-border);
        border-radius: 8px;
        color: var(--ms-danger);
        cursor: pointer;
        font-size: 0.74rem;
        font-weight: 600;
        padding: 0.3rem 0.55rem;
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
    `
  ]
})
export class SpecialtyModulePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(UntypedFormBuilder);
  private readonly specialtyModuleService = inject(SpecialtyModuleService);
  private readonly dialog = inject(UiDialogService);

  loading = false;
  encounterSubmitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  fieldError: string | null = null;
  editingEncounterId: number | null = null;

  context: SpecialtyModuleContext | null = null;
  overview: SpecialtyModuleOverview | null = null;
  encounters: SpecialtyEncounter[] = [];
  moduleFields: SpecialtyFieldDefinition[] = [];

  private dynamicFieldKeys: string[] = [];

  readonly encounterForm = this.fb.group({
    patient_id: [0, [Validators.required, Validators.min(1)]],
    visit_date: [this.formatDateForInput(new Date()), [Validators.required]],
    status: ['open', [Validators.required]],
    chief_complaint: ['', [Validators.required]],
    diagnosis: [''],
    assessment: [''],
    plan: [''],
    notes: ['']
  });
  readonly encounterFilterForm = this.fb.group({
    patient_id: [0],
    status: [''],
    date_from: [''],
    date_to: [''],
    search: ['']
  });

  get isClinicalModuleEnabled(): boolean {
    const key = this.context?.module?.key;
    return Boolean(key) && !LEGACY_SPECIALTY_MODULES.has(String(key));
  }

  get specialtyInsightCards(): SpecialtyInsightCard[] {
    return buildProfessionalSpecialtyInsightCards(this.context?.module?.key, this.encounters);
  }

  get specialtyBoardSections(): SpecialtyBoardSectionView[] {
    return buildProfessionalSpecialtyBoardSections(this.context?.module?.key, this.encounters);
  }

  get primaryQuickAction(): SpecialtyPrimaryQuickAction | null {
    return resolveProfessionalSpecialtyPrimaryQuickAction(this.context?.module?.key);
  }

  get filteredEncounters(): SpecialtyEncounter[] {
    const filters = this.encounterFilterForm.getRawValue();
    const patientId = Number(filters.patient_id || 0);
    const status = String(filters.status || '').trim();
    const dateFrom = String(filters.date_from || '').trim();
    const dateTo = String(filters.date_to || '').trim();
    const searchTerm = String(filters.search || '').trim().toLowerCase();

    return this.encounters.filter((encounter) => {
      if (patientId > 0 && encounter.patient_id !== patientId) {
        return false;
      }

      if (status && encounter.status !== status) {
        return false;
      }

      const encounterDate = this.toInputDate(encounter.visit_date);
      if (dateFrom && encounterDate < dateFrom) {
        return false;
      }
      if (dateTo && encounterDate > dateTo) {
        return false;
      }

      if (searchTerm) {
        const searchable = [
          encounter.patient_name || '',
          encounter.chief_complaint || '',
          encounter.diagnosis || '',
          encounter.assessment || '',
          encounter.plan || '',
          encounter.notes || ''
        ]
          .join(' ')
          .toLowerCase();
        if (!searchable.includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.errorMessage = null;

    this.specialtyModuleService
      .getMyModule()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (context) => {
          this.context = context;
          this.ensureRouteMatchesModule(context);
          this.syncDynamicFieldControls();
          this.cancelEditEncounter(true);
          this.loadOverview();
          this.loadEncounters();
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  submitEncounter(): void {
    if (this.editingEncounterId) {
      this.updateEncounter();
      return;
    }
    this.createEncounter();
  }

  createEncounter(): void {
    if (this.encounterForm.invalid) {
      this.encounterForm.markAllAsTouched();
      this.fieldError = 'Completa los campos requeridos de la consulta.';
      return;
    }

    this.encounterSubmitting = true;
    this.errorMessage = null;
    this.successMessage = null;
    this.fieldError = null;

    const payload = this.buildEncounterPayload();
    if (!payload) {
      this.errorMessage = 'No se pudo resolver el modulo actual.';
      this.encounterSubmitting = false;
      return;
    }

    this.specialtyModuleService
      .createEncounter(payload)
      .pipe(finalize(() => (this.encounterSubmitting = false)))
      .subscribe({
        next: (encounter) => {
          this.encounters = [encounter, ...this.encounters];
          this.successMessage = `Consulta #${encounter.id} registrada.`;
          this.resetEncounterForm();
          this.loadOverview();
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  updateEncounter(): void {
    if (!this.editingEncounterId) {
      return;
    }
    if (this.encounterForm.invalid) {
      this.encounterForm.markAllAsTouched();
      this.fieldError = 'Completa los campos requeridos de la consulta.';
      return;
    }

    this.encounterSubmitting = true;
    this.errorMessage = null;
    this.successMessage = null;
    this.fieldError = null;

    const payload = this.buildEncounterPayload();
    if (!payload) {
      this.errorMessage = 'No se pudo resolver el modulo actual.';
      this.encounterSubmitting = false;
      return;
    }

    this.specialtyModuleService
      .updateEncounter(this.editingEncounterId, payload)
      .pipe(finalize(() => (this.encounterSubmitting = false)))
      .subscribe({
        next: (encounter) => {
          this.encounters = this.encounters.map((item) =>
            item.id === encounter.id ? encounter : item
          );
          this.successMessage = `Consulta #${encounter.id} actualizada.`;
          this.cancelEditEncounter();
          this.loadOverview();
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  startEditEncounter(encounter: SpecialtyEncounter): void {
    this.editingEncounterId = encounter.id;
    this.fieldError = null;
    this.errorMessage = null;
    this.successMessage = null;

    this.encounterForm.patchValue({
      patient_id: encounter.patient_id,
      visit_date: this.toInputDate(encounter.visit_date),
      status: encounter.status,
      chief_complaint: encounter.chief_complaint || '',
      diagnosis: encounter.diagnosis || '',
      assessment: encounter.assessment || '',
      plan: encounter.plan || '',
      notes: encounter.notes || ''
    });

    for (const field of this.moduleFields) {
      this.encounterForm
        .get(field.key)
        ?.setValue(this.getEncounterFieldValue(encounter, field.key));
    }
  }

  cancelEditEncounter(silent = false): void {
    this.editingEncounterId = null;
    this.resetEncounterForm();
    if (!silent) {
      this.successMessage = null;
      this.fieldError = null;
    }
  }

  async deleteEncounter(encounterId: number): Promise<void> {
    const confirmed = await this.dialog.confirm({
      title: 'Eliminar consulta',
      message: `Eliminar consulta #${encounterId}?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      destructive: true
    });
    if (!confirmed) {
      return;
    }

    this.specialtyModuleService.deleteEncounter(encounterId).subscribe({
      next: () => {
        this.encounters = this.encounters.filter((item) => item.id !== encounterId);
        this.successMessage = `Consulta #${encounterId} eliminada.`;
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error);
      }
      });
  }

  getEncounterHighlights(encounter: SpecialtyEncounter): string[] {
    const summary: string[] = [];
    const payloadEntries = { ...(encounter.vitals || {}), ...(encounter.payload || {}) };
    for (const field of this.moduleFields) {
      const rawValue = payloadEntries[field.key];
      if (rawValue === undefined || rawValue === null || rawValue === '') {
        continue;
      }

      const value = typeof rawValue === 'string' ? rawValue : String(rawValue);
      if (value.trim().length === 0) {
        continue;
      }
      summary.push(`${field.label}: ${value}`);
      if (summary.length >= 2) {
        break;
      }
    }
    return summary;
  }

  getEncounterHighlightsText(encounter: SpecialtyEncounter): string {
    return this.getEncounterHighlights(encounter).join(' · ');
  }

  resetEncounterFilters(): void {
    this.encounterFilterForm.reset({
      patient_id: 0,
      status: '',
      date_from: '',
      date_to: '',
      search: ''
    });
  }

  buildScopeQueryParams(): { specialty_key?: string } {
    const key = this.context?.module?.key;
    if (!key) {
      return {};
    }
    return { specialty_key: key };
  }

  private syncDynamicFieldControls(): void {
    for (const key of this.dynamicFieldKeys) {
      if (this.encounterForm.contains(key)) {
        this.encounterForm.removeControl(key);
      }
    }

    this.dynamicFieldKeys = [];
    this.moduleFields = [];

    if (!this.isClinicalModuleEnabled) {
      return;
    }

    const moduleKey = this.context?.module?.key || 'general-medicine';
    this.moduleFields = resolveProfessionalSpecialtyFields(moduleKey);

    for (const field of this.moduleFields) {
      this.encounterForm.addControl(field.key, new UntypedFormControl(''));
      this.dynamicFieldKeys.push(field.key);
    }
  }

  private buildDynamicPayload(): {
    vitals: Record<string, string | number>;
    payload: Record<string, string | number>;
  } {
    const vitals: Record<string, string | number> = {};
    const payload: Record<string, string | number> = {};

    for (const field of this.moduleFields) {
      const rawValue = this.encounterForm.get(field.key)?.value;
      if (rawValue === undefined || rawValue === null || rawValue === '') {
        continue;
      }

      let value: string | number;
      if (field.type === 'number') {
        const parsed = Number(rawValue);
        if (Number.isNaN(parsed)) {
          continue;
        }
        value = parsed;
      } else {
        value = String(rawValue).trim();
        if (!value) {
          continue;
        }
      }

      if (field.target === 'vitals') {
        vitals[field.key] = value;
      } else {
        payload[field.key] = value;
      }
    }

    return { vitals, payload };
  }

  private buildEncounterPayload(): CreateSpecialtyEncounterPayload | null {
    if (!this.context) {
      return null;
    }

    const baseValues = this.encounterForm.getRawValue();
    const dynamicPayload = this.buildDynamicPayload();

    return {
      patient_id: Number(baseValues.patient_id),
      specialty_key: this.context.module.key,
      visit_date: `${baseValues.visit_date}T00:00:00`,
      status: (baseValues.status as 'open' | 'in_progress' | 'closed') || 'open',
      chief_complaint: String(baseValues.chief_complaint || '').trim(),
      diagnosis: String(baseValues.diagnosis || '').trim() || undefined,
      assessment: String(baseValues.assessment || '').trim() || undefined,
      plan: String(baseValues.plan || '').trim() || undefined,
      notes: String(baseValues.notes || '').trim() || undefined,
      vitals: Object.keys(dynamicPayload.vitals).length > 0 ? dynamicPayload.vitals : undefined,
      payload: Object.keys(dynamicPayload.payload).length > 0 ? dynamicPayload.payload : undefined
    };
  }

  private resetEncounterForm(): void {
    this.encounterForm.reset({
      patient_id: 0,
      visit_date: this.formatDateForInput(new Date()),
      status: 'open',
      chief_complaint: '',
      diagnosis: '',
      assessment: '',
      plan: '',
      notes: ''
    });

    for (const key of this.dynamicFieldKeys) {
      this.encounterForm.get(key)?.setValue('');
    }
  }

  private getEncounterFieldValue(encounter: SpecialtyEncounter, key: string): string | number {
    const rawValue = encounter.vitals?.[key] ?? encounter.payload?.[key];
    if (rawValue === null || rawValue === undefined) {
      return '';
    }
    return typeof rawValue === 'number' ? rawValue : String(rawValue);
  }

  private loadOverview(): void {
    this.specialtyModuleService
      .getMyModuleOverview(this.context?.module?.key)
      .subscribe({
      next: (overview) => {
        this.overview = overview;
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error);
      }
      });
  }

  private loadEncounters(): void {
    if (!this.context || !this.isClinicalModuleEnabled) {
      this.encounters = [];
      return;
    }

    this.specialtyModuleService
      .listEncounters({ specialty_key: this.context.module.key })
      .subscribe({
        next: (encounters) => {
          this.encounters = encounters;
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  private ensureRouteMatchesModule(context: SpecialtyModuleContext): void {
    const routeSpecialtyKey = this.route.snapshot.paramMap.get('specialtyKey');
    if (!routeSpecialtyKey) {
      return;
    }

    if (routeSpecialtyKey !== context.module.key) {
      void this.router.navigateByUrl(context.module.route);
    }
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toInputDate(value: string | null | undefined): string {
    if (!value) {
      return this.formatDateForInput(new Date());
    }
    const normalized = String(value).slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      return normalized;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return this.formatDateForInput(new Date());
    }
    return this.formatDateForInput(parsed);
  }

  private resolveErrorMessage(error: unknown): string {
    if (this.isApiErrorShape(error)) {
      const msg = error.error?.message ?? error.error?.msg ?? error.error?.error;
      if (typeof msg === 'string' && msg.trim().length > 0) {
        return msg;
      }
    }
    return 'No se pudo completar la operacion en el modulo de especialidad.';
  }

  private isApiErrorShape(value: unknown): value is ApiErrorShape {
    return typeof value === 'object' && value !== null && 'error' in value;
  }
}
