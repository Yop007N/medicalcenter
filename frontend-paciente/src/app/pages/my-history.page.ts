import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  ClinicalHistoryEvent,
  ClinicalSummary,
  InformedConsentItem,
  PatientApiService,
  PatientDocumentItem,
  PatientSpecialtyOverview,
  PatientOdontogram,
  PatientOdontogramTooth,
  SpecialtyCatalogItem
} from '../core/services/patient-api.service';
import { UiDialogService } from '../core/services/ui-dialog.service';
import { OfflineService } from '../core/services/offline.service';
import { SyncService } from '../core/services/sync.service';
import { pageShellStyles } from './page-shell.styles';

type SegmentView = 'summary' | 'timeline' | 'documents' | 'consents' | 'odontogram';

type ApiErrorShape = {
  error?: {
    msg?: string;
    message?: string;
    error?: string;
  };
};

type SectionResult<T> = {
  data: T;
  warning: string | null;
};

@Component({
  selector: 'app-my-history-page',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-header translucent="true">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Mi historia clinica</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="page-content">
      <section class="panel">
        <h2 class="panel-title">Historia y consentimientos</h2>
        <p class="panel-text">Consulta resumen clinico, eventos, documentos, consentimientos y odontograma.</p>
      </section>

      <section class="panel connectivity-panel">
        <p class="panel-text">
          Estado de red:
          <span class="status-chip" [class]="isOnline ? 'status-signed' : 'status-pending'">
            {{ isOnline ? 'Online' : 'Offline' }}
          </span>
        </p>
        <p class="panel-text">Cambios pendientes de sync: <strong>{{ pendingChangesCount }}</strong></p>
        @if (isOnline && pendingChangesCount > 0) {
          <ion-button size="small" fill="outline" (click)="syncNow()" [disabled]="syncing">
            @if (syncing) { Sincronizando... } @else { Sincronizar ahora }
          </ion-button>
        }
      </section>

      <section class="panel specialty-panel">
        <h3 class="panel-title">Enfoque por especialidad</h3>
        <p class="panel-text">
          Filtra el resumen por especialidad para ver tus turnos y registros clinicos mas relevantes.
        </p>
        <ion-item lines="none">
          <ion-label>Especialidad</ion-label>
          <ion-select
            [value]="selectedSpecialtyKey"
            placeholder="Todas"
            interface="popover"
            (ionChange)="onSpecialtyChange($event)"
          >
            <ion-select-option value="">Todas</ion-select-option>
            @for (specialty of specialtyCatalog; track specialty.key) {
              <ion-select-option [value]="specialty.key">{{ specialty.label }}</ion-select-option>
            }
          </ion-select>
        </ion-item>

        @if (selectedSpecialtyKey && specialtyOverview) {
          <div class="summary-grid">
            <article>
              <strong>{{ specialtyOverview.totals.appointments_upcoming }}</strong>
              <span>Proximas citas</span>
            </article>
            <article>
              <strong>{{ specialtyOverview.totals.medical_records }}</strong>
              <span>Registros clinicos</span>
            </article>
            <article>
              <strong>{{ specialtyOverview.totals.payments_completed }}</strong>
              <span>Pagos completados</span>
            </article>
            <article>
              <strong>
                {{
                  specialtyOverview.totals.revenue_completed
                    | currency:specialtyOverview.totals.currency:'symbol':'1.0-0'
                }}
              </strong>
              <span>Facturacion completada</span>
            </article>
          </div>

          @if (specialtyOverview.upcoming_appointments.length > 0) {
            <h4 class="sub-title">Proximas citas por especialidad</h4>
            <ul class="simple-list">
              @for (appointment of specialtyOverview.upcoming_appointments; track appointment.id) {
                <li>
                  <strong>{{ appointment.appointment_type || 'Consulta' }}</strong>
                  <div>{{ appointment.appointment_date | date:'medium' }} · {{ appointment.status }}</div>
                </li>
              }
            </ul>
          }

          @if (specialtyOverview.recent_medical_records.length > 0) {
            <h4 class="sub-title">Registros recientes por especialidad</h4>
            <ul class="simple-list">
              @for (record of specialtyOverview.recent_medical_records; track record.id) {
                <li>
                  <strong>{{ record.diagnosis || 'Sin diagnostico' }}</strong>
                  <div>{{ (record.record_date || specialtyOverview.generated_at) | date:'mediumDate' }}</div>
                </li>
              }
            </ul>
          }
        }
      </section>

      <ion-segment [value]="activeView" (ionChange)="onViewChange($event)">
        <ion-segment-button value="summary">Resumen</ion-segment-button>
        <ion-segment-button value="timeline">Timeline</ion-segment-button>
        <ion-segment-button value="documents">Documentos</ion-segment-button>
        <ion-segment-button value="consents">Consentimientos</ion-segment-button>
        <ion-segment-button value="odontogram">Odontograma</ion-segment-button>
      </ion-segment>

      <ion-refresher slot="fixed" (ionRefresh)="refresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      @if (errorMessage) {
        <div class="error-box" role="alert">{{ errorMessage }}</div>
      }

      @if (warningMessage) {
        <div class="warning-box" role="status">{{ warningMessage }}</div>
      }

      @if (loading) {
        <section class="panel loading-panel">
          <ion-spinner name="crescent"></ion-spinner>
          <p class="panel-text">Cargando historia clinica...</p>
        </section>
      }

      @if (!loading && activeView === 'summary') {
        @if (summary) {
          <section class="panel">
            <h3 class="panel-title">Estado general</h3>
            <div class="summary-grid">
              <article>
                <strong>{{ summary.counts.evolutions }}</strong>
                <span>Evoluciones</span>
              </article>
              <article>
                <strong>{{ summary.counts.prescriptions }}</strong>
                <span>Recetas</span>
              </article>
              <article>
                <strong>{{ summary.counts.documents }}</strong>
                <span>Documentos</span>
              </article>
              <article>
                <strong>{{ summary.counts.consents_pending }}</strong>
                <span>Consents pendientes</span>
              </article>
            </div>

            <p class="panel-text">
              Anamnesis cargada:
              <strong>{{ summary.has_anamnesis ? 'Si' : 'No' }}</strong>
            </p>

            @if (summary.medical_alerts.length > 0) {
              <h4 class="sub-title">Alertas medicas</h4>
              <ul class="simple-list">
                @for (alert of summary.medical_alerts; track alert) {
                  <li>{{ alert }}</li>
                }
              </ul>
            }
          </section>

          <section class="panel">
            <h3 class="panel-title">Eventos recientes</h3>
            @if (summary.recent_events.length === 0) {
              <p class="panel-text">Sin eventos recientes.</p>
            } @else {
              <ul class="simple-list">
                @for (event of summary.recent_events; track event.id) {
                  <li>
                    <strong>{{ event.title || event.event_type }}</strong>
                    <div>{{ event.event_date | date:'medium' }}</div>
                  </li>
                }
              </ul>
            }
          </section>
        } @else {
          <section class="panel">
            <p class="panel-text">No hay informacion clinica para mostrar.</p>
          </section>
        }
      }

      @if (!loading && activeView === 'timeline') {
        @if (timeline.length === 0) {
          <section class="panel">
            <p class="panel-text">No hay eventos de timeline disponibles.</p>
          </section>
        } @else {
          <ion-list inset="true">
            @for (event of timeline; track event.id) {
              <ion-item>
                <ion-label>
                  <h2>{{ event.title || event.event_type }}</h2>
                  <p>{{ event.description || 'Sin descripcion' }}</p>
                  <small>{{ event.event_date | date:'medium' }}</small>
                </ion-label>
                @if (event.is_important) {
                  <ion-badge color="warning">Importante</ion-badge>
                }
              </ion-item>
            }
          </ion-list>
        }
      }

      @if (!loading && activeView === 'documents') {
        @if (documents.length === 0) {
          <section class="panel">
            <p class="panel-text">No hay documentos cargados para este paciente.</p>
          </section>
        } @else {
          @for (document of documents; track document.id) {
            <section class="panel">
              <h3 class="panel-title">{{ document.title || 'Documento clinico' }}</h3>
              <p class="panel-text">Tipo: {{ document.document_type }}</p>
              <p class="panel-text">Fecha: {{ (document.document_date || document.created_at) | date:'mediumDate' }}</p>
              @if (document.description) {
                <p class="panel-text">{{ document.description }}</p>
              }
              <ion-button size="small" fill="outline" (click)="downloadDocument(document)">
                Descargar
              </ion-button>
            </section>
          }
        }
      }

      @if (!loading && activeView === 'consents') {
        @if (consents.length === 0) {
          <section class="panel">
            <p class="panel-text">No hay consentimientos para mostrar.</p>
          </section>
        } @else {
          @for (consent of consents; track consent.id) {
            <section class="panel">
              <h3 class="panel-title">{{ consent.title }}</h3>
              <p class="panel-text">Tipo: {{ consent.consent_type }}</p>
              <p class="panel-text">
                Estado:
                <span class="status-chip" [class]="'status-' + consent.status">{{ consent.status }}</span>
              </p>
              <p class="panel-text">Creado: {{ consent.created_at | date:'medium' }}</p>

              @if (consent.content) {
                <p class="panel-text content-preview">{{ consent.content }}</p>
              }

              @if (consent.status === 'pending') {
                <div class="consent-actions">
                  <ion-button
                    size="small"
                    (click)="signConsent(consent)"
                    [disabled]="processingConsentIds.has(consent.id)"
                  >
                    Firmar
                  </ion-button>
                  <ion-button
                    size="small"
                    fill="outline"
                    color="danger"
                    (click)="rejectConsent(consent)"
                    [disabled]="processingConsentIds.has(consent.id)"
                  >
                    Rechazar
                  </ion-button>
                </div>
              }

              @if (consent.status === 'signed' && consent.patient_signed_at) {
                <p class="panel-text">Firmado: {{ consent.patient_signed_at | date:'medium' }}</p>
              }

              @if (consent.status === 'rejected' && consent.rejected_reason) {
                <p class="panel-text">Motivo: {{ consent.rejected_reason }}</p>
              }
            </section>
          }
        }
      }

      @if (!loading && activeView === 'odontogram') {
        @if (!odontogram) {
          <section class="panel">
            <h3 class="panel-title">Odontograma</h3>
            <p class="panel-text">Todavia no hay odontograma activo para este paciente.</p>
          </section>
        } @else {
          <section class="panel">
            <h3 class="panel-title">Odontograma activo</h3>
            <p class="panel-text">
              Ultima actualizacion:
              <strong>{{ (odontogram.updated_at || odontogram.created_at) | date:'medium' }}</strong>
            </p>
            <div class="summary-grid">
              <article>
                <strong>{{ countTeethByStatus('healthy') }}</strong>
                <span>Sanos</span>
              </article>
              <article>
                <strong>{{ countTeethByStatus('caries') }}</strong>
                <span>Caries</span>
              </article>
              <article>
                <strong>{{ countTeethByStatus('filled') }}</strong>
                <span>Restaurados</span>
              </article>
              <article>
                <strong>{{ countTeethByStatus('missing') + countTeethByStatus('extracted') }}</strong>
                <span>Ausentes</span>
              </article>
            </div>
          </section>

          @if (odontogramTeeth.length === 0) {
            <section class="panel">
              <p class="panel-text">El odontograma aun no tiene piezas dentales cargadas.</p>
            </section>
          } @else {
            <ion-list inset="true">
              @for (tooth of odontogramTeeth; track tooth.id) {
                <ion-item>
                  <ion-label>
                    <h2>Diente {{ tooth.tooth_number }}</h2>
                    <p>
                      Estado: {{ toToothStatusLabel(tooth.status) }}
                      @if (tooth.planned_treatment) {
                        <br />
                        Plan: {{ tooth.planned_treatment }}
                      }
                      @if (tooth.notes) {
                        <br />
                        Nota: {{ tooth.notes }}
                      }
                    </p>
                  </ion-label>
                  <ion-chip [class]="'tooth-' + (tooth.status || 'healthy')">
                    {{ toToothStatusLabel(tooth.status) }}
                  </ion-chip>
                </ion-item>
              }
            </ion-list>
          }
        }
      }
    </ion-content>
  `,
  styles: [
    pageShellStyles,
    `
      ion-segment {
        margin: 12px;
      }

      .connectivity-panel {
        display: grid;
        gap: 8px;
      }

      .warning-box {
        background: rgba(var(--ion-color-warning-rgb), 0.14);
        border: 1px solid rgba(var(--ion-color-warning-rgb), 0.35);
        border-radius: 10px;
        color: var(--ion-color-warning-shade);
        font-size: 0.82rem;
        margin: 12px;
        padding: 10px;
      }

      .status-pending {
        background: rgba(var(--ion-color-warning-rgb), 0.14);
        color: var(--ion-color-warning-shade);
      }

      .status-signed {
        background: rgba(var(--ion-color-success-rgb), 0.14);
        color: var(--ion-color-success);
      }

      .loading-panel {
        align-items: center;
        display: flex;
        gap: 10px;
      }

      .summary-grid {
        display: grid;
        gap: 8px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        margin-bottom: 12px;
      }

      .summary-grid article {
        background: var(--patient-surface-soft);
        border: 1px solid var(--patient-border);
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 10px;
      }

      .summary-grid strong {
        color: var(--ion-color-dark);
        font-size: 1.05rem;
      }

      .summary-grid span {
        color: var(--ion-color-medium);
        font-size: 0.75rem;
      }

      .sub-title {
        color: var(--ion-color-medium);
        font-size: 0.85rem;
        font-weight: 700;
        margin: 12px 0 6px;
      }

      .simple-list {
        color: var(--ion-color-dark);
        font-size: 0.82rem;
        margin: 0;
        padding-left: 18px;
      }

      .simple-list li {
        margin-bottom: 6px;
      }

      .content-preview {
        white-space: pre-wrap;
      }

      .consent-actions {
        display: flex;
        gap: 8px;
        margin-top: 8px;
      }

      ion-chip[class^='tooth-'] {
        border-radius: 999px;
        font-size: 0.72rem;
        font-weight: 700;
      }

      .tooth-healthy {
        background: rgba(var(--ion-color-success-rgb), 0.16);
        color: var(--ion-color-success-shade);
      }

      .tooth-caries,
      .tooth-to_extract,
      .tooth-fractured {
        background: rgba(var(--ion-color-danger-rgb), 0.16);
        color: var(--ion-color-danger-shade);
      }

      .tooth-filled,
      .tooth-crown,
      .tooth-root_canal {
        background: rgba(var(--ion-color-primary-rgb), 0.16);
        color: var(--ion-color-primary-shade);
      }

      .tooth-missing,
      .tooth-extracted {
        background: rgba(var(--ion-color-medium-rgb), 0.16);
        color: var(--ion-color-medium-shade);
      }

      @media (max-width: 420px) {
        .summary-grid {
          grid-template-columns: 1fr;
        }
      }
    `
  ]
})
export class MyHistoryPage implements OnInit {
  private readonly patientApi = inject(PatientApiService);
  private readonly uiDialog = inject(UiDialogService);
  private readonly offlineService = inject(OfflineService);
  private readonly syncService = inject(SyncService);

  activeView: SegmentView = 'summary';
  loading = false;
  syncing = false;
  isOnline = true;
  pendingChangesCount = 0;
  errorMessage: string | null = null;
  warningMessage: string | null = null;

  summary: ClinicalSummary | null = null;
  timeline: ClinicalHistoryEvent[] = [];
  documents: PatientDocumentItem[] = [];
  consents: InformedConsentItem[] = [];
  odontogram: PatientOdontogram | null = null;
  odontogramTeeth: PatientOdontogramTooth[] = [];
  specialtyCatalog: SpecialtyCatalogItem[] = [];
  selectedSpecialtyKey = '';
  specialtyOverview: PatientSpecialtyOverview | null = null;

  processingConsentIds = new Set<number>();

  ngOnInit(): void {
    this.isOnline = this.offlineService.isOnline;
    this.pendingChangesCount = this.syncService.getPendingChanges().length;
    this.offlineService.online$.subscribe((online) => {
      this.isOnline = online;
      this.pendingChangesCount = this.syncService.getPendingChanges().length;
    });
    this.loadSpecialtyCatalog();
    this.loadHistory();
  }

  onViewChange(event: CustomEvent): void {
    const nextValue = event.detail.value as SegmentView;
    if (nextValue) {
      this.activeView = nextValue;
    }
  }

  onSpecialtyChange(event: CustomEvent<{ value: string }>): void {
    const nextKey = this.normalizeSpecialtyKey(event.detail?.value || '');
    this.selectedSpecialtyKey = nextKey || '';
    this.loadHistory();
  }

  refresh(event: CustomEvent): void {
    this.loadHistory(() => event.detail.complete());
  }

  syncNow(): void {
    if (!this.isOnline) {
      this.warningMessage = 'Estas offline. No se puede sincronizar en este momento.';
      return;
    }

    this.syncing = true;
    this.warningMessage = null;
    this.syncService.syncPendingChanges();
    window.setTimeout(() => {
      this.pendingChangesCount = this.syncService.getPendingChanges().length;
      this.syncing = false;
      if (this.pendingChangesCount === 0) {
        this.warningMessage = 'Sincronizacion completada.';
      }
    }, 700);
  }

  countTeethByStatus(status: string): number {
    return this.odontogramTeeth.filter((tooth) => (tooth.status ?? 'healthy') === status).length;
  }

  toToothStatusLabel(status?: string | null): string {
    const labels: Record<string, string> = {
      healthy: 'Sano',
      caries: 'Caries',
      filled: 'Restaurado',
      crown: 'Corona',
      implant: 'Implante',
      missing: 'Ausente',
      root_canal: 'Endodoncia',
      fractured: 'Fracturado',
      mobile: 'Movil',
      to_extract: 'A extraer',
      extracted: 'Extraido'
    };
    return labels[status ?? 'healthy'] ?? status ?? 'Sano';
  }

  async signConsent(consent: InformedConsentItem): Promise<void> {
    if (!this.isOnline) {
      this.warningMessage = 'No puedes firmar consentimientos mientras estas offline.';
      return;
    }

    const defaultSignature = `signed-by-patient-${new Date().toISOString()}`;
    const signature = await this.uiDialog.promptText({
      header: 'Firmar consentimiento',
      message: consent.title,
      placeholder: 'Escribe tu firma',
      value: defaultSignature,
      confirmText: 'Firmar',
      cancelText: 'Cancelar',
      required: true,
      maxLength: 255
    });

    if (signature === null) {
      return;
    }

    const cleanSignature = signature.trim();
    if (!cleanSignature) {
      this.errorMessage = 'La firma no puede quedar vacia.';
      return;
    }

    this.processingConsentIds.add(consent.id);
    this.errorMessage = null;

    this.patientApi.signConsent(consent.id, cleanSignature).subscribe({
      next: (updatedConsent) => {
        this.updateConsentItem(updatedConsent);
        this.processingConsentIds.delete(consent.id);
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error) || 'No se pudo firmar el consentimiento.';
        this.processingConsentIds.delete(consent.id);
      }
    });
  }

  async rejectConsent(consent: InformedConsentItem): Promise<void> {
    if (!this.isOnline) {
      this.warningMessage = 'No puedes rechazar consentimientos mientras estas offline.';
      return;
    }

    const reason = await this.uiDialog.promptText({
      header: 'Rechazar consentimiento',
      message: consent.title,
      placeholder: 'Motivo de rechazo (opcional)',
      confirmText: 'Rechazar',
      cancelText: 'Volver',
      multiline: true,
      maxLength: 255
    });
    if (reason === null) {
      return;
    }

    this.processingConsentIds.add(consent.id);
    this.errorMessage = null;

    this.patientApi.rejectConsent(consent.id, reason.trim() || undefined).subscribe({
      next: (updatedConsent) => {
        this.updateConsentItem(updatedConsent);
        this.processingConsentIds.delete(consent.id);
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error) || 'No se pudo rechazar el consentimiento.';
        this.processingConsentIds.delete(consent.id);
      }
    });
  }

  downloadDocument(documentItem: PatientDocumentItem): void {
    if (!this.isOnline) {
      this.warningMessage = 'No puedes descargar documentos mientras estas offline.';
      return;
    }

    this.errorMessage = null;

    this.patientApi.downloadClinicalDocument(documentItem.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = window.document.createElement('a');
        anchor.href = url;
        anchor.download = documentItem.file_name || `document-${documentItem.id}`;
        anchor.click();
        URL.revokeObjectURL(url);
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error) || 'No se pudo descargar el documento.';
      }
    });
  }

  private loadHistory(onComplete?: () => void): void {
    this.loading = true;
    this.errorMessage = null;
    this.warningMessage = null;

    const specialtyOverview$ = this.selectedSpecialtyKey
      ? this.withOptionalSectionFallback(
          this.patientApi.getMySpecialtyOverview(this.selectedSpecialtyKey),
          null as PatientSpecialtyOverview | null,
          'No se pudo cargar el resumen por especialidad.'
        )
      : of({ data: null, warning: null } as SectionResult<PatientSpecialtyOverview | null>);

    forkJoin({
      summary: this.withSectionFallback(
        this.patientApi.getMyClinicalSummary(),
        null,
        'No se pudo cargar el resumen clinico.'
      ),
      timeline: this.withSectionFallback(
        this.patientApi.getMyClinicalTimeline(),
        [] as ClinicalHistoryEvent[],
        'No se pudo cargar el timeline.'
      ),
      documents: this.withSectionFallback(
        this.patientApi.getMyClinicalDocuments(),
        [] as PatientDocumentItem[],
        'No se pudo cargar la seccion de documentos.'
      ),
      consents: this.withSectionFallback(
        this.patientApi.getMyConsents(),
        [] as InformedConsentItem[],
        'No se pudo cargar la seccion de consentimientos.'
      ),
      specialtyOverview: specialtyOverview$,
      odontogram: this.withOptionalSectionFallback(
        this.patientApi.getMyOdontogram(),
        null,
        'No se pudo cargar la seccion de odontograma.'
      )
    }).subscribe({
      next: ({ summary, timeline, documents, consents, specialtyOverview, odontogram }) => {
        this.summary = summary.data;
        this.timeline = timeline.data;
        this.documents = documents.data;
        this.consents = consents.data;
        this.specialtyOverview = specialtyOverview.data;
        this.odontogram = odontogram.data;
        this.odontogramTeeth = [...(this.odontogram?.teeth ?? [])].sort(
          (a, b) => a.tooth_number - b.tooth_number
        );
        this.pendingChangesCount = this.syncService.getPendingChanges().length;

        const warnings = [
          summary.warning,
          timeline.warning,
          documents.warning,
          consents.warning,
          specialtyOverview.warning,
          odontogram.warning
        ]
          .filter((message): message is string => !!message);
        if (warnings.length > 0) {
          this.warningMessage = warnings[0];
          if (warnings.length > 1) {
            this.warningMessage += ` (+${warnings.length - 1} secciones con incidencias)`;
          }
        }

        if (
          !this.summary
          && this.timeline.length === 0
          && this.documents.length === 0
          && this.consents.length === 0
          && !this.odontogram
        ) {
          this.errorMessage = 'No se encontro informacion clinica disponible para este paciente.';
        }

        this.loading = false;
        onComplete?.();
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error) || 'No se pudo cargar la historia clinica.';
        this.loading = false;
        onComplete?.();
      }
    });
  }

  private withSectionFallback<T>(source$: Observable<T>, fallback: T, warning: string): Observable<SectionResult<T>> {
    return source$.pipe(
      map((data: T): SectionResult<T> => ({ data, warning: null })),
      catchError((error: unknown) => {
        const message = this.resolveErrorMessage(error) || warning;
        return of({
          data: fallback,
          warning: message
        } as SectionResult<T>);
      })
    );
  }

  private withOptionalSectionFallback<T>(
    source$: Observable<T>,
    fallback: T,
    warning: string
  ): Observable<SectionResult<T>> {
    return source$.pipe(
      map((data: T): SectionResult<T> => ({ data, warning: null })),
      catchError((error: unknown) => {
        if (this.isNotFoundError(error)) {
          return of({ data: fallback, warning: null } as SectionResult<T>);
        }
        const message = this.resolveErrorMessage(error) || warning;
        return of({
          data: fallback,
          warning: message
        } as SectionResult<T>);
      })
    );
  }

  private updateConsentItem(updatedConsent: InformedConsentItem): void {
    this.consents = this.consents.map((consent) =>
      consent.id === updatedConsent.id ? updatedConsent : consent
    );

    if (this.summary) {
      const pending = this.consents.filter((consent) => consent.status === 'pending').length;
      const signed = this.consents.filter((consent) => consent.status === 'signed').length;
      this.summary = {
        ...this.summary,
        counts: {
          ...this.summary.counts,
          consents_pending: pending,
          consents_signed: signed
        }
      };
    }
  }

  private loadSpecialtyCatalog(): void {
    this.patientApi.getSpecialtiesCatalog().subscribe({
      next: (catalog) => {
        this.specialtyCatalog = [...catalog].sort((a, b) => a.label.localeCompare(b.label));
      },
      error: () => {
        this.specialtyCatalog = [];
      }
    });
  }

  private normalizeSpecialtyKey(rawValue: string): string | null {
    const normalized = String(rawValue || '').trim().toLowerCase();
    if (!normalized) {
      return null;
    }
    return /^[a-z0-9-]+$/.test(normalized) ? normalized : null;
  }

  private resolveErrorMessage(error: unknown): string | null {
    if (this.isApiErrorShape(error)) {
      const message = error.error?.msg ?? error.error?.message ?? error.error?.error;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }

    return null;
  }

  private isApiErrorShape(value: unknown): value is ApiErrorShape {
    return typeof value === 'object' && value !== null && 'error' in value;
  }

  private isNotFoundError(error: unknown): boolean {
    return error instanceof HttpErrorResponse && error.status === 404;
  }
}
