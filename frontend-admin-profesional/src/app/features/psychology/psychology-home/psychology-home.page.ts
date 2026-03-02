import { CommonModule, DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { Patient } from '../../../models';
import {
  PsychologicalEvaluation,
  PsychologicalEvaluationCreate,
  TherapySession,
  TherapySessionCreate
} from '../../../models/psychology.model';
import { AuthService, NotificationService, PatientsApiService, PsychologyApiService } from '../../../core/services';

type ApiErrorShape = {
  error?: {
    msg?: string;
    message?: string;
    error?: string;
  };
};

@Component({
  selector: 'app-psychology-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonMenuButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonSpinner,
    IonTextarea,
    IonSelect,
    IonSelectOption
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Psicologia</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Evaluaciones y sesiones</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>
            Gestion operativa del modulo de psicologia. Si el usuario es admin, aplica filtro por
            paciente para consultar evaluaciones.
          </p>
        </ion-card-content>
      </ion-card>

      <ion-card>
        <ion-card-content class="toolbar-card">
          <ion-item lines="none">
            <ion-label position="stacked">Filtrar por paciente (opcional)</ion-label>
            <ion-select [(ngModel)]="patientFilterId" interface="modal" placeholder="Todos">
              <ion-select-option [value]="null">Todos</ion-select-option>
              @for (patient of patients; track patient.id) {
                <ion-select-option [value]="patient.id">
                  {{ formatPatientOption(patient) }}
                </ion-select-option>
              }
            </ion-select>
          </ion-item>
          <div class="toolbar-actions">
            <ion-button size="small" (click)="applyPatientFilter()">Filtrar</ion-button>
            <ion-button size="small" fill="outline" (click)="clearPatientFilter()">Limpiar</ion-button>
            <ion-button size="small" fill="outline" (click)="loadEvaluations()">Actualizar</ion-button>
          </div>
        </ion-card-content>
      </ion-card>

      @if (infoMessage) {
        <p class="info-text">{{ infoMessage }}</p>
      }
      @if (errorMessage) {
        <p class="error-text">{{ errorMessage }}</p>
      }
      @if (successMessage) {
        <p class="success-text">{{ successMessage }}</p>
      }

      <ion-card>
        <ion-card-header>
          <ion-card-title>Nueva evaluacion psicologica</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-item>
            <ion-label position="stacked">Paciente</ion-label>
            <ion-select [(ngModel)]="evaluationDraft.patient_id" interface="modal" placeholder="Seleccionar paciente">
              @for (patient of patients; track patient.id) {
                <ion-select-option [value]="patient.id">
                  {{ formatPatientOption(patient) }}
                </ion-select-option>
              }
            </ion-select>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Motivo</ion-label>
            <ion-input [(ngModel)]="evaluationDraft.reason"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Diagnostico principal</ion-label>
            <ion-input [(ngModel)]="evaluationDraft.primary_diagnosis"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Recomendaciones</ion-label>
            <ion-textarea rows="2" [(ngModel)]="evaluationDraft.treatment_recommendations"></ion-textarea>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Fecha de evaluacion</ion-label>
            <ion-input type="date" [(ngModel)]="evaluationDraft.evaluation_date"></ion-input>
          </ion-item>
          <div class="section-actions">
            <ion-button (click)="createEvaluation()" [disabled]="creatingEvaluation">
              @if (creatingEvaluation) { Creando... } @else { Crear evaluacion }
            </ion-button>
          </div>
        </ion-card-content>
      </ion-card>

      <ion-card>
        <ion-card-header>
          <ion-card-title>Evaluaciones</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          @if (loadingEvaluations) {
            <div class="loading-box">
              <ion-spinner name="crescent"></ion-spinner>
            </div>
          } @else if (evaluations.length === 0) {
            <p>No hay evaluaciones para los filtros aplicados.</p>
          } @else {
            <ion-list>
              @for (evaluation of evaluations; track evaluation.id) {
                <ion-item>
                  <ion-label>
                    <h2>#{{ evaluation.id }} · {{ getPatientName(evaluation.patient_id) }} (#{{ evaluation.patient_id }})</h2>
                    <p>{{ evaluation.reason }}</p>
                    <p>{{ evaluation.status }} · {{ evaluation.evaluation_date | date:'mediumDate' }}</p>
                  </ion-label>
                  <ion-button fill="outline" size="small" (click)="selectEvaluation(evaluation)">
                    Sesiones
                  </ion-button>
                  <ion-button
                    fill="outline"
                    size="small"
                    color="success"
                    (click)="completeEvaluation(evaluation)"
                    [disabled]="evaluation.status === 'completed'"
                  >
                    Cerrar
                  </ion-button>
                  <ion-button fill="outline" size="small" color="danger" (click)="deleteEvaluation(evaluation)">
                    Eliminar
                  </ion-button>
                </ion-item>
              }
            </ion-list>
          }
        </ion-card-content>
      </ion-card>

      @if (selectedEvaluation) {
        <ion-card>
          <ion-card-header>
            <ion-card-title>Sesiones para evaluacion #{{ selectedEvaluation.id }}</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-item>
              <ion-label>
                <h3>Paciente</h3>
                <p>{{ getPatientName(selectedEvaluation.patient_id) }} (#{{ selectedEvaluation.patient_id }})</p>
              </ion-label>
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Fecha sesion</ion-label>
              <ion-input type="date" [(ngModel)]="sessionDraft.session_date"></ion-input>
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Notas de sesion</ion-label>
              <ion-textarea rows="3" [(ngModel)]="sessionDraft.session_notes"></ion-textarea>
            </ion-item>
            <div class="section-actions">
              <ion-button (click)="createSession()" [disabled]="creatingSession">
                @if (creatingSession) { Guardando... } @else { Crear sesion }
              </ion-button>
            </div>

            @if (loadingSessions) {
              <div class="loading-box">
                <ion-spinner name="crescent"></ion-spinner>
              </div>
            } @else if (sessions.length === 0) {
              <p>Sin sesiones registradas para esta evaluacion.</p>
            } @else {
              <ion-list>
                @for (session of sessions; track session.id) {
                  <ion-item>
                    <ion-label>
                      <h3>Sesion #{{ session.id }} · {{ session.session_date | date:'mediumDate' }}</h3>
                      <p>{{ session.session_notes }}</p>
                    </ion-label>
                    <ion-button fill="outline" size="small" color="danger" (click)="deleteSession(session)">
                      Eliminar
                    </ion-button>
                  </ion-item>
                }
              </ion-list>
            }
          </ion-card-content>
        </ion-card>
      }
    </ion-content>
  `,
  styles: [`
    .toolbar-card {
      display: grid;
      gap: 8px;
    }

    .toolbar-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .section-actions {
      margin: 12px 0;
    }

    .loading-box {
      display: flex;
      justify-content: center;
      padding: 16px 0;
    }

    .info-text,
    .error-text,
    .success-text {
      border-radius: 8px;
      font-size: 0.86rem;
      margin: 0 0 10px;
      padding: 8px 10px;
    }

    .info-text {
      background: rgba(var(--ion-color-primary-rgb), 0.14);
      border: 1px solid rgba(var(--ion-color-primary-rgb), 0.3);
      color: var(--ion-color-primary);
    }

    .error-text {
      background: rgba(var(--ion-color-danger-rgb), 0.14);
      border: 1px solid rgba(var(--ion-color-danger-rgb), 0.3);
      color: var(--ion-color-danger);
    }

    .success-text {
      background: rgba(var(--ion-color-success-rgb), 0.14);
      border: 1px solid rgba(var(--ion-color-success-rgb), 0.3);
      color: var(--ion-color-success);
    }
  `]
})
export class PsychologyHomePage implements OnInit {
  private readonly psychologyApi = inject(PsychologyApiService);
  private readonly authService = inject(AuthService);
  private readonly patientsApi = inject(PatientsApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notification = inject(NotificationService);

  evaluations: PsychologicalEvaluation[] = [];
  sessions: TherapySession[] = [];
  selectedEvaluation: PsychologicalEvaluation | null = null;

  loadingEvaluations = false;
  loadingSessions = false;
  creatingEvaluation = false;
  creatingSession = false;
  loadingPatients = false;

  patients: Patient[] = [];
  patientFilterId: number | null = null;
  activePatientId: number | null = null;
  currentUserId: number | null = null;
  currentUserRole: string | null = null;

  infoMessage: string | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  evaluationDraft: {
    patient_id: number | null;
    reason: string;
    primary_diagnosis: string;
    treatment_recommendations: string;
    evaluation_date: string;
  } = {
    patient_id: null,
    reason: '',
    primary_diagnosis: '',
    treatment_recommendations: '',
    evaluation_date: this.today()
  };

  sessionDraft: {
    session_date: string;
    session_notes: string;
  } = {
    session_date: this.today(),
    session_notes: ''
  };

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        this.currentUserId = user?.id ?? null;
        this.currentUserRole = user?.role ?? null;
        if (user) {
          this.loadPatients();
          this.loadEvaluations();
        }
      });
  }

  applyPatientFilter(): void {
    this.activePatientId = this.patientFilterId;
    this.loadEvaluations();
  }

  clearPatientFilter(): void {
    this.patientFilterId = null;
    this.activePatientId = null;
    this.loadEvaluations();
  }

  loadPatients(): void {
    this.loadingPatients = true;
    this.patientsApi
      .list({ specialty_key: 'psychology' })
      .subscribe({
        next: (patients) => {
          this.patients = [...patients].sort((a, b) =>
            `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
          );
          this.loadingPatients = false;
        },
        error: () => {
          this.loadingPatients = false;
        }
      });
  }

  loadEvaluations(): void {
    this.loadingEvaluations = true;
    this.errorMessage = null;
    this.successMessage = null;
    this.infoMessage = null;

    let request$;
    if (this.activePatientId) {
      request$ = this.psychologyApi.listEvaluationsByPatient(this.activePatientId);
    } else if (this.currentUserRole === 'professional' && this.currentUserId) {
      request$ = this.psychologyApi.listEvaluationsByProfessional(this.currentUserId);
    } else {
      this.loadingEvaluations = false;
      this.evaluations = [];
      this.selectedEvaluation = null;
      this.sessions = [];
      this.infoMessage = 'Para usuario admin, selecciona un paciente para consultar evaluaciones.';
      return;
    }

    request$.subscribe({
      next: (evaluations) => {
        this.evaluations = [...evaluations].sort(
          (a, b) => new Date(b.evaluation_date).getTime() - new Date(a.evaluation_date).getTime()
        );
        if (this.selectedEvaluation) {
          const selected = this.evaluations.find((item) => item.id === this.selectedEvaluation?.id) ?? null;
          this.selectedEvaluation = selected;
          if (selected) {
            this.loadSessions(selected.id);
          } else {
            this.sessions = [];
          }
        }
        this.loadingEvaluations = false;
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error);
        this.loadingEvaluations = false;
      }
    });
  }

  createEvaluation(): void {
    const selectedPatientId = Number(this.evaluationDraft.patient_id);
    const reason = this.evaluationDraft.reason.trim();
    const primaryDiagnosis = this.evaluationDraft.primary_diagnosis.trim();
    const recommendations = this.evaluationDraft.treatment_recommendations.trim();

    if (!Number.isInteger(selectedPatientId) || selectedPatientId <= 0 || !reason || !primaryDiagnosis || !recommendations) {
      this.errorMessage = 'Completa los campos obligatorios de la evaluacion.';
      return;
    }

    const payload: PsychologicalEvaluationCreate = {
      patient_id: selectedPatientId,
      reason,
      primary_diagnosis: primaryDiagnosis,
      treatment_recommendations: recommendations,
      evaluation_date: this.evaluationDraft.evaluation_date || this.today()
    };

    this.creatingEvaluation = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.psychologyApi.createEvaluation(payload).subscribe({
      next: (evaluation) => {
        this.creatingEvaluation = false;
        this.successMessage = `Evaluacion #${evaluation.id} creada correctamente.`;
        this.activePatientId = evaluation.patient_id;
        this.patientFilterId = evaluation.patient_id;
        this.evaluationDraft = {
          patient_id: evaluation.patient_id,
          reason: '',
          primary_diagnosis: '',
          treatment_recommendations: '',
          evaluation_date: this.today()
        };
        this.loadEvaluations();
      },
      error: (error: unknown) => {
        this.creatingEvaluation = false;
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  selectEvaluation(evaluation: PsychologicalEvaluation): void {
    this.selectedEvaluation = evaluation;
    this.loadSessions(evaluation.id);
  }

  completeEvaluation(evaluation: PsychologicalEvaluation): void {
    this.errorMessage = null;
    this.successMessage = null;
    this.psychologyApi.updateEvaluation(evaluation.id, { status: 'completed' }).subscribe({
      next: (updatedEvaluation) => {
        this.evaluations = this.evaluations.map((item) =>
          item.id === updatedEvaluation.id ? { ...item, ...updatedEvaluation } : item
        );
        if (this.selectedEvaluation?.id === updatedEvaluation.id) {
          this.selectedEvaluation = { ...this.selectedEvaluation, ...updatedEvaluation };
        }
        this.successMessage = `Evaluacion #${updatedEvaluation.id} cerrada.`;
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  async deleteEvaluation(evaluation: PsychologicalEvaluation): Promise<void> {
    const confirmed = await this.notification.confirm(
      'Eliminar evaluacion',
      `Eliminar evaluacion #${evaluation.id}?`,
      'Eliminar'
    );
    if (!confirmed) {
      return;
    }

    this.errorMessage = null;
    this.successMessage = null;
    this.psychologyApi.deleteEvaluation(evaluation.id).subscribe({
      next: () => {
        this.evaluations = this.evaluations.filter((item) => item.id !== evaluation.id);
        if (this.selectedEvaluation?.id === evaluation.id) {
          this.selectedEvaluation = null;
          this.sessions = [];
        }
        this.successMessage = `Evaluacion #${evaluation.id} eliminada.`;
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  loadSessions(evaluationId: number): void {
    this.loadingSessions = true;
    this.errorMessage = null;

    this.psychologyApi.listSessions(evaluationId).subscribe({
      next: (sessions) => {
        this.sessions = [...sessions].sort(
          (a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
        );
        this.loadingSessions = false;
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error);
        this.loadingSessions = false;
      }
    });
  }

  createSession(): void {
    if (!this.selectedEvaluation) {
      this.errorMessage = 'Selecciona una evaluacion antes de registrar una sesion.';
      return;
    }

    const sessionNotes = this.sessionDraft.session_notes.trim();
    if (!sessionNotes) {
      this.errorMessage = 'Las notas de sesion son obligatorias.';
      return;
    }

    const payload: TherapySessionCreate = {
      evaluation_id: this.selectedEvaluation.id,
      patient_id: this.selectedEvaluation.patient_id,
      session_date: this.sessionDraft.session_date || this.today(),
      session_notes: sessionNotes
    };

    this.creatingSession = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.psychologyApi.createSession(payload).subscribe({
      next: (session) => {
        this.sessions = [session, ...this.sessions];
        this.sessionDraft = {
          session_date: this.today(),
          session_notes: ''
        };
        this.creatingSession = false;
        this.successMessage = `Sesion #${session.id} creada correctamente.`;
      },
      error: (error: unknown) => {
        this.creatingSession = false;
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  async deleteSession(session: TherapySession): Promise<void> {
    const confirmed = await this.notification.confirm(
      'Eliminar sesion',
      `Eliminar sesion #${session.id}?`,
      'Eliminar'
    );
    if (!confirmed) {
      return;
    }

    this.errorMessage = null;
    this.successMessage = null;
    this.psychologyApi.deleteSession(session.id).subscribe({
      next: () => {
        this.sessions = this.sessions.filter((item) => item.id !== session.id);
        this.successMessage = `Sesion #${session.id} eliminada.`;
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }

  formatPatientOption(patient: Patient): string {
    return `${patient.first_name} ${patient.last_name} (#${patient.id})`;
  }

  getPatientName(patientId: number): string {
    const patient = this.patients.find((item) => item.id === patientId);
    if (!patient) {
      return `Paciente #${patientId}`;
    }
    return `${patient.first_name} ${patient.last_name}`;
  }

  private resolveErrorMessage(error: unknown): string {
    if (this.isApiErrorShape(error)) {
      const message = error.error?.msg ?? error.error?.message ?? error.error?.error;
      if (typeof message === 'string' && message.trim().length > 0) {
        return message;
      }
    }
    return 'No se pudo completar la operacion en psicologia.';
  }

  private isApiErrorShape(value: unknown): value is ApiErrorShape {
    return typeof value === 'object' && value !== null && 'error' in value;
  }
}
