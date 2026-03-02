import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
} from '@ionic/angular/standalone';
import { catchError, forkJoin, of } from 'rxjs';
import {
  SpecialtiesApiService,
  SpecialtyHistoryPayload,
  SpecialtyModuleDefinition,
  SpecialtyModuleOverview,
} from '../../../core/services/specialties-api.service';

@Component({
  selector: 'app-specialty-home-page',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    RouterLink,
    IonBadge,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonList,
    IonSpinner,
  ],
  template: `
    <ion-content class="ion-padding specialty-home">
      @if (loading) {
        <section class="loading-state">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Cargando modulo de especialidad...</p>
        </section>
      } @else {
        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ module?.label || 'Especialidad' }}</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>{{ module?.description || 'Flujo clínico especializado.' }}</p>
            <div class="chip-row">
              @for (section of module?.coreSections ?? []; track section) {
                <ion-badge color="light">{{ section }}</ion-badge>
              }
            </div>
          </ion-card-content>
        </ion-card>

        @if (overview) {
          <section class="stats-grid">
            <article class="stat-card">
              <strong>{{ overview.totals.patients }}</strong>
              <span>Pacientes</span>
            </article>
            <article class="stat-card">
              <strong>{{ overview.totals.appointments_upcoming }}</strong>
              <span>Próximas citas</span>
            </article>
            <article class="stat-card">
              <strong>{{ overview.totals.medical_records }}</strong>
              <span>Registros</span>
            </article>
            <article class="stat-card">
              <strong>{{ overview.totals.specialty_encounters }}</strong>
              <span>Encuentros</span>
            </article>
            <article class="stat-card">
              <strong>{{ overview.totals.documents }}</strong>
              <span>Documentos</span>
            </article>
            <article class="stat-card">
              <strong>{{ overview.totals.revenue_completed | currency:(overview.totals.currency || 'PYG'):'symbol':'1.0-0' }}</strong>
              <span>Facturación</span>
            </article>
          </section>
        }

        <ion-card>
          <ion-card-header>
            <ion-card-title>Accesos clínicos</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list lines="full">
              <ion-item [routerLink]="moduleRoute" detail>
                <ion-label>
                  <h2>Workspace clínico</h2>
                  <p>Panel operativo completo del módulo.</p>
                </ion-label>
              </ion-item>
              <ion-item [routerLink]="['/patients']" [queryParams]="scopeQueryParams" detail>
                <ion-label>
                  <h2>Pacientes del módulo</h2>
                  <p>Listado filtrado por especialidad activa.</p>
                </ion-label>
              </ion-item>
              <ion-item [routerLink]="['/appointments']" [queryParams]="scopeQueryParams" detail>
                <ion-label>
                  <h2>Citas del módulo</h2>
                  <p>Agenda y estados operativos por especialidad.</p>
                </ion-label>
              </ion-item>
              <ion-item [routerLink]="['/medical-records']" [queryParams]="scopeQueryParams" detail>
                <ion-label>
                  <h2>Historiales clínicos</h2>
                  <p>Registros médicos segmentados por especialidad.</p>
                </ion-label>
              </ion-item>
              <ion-item [routerLink]="['/files']" [queryParams]="scopeQueryParams" detail>
                <ion-label>
                  <h2>Documentos clínicos</h2>
                  <p>Archivos y estudios asociados al módulo.</p>
                </ion-label>
              </ion-item>
              <ion-item [routerLink]="['/budgets']" [queryParams]="scopeQueryParams" detail>
                <ion-label>
                  <h2>Presupuestos</h2>
                  <p>Facturación y pagos del dominio clínico.</p>
                </ion-label>
              </ion-item>
            </ion-list>

            <ion-button expand="block" [routerLink]="moduleRoute" class="ion-margin-top">
              Abrir módulo de {{ module?.label || 'especialidad' }}
            </ion-button>
          </ion-card-content>
        </ion-card>

        @if (history) {
          <ion-card>
            <ion-card-header>
              <ion-card-title>Actividad reciente</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="insight-grid">
                <section>
                  <h3>Pacientes en seguimiento</h3>
                  @if (history.patients.length === 0) {
                    <p class="empty-text">Sin pacientes activos en este módulo.</p>
                  } @else {
                    <ul class="mini-list">
                      @for (patient of history.patients.slice(0, 6); track patient.id) {
                        <li>
                          <a [routerLink]="['/patients', patient.id]">
                            {{ patient.first_name }} {{ patient.last_name }}
                          </a>
                          <small>{{ patient.email }}</small>
                        </li>
                      }
                    </ul>
                  }
                </section>

                <section>
                  <h3>Encuentros clínicos</h3>
                  @if (history.specialty_encounters.length === 0) {
                    <p class="empty-text">Sin atenciones registradas.</p>
                  } @else {
                    <ul class="mini-list">
                      @for (encounter of history.specialty_encounters.slice(0, 6); track encounter.id) {
                        <li>
                          <a [routerLink]="['/patients', encounter.patient_id]">
                            {{ encounter.patient_name }}
                          </a>
                          <small>
                            {{ encounter.visit_date | date:'short' }} ·
                            {{ encounter.diagnosis || encounter.chief_complaint }}
                          </small>
                        </li>
                      }
                    </ul>
                  }
                </section>

                <section>
                  <h3>Historial médico</h3>
                  @if (history.medical_records.length === 0) {
                    <p class="empty-text">Sin historiales segmentados todavía.</p>
                  } @else {
                    <ul class="mini-list">
                      @for (record of history.medical_records.slice(0, 6); track record.id) {
                        <li>
                          <a [routerLink]="['/patients', record.patient_id]">
                            {{ record.patient_name }}
                          </a>
                          <small>
                            {{ record.record_date | date:'shortDate' }} ·
                            {{ record.diagnosis || 'Sin diagnóstico' }}
                          </small>
                        </li>
                      }
                    </ul>
                  }
                </section>

                <section>
                  <h3>Documentos recientes</h3>
                  @if (history.documents.length === 0) {
                    <p class="empty-text">Sin documentos clínicos.</p>
                  } @else {
                    <ul class="mini-list">
                      @for (document of history.documents.slice(0, 6); track document.id) {
                        <li>
                          <a
                            [routerLink]="['/files']"
                            [queryParams]="{
                              specialty_key: specialtyKey,
                              patient_id: document.patient_id || undefined
                            }"
                          >
                            {{ document.filename }}
                          </a>
                          <small>
                            {{ document.patient_name || 'Paciente no definido' }} ·
                            {{ document.created_at | date:'short' }}
                          </small>
                        </li>
                      }
                    </ul>
                  }
                </section>
              </div>
            </ion-card-content>
          </ion-card>
        }

        @if (errorMessage) {
          <ion-card color="danger">
            <ion-card-content>{{ errorMessage }}</ion-card-content>
          </ion-card>
        }
      }
    </ion-content>
  `,
  styles: [
    `
      .specialty-home {
        --background: var(--app-background, #f4f7fb);
      }

      .loading-state {
        align-items: center;
        display: flex;
        flex-direction: column;
        gap: 12px;
        justify-content: center;
        min-height: 40vh;
      }

      .chip-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 12px;
      }

      .stats-grid {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        margin-bottom: 16px;
      }

      .stat-card {
        background: var(--ion-color-light);
        border: 1px solid rgba(var(--ion-color-primary-rgb), 0.12);
        border-radius: 16px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 16px;
      }

      .stat-card strong {
        color: var(--ion-color-dark);
        font-size: 1.35rem;
      }

      .stat-card span {
        color: var(--ion-color-medium);
        font-size: 0.8rem;
      }

      .insight-grid {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      }

      .insight-grid section h3 {
        color: var(--ion-color-dark);
        font-size: 0.95rem;
        margin: 0 0 8px;
      }

      .mini-list {
        display: grid;
        gap: 8px;
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .mini-list li {
        background: rgba(var(--ion-color-primary-rgb), 0.04);
        border: 1px solid rgba(var(--ion-color-primary-rgb), 0.08);
        border-radius: 12px;
        display: grid;
        gap: 2px;
        padding: 10px 12px;
      }

      .mini-list a {
        color: var(--ion-color-dark);
        font-weight: 600;
        text-decoration: none;
      }

      .mini-list small,
      .empty-text {
        color: var(--ion-color-medium);
      }
    `,
  ],
})
export class SpecialtyHomePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly specialtiesApi = inject(SpecialtiesApiService);

  specialtyKey = '';
  module: SpecialtyModuleDefinition | null = null;
  overview: SpecialtyModuleOverview | null = null;
  history: SpecialtyHistoryPayload | null = null;
  errorMessage = '';
  loading = true;

  get scopeQueryParams(): { specialty_key: string } {
    return { specialty_key: this.specialtyKey };
  }

  get moduleRoute(): string[] {
    return ['workspace'];
  }

  ngOnInit(): void {
    this.specialtyKey = this.route.snapshot.data['specialtyKey'] ?? '';
    this.loadData();
  }

  private loadData(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      overview: this.specialtiesApi
        .getMyModuleOverview(this.specialtyKey)
        .pipe(catchError(() => of(null))),
      history: this.specialtiesApi
        .getHistory({ specialty_key: this.specialtyKey })
        .pipe(catchError(() => of(null)))
    }).subscribe({
      next: ({ overview, history }) => {
        this.overview = overview;
        this.history = history;
        this.module = overview?.module ?? history?.module ?? null;
        if (!this.module) {
          this.errorMessage = 'No se pudo resolver el módulo clínico solicitado.';
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'No se pudo cargar la información de la especialidad.';
      }
    });
  }
}
