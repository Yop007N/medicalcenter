import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import {
  CreateSpecialtyEncounterPayload,
  SpecialtiesApiService,
  SpecialtyEncounter,
  SpecialtyModuleDefinition,
  SpecialtyModuleContext,
  SpecialtyModuleOverview
} from '../../../core/services/specialties-api.service';
import { NotificationService } from '../../../core/services';
import {
  buildSpecialtyInsightCards,
  buildSpecialtyBoardSections,
  LEGACY_MODULES,
  SpecialtyBoardSectionView,
  SpecialtyUiConfig,
  SpecialtyInsightCard,
  SpecialtyWorkspaceItem,
  resolveSpecialtyFrontendRoute,
  resolveSpecialtyPrimaryQuickAction,
  resolveSpecialtyUiConfig,
} from './specialty-module.config';

type ApiErrorShape = {
  error?: {
    message?: string;
    msg?: string;
    error?: string;
  };
};

type EncounterStatus = 'open' | 'in_progress' | 'closed';

@Component({
  selector: 'app-specialty-module-page',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, RouterLink, ReactiveFormsModule],
  template: `
    <section class="page">
      <div class="page-header">
        <h1>{{ context?.module?.label || 'Especialidad' }}</h1>
        <button type="button" class="refresh-button" (click)="loadData()" [disabled]="loading">
          @if (loading) { Cargando... } @else { Actualizar }
        </button>
      </div>

      <p class="description">
        {{ context?.module?.description || 'Gestión clínica por especialidad.' }}
      </p>

      @if (errorMessage) {
        <div class="error-box" role="alert">{{ errorMessage }}</div>
      }
      @if (successMessage) {
        <div class="success-box" role="status">{{ successMessage }}</div>
      }

      @if (context) {
        <article class="card">
          <h2 class="card-title">Módulo de {{ context.module.label }}</h2>
          <ul class="workspace-list">
            @for (entry of workspaceItems; track entry.title) {
              <li>
                <a [routerLink]="entry.route">{{ entry.title }}</a>
                <p>{{ entry.description }}</p>
              </li>
            }
          </ul>
          <a [routerLink]="primaryWorkspaceRoute" class="primary-button workspace-cta">
            {{ primaryWorkspaceActionLabel }}
          </a>
        </article>

        <article class="card">
          <h2 class="card-title">Bloques funcionales</h2>
          <div class="chip-grid">
            @for (section of context.module.coreSections; track section) {
              <span class="chip">{{ section }}</span>
            }
          </div>
          <div class="quick-actions">
            <a routerLink="/patients" [queryParams]="scopeQueryParams" class="quick-link">Pacientes</a>
            <a routerLink="/appointments" [queryParams]="scopeQueryParams" class="quick-link">Citas</a>
            <a routerLink="/medical-records" [queryParams]="scopeQueryParams" class="quick-link">Historiales</a>
            <a routerLink="/files" [queryParams]="scopeQueryParams" class="quick-link">Archivos</a>
            <a routerLink="/budgets" [queryParams]="scopeQueryParams" class="quick-link">Presupuestos</a>
            <a routerLink="/payments" [queryParams]="scopeQueryParams" class="quick-link">Pagos</a>
            @if (primaryQuickAction; as action) {
              <a [routerLink]="action.route" class="quick-link primary">{{ action.label }}</a>
            }
          </div>
        </article>

        <article class="card specialty-brief">
          <h2 class="card-title">{{ uiConfig.briefTitle }}</h2>
          <div class="brief-grid">
            <section class="brief-column">
              <h3>Focos clínicos</h3>
              <ul>
                @for (item of uiConfig.moduleHighlights; track item) {
                  <li>{{ item }}</li>
                }
              </ul>
            </section>
            <section class="brief-column">
              <h3>Estudios y controles</h3>
              <ul>
                @for (item of uiConfig.recommendedStudies; track item) {
                  <li>{{ item }}</li>
                }
              </ul>
            </section>
            <section class="brief-column">
              <h3>Cadencia de seguimiento</h3>
              <p>{{ uiConfig.followUpCadence }}</p>
            </section>
          </div>
        </article>
      }

      @if (overview) {
        <div class="stats-grid">
          <article class="card stat">
            <h3>Pacientes</h3>
            <strong>{{ overview.totals.patients }}</strong>
            <small>Activos: {{ overview.totals.patients_active }}</small>
          </article>
          <article class="card stat">
            <h3>Citas</h3>
            <strong>{{ overview.totals.appointments_total }}</strong>
            <small>Próximas: {{ overview.totals.appointments_upcoming }}</small>
          </article>
          <article class="card stat">
            <h3>Registros</h3>
            <strong>{{ overview.totals.medical_records }}</strong>
            <small>Historial clínico</small>
          </article>
          <article class="card stat">
            <h3>Atenciones módulo</h3>
            <strong>{{ overview.totals.specialty_encounters }}</strong>
            <small>Encuentros clínicos filtrados</small>
          </article>
          <article class="card stat">
            <h3>Documentos módulo</h3>
            <strong>{{ overview.totals.documents }}</strong>
            <small>Archivos clínicos asociados</small>
          </article>
          <article class="card stat">
            <h3>Facturación</h3>
            <strong>{{ overview.totals.revenue_completed | currency:(overview.totals.currency || 'ARS'):'symbol':'1.0-2' }}</strong>
            <small>Pagos: {{ overview.totals.payments_completed }}</small>
          </article>
        </div>
      }

      @if (specialtyInsightCards.length > 0) {
        <article class="card">
          <h2 class="card-title">Indicadores clínicos del módulo</h2>
          <div class="stats-grid">
            @for (insight of specialtyInsightCards; track insight.label) {
              <article class="card stat insight-card">
                <h3>{{ insight.label }}</h3>
                <strong>{{ insight.value }}</strong>
                <small>{{ insight.description }}</small>
              </article>
            }
          </div>
        </article>
      }

      @if (specialtyBoardSections.length > 0) {
        <article class="card">
          <h2 class="card-title">Panel clínico del dominio</h2>
          <div class="board-grid">
            @for (section of specialtyBoardSections; track section.title) {
              <section class="board-section">
                <h3>{{ section.title }}</h3>
                <p>{{ section.description }}</p>
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

      @if (overview && context) {
        <article class="card">
          <h2 class="card-title">{{ uiConfig.historyTitle }}</h2>
          <p class="description">{{ uiConfig.historyHint }}</p>
          <div class="insight-grid">
            <div class="insight-block">
              <h3>Próximas citas del módulo</h3>
              @if (overview.upcoming_appointments.length === 0) {
                <p class="empty">Sin citas próximas para esta especialidad.</p>
              } @else {
                <ul class="mini-list">
                  @for (appointment of overview.upcoming_appointments.slice(0, 5); track appointment.id) {
                    <li>
                      <a [routerLink]="['/patients', appointment.patient_id]">
                        {{ appointment.patient_name }}
                      </a>
                      <small>{{ appointment.appointment_date | date:'short' }} · {{ appointment.status }}</small>
                    </li>
                  }
                </ul>
              }
            </div>
            <div class="insight-block">
              <h3>Historial reciente del módulo</h3>
              @if (overview.recent_medical_records.length === 0) {
                <p class="empty">Aún no hay historiales recientes.</p>
              } @else {
                <ul class="mini-list">
                  @for (record of overview.recent_medical_records.slice(0, 5); track record.id) {
                    <li>
                      <a [routerLink]="['/patients', record.patient_id]">
                        {{ record.patient_name }}
                      </a>
                      <small>{{ record.record_date | date:'shortDate' }} · {{ record.diagnosis || 'Sin diagnóstico' }}</small>
                    </li>
                  }
                </ul>
              }
            </div>
            <div class="insight-block">
              <h3>Pacientes en seguimiento</h3>
              @if (overview.patients.length === 0) {
                <p class="empty">Sin pacientes activos para esta especialidad.</p>
              } @else {
                <ul class="mini-list">
                  @for (patient of overview.patients.slice(0, 8); track patient.id) {
                    <li>
                      <a [routerLink]="['/patients', patient.id]">
                        {{ patient.first_name }} {{ patient.last_name }}
                      </a>
                      <small>{{ patient.email }} · @if (patient.is_active) { Activo } @else { Inactivo }</small>
                    </li>
                  }
                </ul>
              }
            </div>
            <div class="insight-block">
              <h3>Timeline clínico por especialidad</h3>
              @if (overview.recent_specialty_encounters.length === 0) {
                <p class="empty">Sin atenciones registradas para este módulo.</p>
              } @else {
                <ul class="mini-list">
                  @for (encounter of overview.recent_specialty_encounters.slice(0, 6); track encounter.id) {
                    <li>
                      <a [routerLink]="['/patients', encounter.patient_id]">
                        {{ encounter.patient_name }}
                      </a>
                      <small>
                        {{ encounter.visit_date | date:'short' }} ·
                        {{ toEncounterStatusLabel(encounter.status) }} ·
                        {{ encounter.diagnosis || encounter.chief_complaint }}
                      </small>
                    </li>
                  }
                </ul>
              }
            </div>
            <div class="insight-block">
              <h3>Documentos recientes por módulo</h3>
              @if (overview.recent_documents.length === 0) {
                <p class="empty">Sin documentos clínicos para esta especialidad.</p>
              } @else {
                <ul class="mini-list">
                  @for (document of overview.recent_documents.slice(0, 6); track document.id) {
                    <li>
                      <a
                        [routerLink]="['/files']"
                        [queryParams]="{
                          specialty_key: context.module.key,
                          patient_id: document.patient_id || undefined
                        }"
                      >
                        {{ document.filename }}
                      </a>
                      <small>
                        {{ document.patient_name || 'Paciente no definido' }} ·
                        {{ document.created_at | date:'short' }} ·
                        {{ document.file_type || 'documento' }}
                      </small>
                    </li>
                  }
                </ul>
              }
            </div>
          </div>
        </article>
      }

      @if (isGenericClinicalModule) {
        <article class="card">
          <h2 class="card-title">
            @if (editingEncounterId) {
              Editar atención #{{ editingEncounterId }}
            } @else {
              {{ uiConfig.intakeTitle }}
            }
          </h2>

          <form class="form-grid" [formGroup]="encounterForm" (ngSubmit)="submitEncounter()" novalidate>
            <label>
              Paciente
              <select formControlName="patient_id">
                <option [ngValue]="0">Seleccionar paciente</option>
                @for (patient of (overview?.patients || []); track patient.id) {
                  <option [ngValue]="patient.id">
                    {{ patient.first_name }} {{ patient.last_name }} (#{{ patient.id }})
                  </option>
                }
              </select>
            </label>

            <label>
              Fecha de atención
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
              {{ uiConfig.chiefComplaintLabel }}
              <textarea rows="2" formControlName="chief_complaint"></textarea>
            </label>

            <label>
              {{ uiConfig.diagnosisLabel }}
              <input type="text" formControlName="diagnosis" />
            </label>

            <label>
              {{ uiConfig.assessmentLabel }}
              <input type="text" formControlName="assessment" />
            </label>

            <label class="full-row">
              {{ uiConfig.planLabel }}
              <textarea rows="2" formControlName="plan"></textarea>
            </label>

            <label class="full-row">
              {{ uiConfig.notesLabel }}
              <textarea rows="2" formControlName="notes"></textarea>
            </label>

            @if (uiConfig.specialtyFields.length > 0) {
              <div class="specialty-fields full-row">
                <h3>Ficha específica de {{ context?.module?.label }}</h3>
                <div class="specialty-fields-grid">
                  @for (field of uiConfig.specialtyFields; track field.key) {
                    <label [class.full-row]="field.fullRow">
                      {{ field.label }}
                      @if (field.type === 'select') {
                        <select
                          [value]="specialtyFieldValues[field.key] || ''"
                          (change)="onSpecialtyFieldInput(field.key, $any($event.target).value)"
                        >
                          <option value="">Seleccionar</option>
                          @for (option of (field.options || []); track option.value) {
                            <option [value]="option.value">{{ option.label }}</option>
                          }
                        </select>
                      } @else if (field.type === 'textarea') {
                        <textarea
                          rows="2"
                          [placeholder]="field.placeholder || ''"
                          [value]="specialtyFieldValues[field.key] || ''"
                          (input)="onSpecialtyFieldInput(field.key, $any($event.target).value)"
                        ></textarea>
                      } @else {
                        <input
                          [type]="field.type === 'number' ? 'number' : 'text'"
                          [placeholder]="field.placeholder || ''"
                          [value]="specialtyFieldValues[field.key] || ''"
                          (input)="onSpecialtyFieldInput(field.key, $any($event.target).value)"
                        />
                      }
                    </label>
                  }
                </div>
              </div>
            }

            <div class="full-row advanced-toggle">
              <button class="secondary-button" type="button" (click)="toggleAdvancedPayload()">
                @if (showAdvancedPayload) { Ocultar JSON avanzado } @else { Editar JSON avanzado }
              </button>
            </div>

            @if (showAdvancedPayload) {
              <label class="full-row">
                Campos avanzados (JSON)
                <textarea rows="3" formControlName="payload_json" placeholder='{"clave":"valor"}'></textarea>
              </label>
            }

            @if (fieldError) {
              <p class="field-error full-row">{{ fieldError }}</p>
            }

            <div class="form-actions full-row">
              <button class="primary-button" type="submit" [disabled]="encounterSubmitting">
                @if (encounterSubmitting) { Guardando... } @else if (editingEncounterId) { Guardar cambios } @else { Registrar consulta }
              </button>
              @if (editingEncounterId) {
                <button class="secondary-button" type="button" (click)="cancelEdit()">
                  Cancelar edición
                </button>
              }
            </div>
          </form>
        </article>

        <article class="card">
          <h2 class="card-title">{{ uiConfig.historyTitle }}</h2>

          <form class="filter-grid" [formGroup]="filterForm" novalidate>
            <label>
              Paciente
              <select formControlName="patient_id">
                <option [ngValue]="0">Todos</option>
                @for (patient of (overview?.patients || []); track patient.id) {
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
              Buscar
              <input type="text" formControlName="search" placeholder="motivo, diagnóstico o notas" />
            </label>

            <div class="form-actions full-row">
              <button class="secondary-button" type="button" (click)="resetFilters()">
                Limpiar filtros
              </button>
            </div>
          </form>

          @if (filteredEncounters.length === 0) {
            <p class="empty">No hay consultas para los filtros seleccionados.</p>
          } @else {
            <ul class="encounter-list">
              @for (item of filteredEncounters; track item.id) {
                <li>
                  <div>
                    <strong>#{{ item.id }} · {{ item.patient_name || ('Paciente #' + item.patient_id) }}</strong>
                    <p>{{ item.chief_complaint }}</p>
                    <small>{{ item.visit_date | date:'short' }} · {{ item.status }}</small>
                    @if (summarizeSpecialtyPayload(item.payload); as payloadSummary) {
                      <small>{{ payloadSummary }}</small>
                    }
                  </div>
                  <div class="row-actions">
                    <button class="secondary-action" type="button" (click)="startEdit(item)">Editar</button>
                    <button class="danger-action" type="button" (click)="deleteEncounter(item.id)">Eliminar</button>
                  </div>
                </li>
              }
            </ul>
          }
        </article>
      } @else if (context) {
        <article class="card">
          <h2 class="card-title">Módulo especializado</h2>
          <p class="description">Este módulo usa un flujo dedicado. Accede desde el acceso rápido superior.</p>
        </article>
      }
    </section>
  `,
  styles: [`
    .page { padding: 1rem; }
    .page-header { align-items: center; display: flex; justify-content: space-between; gap: 1rem; }
    h1 { color: var(--ion-color-dark); font-size: 1.4rem; margin: 0; }
    .description { color: var(--ion-color-medium); margin: 0.25rem 0 0.9rem; }
    .card { background: var(--medical-bg-card); border: 1px solid var(--medical-border-light); border-radius: 12px; margin-bottom: 0.9rem; padding: 0.85rem; }
    .card-title { color: var(--ion-color-dark); font-size: 1rem; margin: 0 0 0.6rem; }
    .refresh-button, .secondary-button, .secondary-action, .danger-action, .primary-button { border-radius: 8px; cursor: pointer; font-weight: 600; }
    .refresh-button, .secondary-button, .secondary-action { background: var(--medical-bg-card); border: 1px solid var(--medical-border-light); color: var(--ion-color-dark); padding: 0.45rem 0.7rem; }
    .primary-button { background: var(--ion-color-primary); border: 1px solid var(--ion-color-primary); color: white; padding: 0.45rem 0.85rem; }
    .danger-action { background: rgba(var(--ion-color-danger-rgb), 0.06); border: 1px solid rgba(var(--ion-color-danger-rgb), 0.22); color: var(--ion-color-danger); padding: 0.35rem 0.6rem; }
    .chip-grid, .quick-actions { display: flex; flex-wrap: wrap; gap: 0.45rem; }
    .chip { background: rgba(var(--ion-color-primary-rgb), 0.09); border: 1px solid rgba(var(--ion-color-primary-rgb), 0.17); border-radius: 999px; color: var(--ion-color-primary); font-size: 0.72rem; font-weight: 600; padding: 0.2rem 0.55rem; }
    .quick-link { background: var(--medical-bg-card); border: 1px solid var(--medical-border-light); border-radius: 8px; color: var(--ion-color-dark); font-size: 0.78rem; font-weight: 600; padding: 0.25rem 0.55rem; text-decoration: none; }
    .quick-link.primary { background: var(--ion-color-primary); border-color: var(--ion-color-primary); color: white; }
    .stats-grid { display: grid; gap: 0.75rem; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); margin-bottom: 0.9rem; }
    .stat h3 { color: var(--ion-color-medium); font-size: 0.78rem; margin: 0 0 0.3rem; text-transform: uppercase; }
    .stat strong { color: var(--ion-color-dark); display: block; font-size: 1.08rem; margin-bottom: 0.15rem; }
    .stat small { color: var(--ion-color-medium); }
    .insight-grid { display: grid; gap: 0.7rem; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
    .insight-block { border: 1px solid var(--medical-border-light); border-radius: 10px; padding: 0.7rem; }
    .insight-block h3 { color: var(--ion-color-dark); font-size: 0.82rem; margin: 0 0 0.5rem; text-transform: uppercase; }
    .mini-list { list-style: none; margin: 0; padding: 0; }
    .mini-list li { display: grid; gap: 0.15rem; padding: 0.35rem 0; border-bottom: 1px dashed var(--medical-border-light); }
    .mini-list li:last-child { border-bottom: none; }
    .mini-list a { color: var(--ion-color-primary); font-size: 0.83rem; font-weight: 600; text-decoration: none; }
    .mini-list small { color: var(--ion-color-medium); font-size: 0.75rem; }
    .workspace-list { list-style: none; margin: 0 0 0.75rem; padding: 0; }
    .workspace-list li { border-bottom: 1px solid var(--medical-border-light); padding: 0.45rem 0; }
    .workspace-list li:last-child { border-bottom: none; }
    .workspace-list a { color: var(--ion-color-dark); font-weight: 700; text-decoration: none; }
    .workspace-list p { color: var(--ion-color-medium); font-size: 0.8rem; margin: 0.2rem 0 0; }
    .workspace-cta { display: inline-flex; text-decoration: none; }
    .specialty-brief .brief-grid { display: grid; gap: 0.75rem; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    .specialty-brief .brief-column { border: 1px solid var(--medical-border-light); border-radius: 10px; padding: 0.65rem; }
    .specialty-brief .brief-column h3 { color: var(--ion-color-dark); font-size: 0.8rem; margin: 0 0 0.45rem; text-transform: uppercase; }
    .specialty-brief .brief-column ul { margin: 0; padding-left: 1rem; }
    .specialty-brief .brief-column li { color: var(--ion-color-medium); font-size: 0.82rem; margin-bottom: 0.3rem; }
    .specialty-brief .brief-column p { color: var(--ion-color-medium); font-size: 0.82rem; margin: 0; }
    .board-grid { display: grid; gap: 0.75rem; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); margin-bottom: 0.2rem; }
    .board-section { border: 1px solid var(--medical-border-light); border-radius: 10px; padding: 0.75rem; }
    .board-section h3 { color: var(--ion-color-dark); font-size: 0.82rem; margin: 0 0 0.35rem; text-transform: uppercase; }
    .board-section p { color: var(--ion-color-medium); font-size: 0.78rem; margin: 0 0 0.55rem; }
    .board-list { display: grid; gap: 0.45rem; margin: 0; }
    .board-list div { border-top: 1px dashed var(--medical-border-light); display: grid; gap: 0.15rem; padding-top: 0.45rem; }
    .board-list div:first-child { border-top: none; padding-top: 0; }
    .board-list dt { color: var(--ion-color-medium); font-size: 0.73rem; font-weight: 600; margin: 0; text-transform: uppercase; }
    .board-list dd { color: var(--ion-color-dark); font-size: 0.84rem; font-weight: 600; margin: 0; }
    .form-grid, .filter-grid { display: grid; gap: 0.6rem; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    .filter-grid { border: 1px solid var(--medical-border-light); border-radius: 10px; margin-bottom: 0.7rem; padding: 0.6rem; }
    label { color: var(--ion-color-dark); display: grid; font-size: 0.8rem; font-weight: 600; gap: 0.3rem; }
    input, select, textarea { border: 1px solid var(--medical-border-light); border-radius: 8px; font-size: 0.82rem; padding: 0.45rem 0.55rem; }
    .full-row { grid-column: 1 / -1; }
    .specialty-fields { border: 1px solid var(--medical-border-light); border-radius: 10px; padding: 0.65rem; }
    .specialty-fields h3 { color: var(--ion-color-dark); font-size: 0.82rem; margin: 0 0 0.6rem; text-transform: uppercase; }
    .specialty-fields-grid { display: grid; gap: 0.6rem; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    .advanced-toggle { display: flex; justify-content: flex-start; }
    .form-actions { display: flex; gap: 0.45rem; }
    .encounter-list { list-style: none; margin: 0; padding: 0; }
    .encounter-list li { align-items: center; border-bottom: 1px solid var(--medical-border-light); display: flex; justify-content: space-between; gap: 0.6rem; padding: 0.45rem 0; }
    .encounter-list p { color: var(--ion-color-medium); margin: 0.2rem 0; }
    .encounter-list small { color: var(--ion-color-medium); display: block; }
    .row-actions { display: inline-flex; gap: 0.35rem; }
    .empty { color: var(--ion-color-medium); font-size: 0.85rem; margin: 0.2rem 0; }
    .error-box, .success-box { border-radius: 8px; margin-bottom: 0.7rem; padding: 0.55rem 0.7rem; }
    .error-box { background: rgba(var(--ion-color-danger-rgb), 0.08); border: 1px solid rgba(var(--ion-color-danger-rgb), 0.2); color: var(--ion-color-danger); }
    .success-box { background: rgba(var(--ion-color-success-rgb), 0.08); border: 1px solid rgba(var(--ion-color-success-rgb), 0.2); color: var(--ion-color-success); }
    .field-error { color: var(--ion-color-danger); margin: 0; }
  `]
})
export class SpecialtyModulePage implements OnInit, OnDestroy {
  private readonly specialtiesApi = inject(SpecialtiesApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private routeParamSubscription?: Subscription;

  loading = false;
  encounterSubmitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  fieldError: string | null = null;
  editingEncounterId: number | null = null;

  context: SpecialtyModuleContext | null = null;
  overview: SpecialtyModuleOverview | null = null;
  encounters: SpecialtyEncounter[] = [];
  showAdvancedPayload = false;
  specialtyFieldValues: Record<string, string> = {};

  readonly encounterForm = this.fb.group({
    patient_id: [0, [Validators.required, Validators.min(1)]],
    visit_date: [this.formatDateForInput(new Date()), [Validators.required]],
    status: ['open' as EncounterStatus, [Validators.required]],
    chief_complaint: ['', [Validators.required]],
    diagnosis: [''],
    assessment: [''],
    plan: [''],
    notes: [''],
    payload_json: ['']
  });

  readonly filterForm = this.fb.group({
    patient_id: [0],
    status: [''],
    date_from: [''],
    date_to: [''],
    search: ['']
  });

  get isGenericClinicalModule(): boolean {
    const key = this.context?.module?.key;
    return Boolean(key) && !LEGACY_MODULES.has(String(key));
  }

  get uiConfig(): SpecialtyUiConfig {
    return resolveSpecialtyUiConfig(this.context?.module?.key);
  }

  get workspaceItems(): SpecialtyWorkspaceItem[] {
    const moduleLabel = this.context?.module?.label || 'Especialidad';
    return [
      {
        title: `Panel de ${moduleLabel}`,
        description: `Vista operativa y trazabilidad clínica de ${moduleLabel.toLowerCase()}.`,
        route: this.primaryWorkspaceRoute,
      },
      {
        title: `Pacientes de ${moduleLabel}`,
        description: 'Acceso a pacientes, historial y continuidad del cuidado.',
        route: this.buildScopedRoute('/patients'),
      },
      {
        title: `Agenda de ${moduleLabel}`,
        description: 'Control de turnos, seguimiento y pendientes asistenciales.',
        route: this.buildScopedRoute('/appointments'),
      },
      {
        title: `Registros y documentos`,
        description: 'Historiales, archivos y evidencias clínicas del módulo.',
        route: this.buildScopedRoute('/medical-records'),
      },
    ];
  }

  get scopeQueryParams(): Record<string, string> {
    const specialtyKey = this.context?.module?.key;
    return specialtyKey ? { specialty_key: specialtyKey } : {};
  }

  get primaryWorkspaceActionLabel(): string {
    const moduleLabel = this.context?.module?.label || 'Especialidad';
    return `Nueva atención de ${moduleLabel}`;
  }

  get primaryWorkspaceRoute(): string {
    const moduleKey = this.context?.module?.key;
    return resolveSpecialtyFrontendRoute(moduleKey);
  }

  get primaryQuickAction(): { label: string; route: string } | null {
    return resolveSpecialtyPrimaryQuickAction(this.context?.module?.key);
  }

  get filteredEncounters(): SpecialtyEncounter[] {
    const filters = this.filterForm.getRawValue();
    const patientId = Number(filters.patient_id || 0);
    const status = String(filters.status || '').trim();
    const dateFrom = String(filters.date_from || '').trim();
    const dateTo = String(filters.date_to || '').trim();
    const search = String(filters.search || '').trim().toLowerCase();

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

      if (search) {
        const text = [
          encounter.patient_name || '',
          encounter.chief_complaint || '',
          encounter.diagnosis || '',
          encounter.assessment || '',
          encounter.plan || '',
          encounter.notes || ''
        ].join(' ').toLowerCase();
        if (!text.includes(search)) {
          return false;
        }
      }
      return true;
    });
  }

  get specialtyInsightCards(): SpecialtyInsightCard[] {
    return buildSpecialtyInsightCards(this.context?.module?.key, this.encounters);
  }

  get specialtyBoardSections(): SpecialtyBoardSectionView[] {
    return buildSpecialtyBoardSections(this.context?.module?.key, this.encounters);
  }

  ngOnInit(): void {
    this.routeParamSubscription = this.route.paramMap.subscribe(() => {
      this.loadData();
    });
  }

  ngOnDestroy(): void {
    this.routeParamSubscription?.unsubscribe();
  }

  loadData(): void {
    this.loading = true;
    this.errorMessage = null;
    const routeSpecialtyKey = this.getRouteSpecialtyKey();
    const catalog$ = routeSpecialtyKey
      ? this.specialtiesApi.getCatalog().pipe(
          catchError(() => of([] as SpecialtyModuleDefinition[]))
        )
      : of([] as SpecialtyModuleDefinition[]);

    forkJoin({
      context: this.specialtiesApi.getMyModule(),
      catalog: catalog$
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: ({ context, catalog }) => {
          const resolvedContext = this.resolveContextForRoute(context, catalog, routeSpecialtyKey);
          this.context = resolvedContext;
          this.ensureRouteMatchesModule(resolvedContext, routeSpecialtyKey);
          this.cancelEdit(true);
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

  startEdit(encounter: SpecialtyEncounter): void {
    this.editingEncounterId = encounter.id;
    this.hydrateSpecialtyFieldValues(encounter.payload);
    this.encounterForm.patchValue({
      patient_id: encounter.patient_id,
      visit_date: this.toInputDate(encounter.visit_date),
      status: encounter.status,
      chief_complaint: encounter.chief_complaint || '',
      diagnosis: encounter.diagnosis || '',
      assessment: encounter.assessment || '',
      plan: encounter.plan || '',
      notes: encounter.notes || '',
      payload_json: encounter.payload ? JSON.stringify(encounter.payload, null, 2) : ''
    });
    this.showAdvancedPayload = false;
  }

  cancelEdit(silent = false): void {
    this.editingEncounterId = null;
    this.resetForm();
    if (!silent) {
      this.successMessage = null;
      this.fieldError = null;
    }
  }

  resetFilters(): void {
    this.filterForm.reset({
      patient_id: 0,
      status: '',
      date_from: '',
      date_to: '',
      search: ''
    });
  }

  toggleAdvancedPayload(): void {
    this.showAdvancedPayload = !this.showAdvancedPayload;
  }

  onSpecialtyFieldInput(fieldKey: string, value: string): void {
    this.specialtyFieldValues = {
      ...this.specialtyFieldValues,
      [fieldKey]: value,
    };
  }

  summarizeSpecialtyPayload(payload: Record<string, unknown> | null): string {
    if (!payload || typeof payload !== 'object') {
      return '';
    }

    const mapped = this.uiConfig.specialtyFields
      .map((field) => {
        const rawValue = payload[field.key];
        if (rawValue === null || rawValue === undefined || rawValue === '') {
          return null;
        }
        const option = field.options?.find((item) => item.value === String(rawValue));
        const valueLabel = option ? option.label : String(rawValue);
        return `${field.label}: ${valueLabel}`;
      })
      .filter((value): value is string => Boolean(value));

    if (mapped.length > 0) {
      return mapped.join(' · ');
    }

    const fallback = Object.entries(payload)
      .slice(0, 3)
      .map(([key, value]) => `${key}: ${String(value)}`);

    return fallback.join(' · ');
  }

  toEncounterStatusLabel(status: string): string {
    const normalized = String(status || '').trim().toLowerCase();
    if (normalized === 'open') {
      return 'Abierto';
    }
    if (normalized === 'in_progress') {
      return 'En progreso';
    }
    if (normalized === 'closed') {
      return 'Cerrado';
    }
    return status || 'Sin estado';
  }

  async deleteEncounter(encounterId: number): Promise<void> {
    const confirmed = await this.notification.confirm(
      'Eliminar consulta',
      `Eliminar consulta #${encounterId}?`,
      'Eliminar'
    );
    if (!confirmed) {
      return;
    }
    this.specialtiesApi.deleteEncounter(encounterId).subscribe({
      next: () => {
        this.encounters = this.encounters.filter((item) => item.id !== encounterId);
        this.successMessage = `Consulta #${encounterId} eliminada.`;
        if (this.editingEncounterId === encounterId) {
          this.cancelEdit(true);
        }
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  private createEncounter(): void {
    if (!this.context) {
      this.errorMessage = 'No se pudo resolver el módulo actual.';
      return;
    }
    if (this.encounterForm.invalid) {
      this.encounterForm.markAllAsTouched();
      this.fieldError = 'Completa los campos requeridos.';
      return;
    }

    const payload = this.buildPayload();
    if (!payload) {
      return;
    }

    this.encounterSubmitting = true;
    this.specialtiesApi
      .createEncounter(payload)
      .pipe(finalize(() => (this.encounterSubmitting = false)))
      .subscribe({
        next: (created) => {
          this.encounters = [created, ...this.encounters];
          this.successMessage = `Consulta #${created.id} registrada.`;
          this.resetForm();
          this.loadOverview();
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  private updateEncounter(): void {
    if (!this.editingEncounterId) {
      return;
    }
    if (this.encounterForm.invalid) {
      this.encounterForm.markAllAsTouched();
      this.fieldError = 'Completa los campos requeridos.';
      return;
    }

    const payload = this.buildPayload();
    if (!payload) {
      return;
    }

    this.encounterSubmitting = true;
    this.specialtiesApi
      .updateEncounter(this.editingEncounterId, payload)
      .pipe(finalize(() => (this.encounterSubmitting = false)))
      .subscribe({
        next: (updated) => {
          this.encounters = this.encounters.map((item) => item.id === updated.id ? updated : item);
          this.successMessage = `Consulta #${updated.id} actualizada.`;
          this.cancelEdit();
          this.loadOverview();
        },
        error: (error: unknown) => {
          this.errorMessage = this.resolveErrorMessage(error);
        }
      });
  }

  private buildPayload(): CreateSpecialtyEncounterPayload | null {
    if (!this.context) {
      this.errorMessage = 'No se pudo resolver el módulo actual.';
      return null;
    }

    const raw = this.encounterForm.getRawValue();
    const payloadJson = String(raw.payload_json || '').trim();
    const specialtyPayload = this.buildSpecialtyPayload();
    let payloadObject: Record<string, unknown> = specialtyPayload ? { ...specialtyPayload } : {};

    if (payloadJson) {
      try {
        const parsed = JSON.parse(payloadJson);
        if (typeof parsed === 'object' && parsed && !Array.isArray(parsed)) {
          payloadObject = {
            ...payloadObject,
            ...(parsed as Record<string, unknown>),
          };
        } else {
          this.fieldError = 'Campos de especialidad debe ser un JSON objeto válido.';
          return null;
        }
      } catch {
        this.fieldError = 'Campos de especialidad debe ser JSON válido.';
        return null;
      }
    }

    return {
      patient_id: Number(raw.patient_id),
      specialty_key: this.context.module.key,
      visit_date: `${raw.visit_date}T00:00:00`,
      status: (raw.status as EncounterStatus) || 'open',
      chief_complaint: String(raw.chief_complaint || '').trim(),
      diagnosis: String(raw.diagnosis || '').trim() || undefined,
      assessment: String(raw.assessment || '').trim() || undefined,
      plan: String(raw.plan || '').trim() || undefined,
      notes: String(raw.notes || '').trim() || undefined,
      payload: Object.keys(payloadObject).length > 0 ? payloadObject : undefined
    };
  }

  private buildScopedRoute(path: string): string {
    const specialtyKey = this.context?.module?.key;
    return specialtyKey ? `${path}?specialty_key=${encodeURIComponent(specialtyKey)}` : path;
  }

  private resetForm(): void {
    this.encounterForm.reset({
      patient_id: 0,
      visit_date: this.formatDateForInput(new Date()),
      status: 'open',
      chief_complaint: '',
      diagnosis: '',
      assessment: '',
      plan: '',
      notes: '',
      payload_json: ''
    });
    this.resetSpecialtyFieldValues();
    this.showAdvancedPayload = false;
    this.fieldError = null;
  }

  private buildSpecialtyPayload(): Record<string, unknown> | undefined {
    const payload: Record<string, unknown> = {};

    for (const field of this.uiConfig.specialtyFields) {
      const rawValue = this.specialtyFieldValues[field.key];
      const value = String(rawValue ?? '').trim();
      if (!value) {
        continue;
      }

      if (field.type === 'number') {
        const parsed = Number(value);
        payload[field.key] = Number.isFinite(parsed) ? parsed : value;
        continue;
      }

      payload[field.key] = value;
    }

    return Object.keys(payload).length > 0 ? payload : undefined;
  }

  private resetSpecialtyFieldValues(): void {
    const nextValues: Record<string, string> = {};
    for (const field of this.uiConfig.specialtyFields) {
      nextValues[field.key] = '';
    }
    this.specialtyFieldValues = nextValues;
  }

  private hydrateSpecialtyFieldValues(payload: Record<string, unknown> | null): void {
    const nextValues: Record<string, string> = {};
    for (const field of this.uiConfig.specialtyFields) {
      const rawValue = payload?.[field.key];
      nextValues[field.key] = rawValue === null || rawValue === undefined ? '' : String(rawValue);
    }
    this.specialtyFieldValues = nextValues;
  }

  private loadOverview(): void {
    const specialtyKey = this.context?.module?.key;
    this.specialtiesApi.getMyModuleOverview(specialtyKey || undefined).subscribe({
      next: (overview) => {
        this.overview = this.context?.actor === 'admin' && this.context?.module
          ? { ...overview, module: this.context.module }
          : overview;
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  private loadEncounters(): void {
    if (!this.context || !this.isGenericClinicalModule) {
      this.encounters = [];
      return;
    }
    this.specialtiesApi.listEncounters({ specialty_key: this.context.module.key }).subscribe({
      next: (encounters) => {
        this.encounters = encounters;
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  private getRouteSpecialtyKey(): string | null {
    const raw = this.route.snapshot.paramMap.get('specialtyKey')
      ?? (this.route.snapshot.data?.['specialtyKey'] as string | undefined)
      ?? null;
    if (!raw) {
      return null;
    }
    return String(raw).trim().toLowerCase();
  }

  private resolveContextForRoute(
    context: SpecialtyModuleContext,
    catalog: SpecialtyModuleDefinition[],
    routeSpecialtyKey: string | null
  ): SpecialtyModuleContext {
    if (!routeSpecialtyKey || context.actor !== 'admin') {
      return context;
    }

    const matchedModule = catalog.find((module) => module.key === routeSpecialtyKey);
    if (!matchedModule || matchedModule.key === context.module.key) {
      return context;
    }

    return {
      ...context,
      module: matchedModule,
    };
  }

  private ensureRouteMatchesModule(
    context: SpecialtyModuleContext,
    routeSpecialtyKey: string | null
  ): void {
    if (!routeSpecialtyKey) {
      return;
    }
    if (context.actor === 'admin') {
      return;
    }
    if (routeSpecialtyKey !== context.module.key) {
      void this.router.navigateByUrl(resolveSpecialtyFrontendRoute(context.module.key));
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
    return 'No se pudo completar la operación de especialidad.';
  }

  private isApiErrorShape(value: unknown): value is ApiErrorShape {
    return typeof value === 'object' && value !== null && 'error' in value;
  }
}
