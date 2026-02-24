import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  ClinicalHistoryEvent,
  ClinicalSummary,
  InformedConsentItem,
  PatientApiService,
  PatientDocumentItem
} from '../core/services/patient-api.service';
import { pageShellStyles } from './page-shell.styles';

type SegmentView = 'summary' | 'timeline' | 'documents' | 'consents';

type ApiErrorShape = {
  error?: {
    msg?: string;
    message?: string;
    error?: string;
  };
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
        <p class="panel-text">Consulta resumen clinico, eventos, documentos y consentimientos.</p>
      </section>

      <ion-segment [value]="activeView" (ionChange)="onViewChange($event)">
        <ion-segment-button value="summary">Resumen</ion-segment-button>
        <ion-segment-button value="timeline">Timeline</ion-segment-button>
        <ion-segment-button value="documents">Documentos</ion-segment-button>
        <ion-segment-button value="consents">Consentimientos</ion-segment-button>
      </ion-segment>

      <ion-refresher slot="fixed" (ionRefresh)="refresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      @if (errorMessage) {
        <div class="error-box" role="alert">{{ errorMessage }}</div>
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
    </ion-content>
  `,
  styles: [
    pageShellStyles,
    `
      ion-segment {
        margin: 12px;
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
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 10px;
      }

      .summary-grid strong {
        color: #0f172a;
        font-size: 1.05rem;
      }

      .summary-grid span {
        color: #475569;
        font-size: 0.75rem;
      }

      .sub-title {
        color: #334155;
        font-size: 0.85rem;
        font-weight: 700;
        margin: 12px 0 6px;
      }

      .simple-list {
        color: #1e293b;
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

  activeView: SegmentView = 'summary';
  loading = false;
  errorMessage: string | null = null;

  summary: ClinicalSummary | null = null;
  timeline: ClinicalHistoryEvent[] = [];
  documents: PatientDocumentItem[] = [];
  consents: InformedConsentItem[] = [];

  processingConsentIds = new Set<number>();

  ngOnInit(): void {
    this.loadHistory();
  }

  onViewChange(event: CustomEvent): void {
    const nextValue = event.detail.value as SegmentView;
    if (nextValue) {
      this.activeView = nextValue;
    }
  }

  refresh(event: CustomEvent): void {
    this.loadHistory(() => event.detail.complete());
  }

  signConsent(consent: InformedConsentItem): void {
    const defaultSignature = `signed-by-patient-${new Date().toISOString()}`;
    const signature = window.prompt('Ingresa tu firma para aprobar este consentimiento', defaultSignature);

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

  rejectConsent(consent: InformedConsentItem): void {
    const reason = window.prompt('Ingresa el motivo de rechazo (opcional)') ?? undefined;

    this.processingConsentIds.add(consent.id);
    this.errorMessage = null;

    this.patientApi.rejectConsent(consent.id, reason).subscribe({
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

    forkJoin({
      summary: this.patientApi.getMyClinicalSummary().pipe(catchError(() => of(null))),
      timeline: this.patientApi.getMyClinicalTimeline().pipe(catchError(() => of([] as ClinicalHistoryEvent[]))),
      documents: this.patientApi.getMyClinicalDocuments().pipe(catchError(() => of([] as PatientDocumentItem[]))),
      consents: this.patientApi.getMyConsents().pipe(catchError(() => of([] as InformedConsentItem[])))
    }).subscribe({
      next: ({ summary, timeline, documents, consents }) => {
        this.summary = summary;
        this.timeline = timeline;
        this.documents = documents;
        this.consents = consents;
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
}
