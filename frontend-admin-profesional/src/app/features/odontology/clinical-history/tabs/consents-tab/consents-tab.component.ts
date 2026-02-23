import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonBadge,
  IonSpinner,
  AlertController,
  ToastController,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, documentOutline, checkmarkCircleOutline, closeCircleOutline, eyeOutline, createOutline, timeOutline } from 'ionicons/icons';
import { InformedConsent, CONSENT_TYPES } from '../../../../../models/odontology.model';
import { ClinicalHistoryService } from '../../../../../core/services/clinical-history.service';
import { SignatureModalComponent } from '../../../../../shared/components/signature-pad/signature-modal.component';

@Component({
  selector: 'app-consents-tab',
  standalone: true,
  imports: [
    CommonModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonBadge,
    IonSpinner
  ],
  template: `
    <div class="consents-container">
      <!-- Header -->
      <div class="header-row">
        <h2 class="section-title">Consentimientos Informados</h2>
        <ion-button color="success" (click)="createConsent()">
          <ion-icon slot="start" name="add-outline"></ion-icon>
          Nuevo Consentimiento Informado
        </ion-button>
      </div>

      @if (loading) {
        <div class="ion-text-center ion-padding">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Cargando consentimientos...</p>
        </div>
      } @else if (consents.length === 0) {
        <div class="empty-state">
          <ion-icon name="document-outline"></ion-icon>
          <p>Este paciente no cuenta con ningún consentimiento informado creado en la plataforma.</p>
        </div>
      } @else {
        <div class="consents-grid">
          @for (consent of consents; track consent.id) {
            <ion-card class="consent-card" [class]="consent.status">
              <ion-card-header>
                <div class="consent-header">
                  <ion-card-title>{{ consent.title }}</ion-card-title>
                  <ion-badge [color]="getStatusColor(consent.status)">
                    {{ getStatusLabel(consent.status) }}
                  </ion-badge>
                </div>
              </ion-card-header>
              <ion-card-content>
                <p class="consent-type">{{ getConsentTypeLabel(consent.consent_type) }}</p>
                <p class="consent-date">Creado: {{ consent.created_at | date:'dd/MM/yyyy HH:mm' }}</p>

                @if (consent.patient_signed_at) {
                  <div class="signature-info signed">
                    <ion-icon name="checkmark-circle-outline"></ion-icon>
                    <span>Firmado por el paciente: {{ consent.patient_signed_at | date:'dd/MM/yyyy HH:mm' }}</span>
                  </div>
                } @else if (consent.status === 'pending') {
                  <div class="signature-info pending">
                    <ion-icon name="time-outline"></ion-icon>
                    <span>Pendiente de firma del paciente</span>
                  </div>
                }

                @if (consent.status === 'rejected' && consent.rejected_reason) {
                  <div class="rejection-reason">
                    <strong>Motivo de rechazo:</strong> {{ consent.rejected_reason }}
                  </div>
                }

                <div class="consent-actions">
                  <ion-button fill="clear" size="small" (click)="view(consent)">
                    <ion-icon slot="icon-only" name="eye-outline"></ion-icon>
                  </ion-button>
                  @if (consent.status === 'pending') {
                    <ion-button fill="clear" size="small" (click)="requestSignature(consent)">
                      <ion-icon slot="icon-only" name="create-outline"></ion-icon>
                    </ion-button>
                  }
                </div>
              </ion-card-content>
            </ion-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .consents-container {
      padding: 16px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header-row {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      gap: 16px;
    }

    .section-title {
      font-size: 24px;
      font-weight: 300;
      margin: 0;
    }

    .consents-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }

    .consent-card {
      margin: 0;
    }

    .consent-card.signed {
      border-left: 4px solid var(--ion-color-success);
    }

    .consent-card.pending {
      border-left: 4px solid var(--ion-color-warning);
    }

    .consent-card.rejected {
      border-left: 4px solid var(--ion-color-danger);
    }

    .consent-card.annulled {
      opacity: 0.6;
      border-left: 4px solid var(--ion-color-medium);
    }

    .consent-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }

    ion-card-title {
      font-size: 16px;
    }

    .consent-type {
      font-size: 13px;
      color: var(--ion-color-primary);
      margin: 0 0 8px 0;
    }

    .consent-date {
      font-size: 12px;
      color: var(--ion-color-medium);
      margin: 0 0 12px 0;
    }

    .signature-info {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      padding: 8px 12px;
      border-radius: 6px;
      margin-bottom: 12px;
    }

    .signature-info.signed {
      background: rgba(var(--ion-color-success-rgb), 0.1);
      color: var(--ion-color-success);
    }

    .signature-info.pending {
      background: rgba(var(--ion-color-warning-rgb), 0.1);
      color: var(--ion-color-warning-shade);
    }

    .rejection-reason {
      font-size: 13px;
      padding: 12px;
      background: rgba(var(--ion-color-danger-rgb), 0.1);
      border-radius: 6px;
      color: var(--ion-color-danger);
      margin-bottom: 12px;
    }

    .consent-actions {
      display: flex;
      justify-content: flex-end;
      gap: 4px;
    }

    .empty-state {
      text-align: center;
      padding: 64px 16px;
      color: var(--ion-color-medium);
    }

    .empty-state ion-icon {
      font-size: 64px;
      margin-bottom: 16px;
    }

    .empty-state p {
      max-width: 400px;
      margin: 0 auto;
    }
  `]
})
export class ConsentsTabComponent implements OnInit, OnChanges {
  @Input() patientId!: number;

  private clinicalHistoryService = inject(ClinicalHistoryService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private modalController = inject(ModalController);

  loading = false;
  consents: InformedConsent[] = [];
  consentTypes = CONSENT_TYPES;

  constructor() {
    addIcons({
      addOutline,
      documentOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      eyeOutline,
      createOutline,
      timeOutline
    });
  }

  ngOnInit(): void {
    this.loadConsents();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patientId'] && !changes['patientId'].firstChange) {
      this.loadConsents();
    }
  }

  loadConsents(): void {
    if (!this.patientId) return;

    this.loading = true;
    this.clinicalHistoryService.getConsents(this.patientId).subscribe({
      next: (consents) => {
        this.consents = consents;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading consents:', error);
        this.loading = false;
        this.showToast('Error al cargar consentimientos', 'danger');
      }
    });
  }

  getConsentTypeLabel(type: string): string {
    const found = this.consentTypes.find(t => t.value === type);
    return found ? found.label : type;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'signed': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'danger';
      case 'annulled': return 'medium';
      default: return 'medium';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'signed': return 'Firmado';
      case 'pending': return 'Pendiente';
      case 'rejected': return 'Rechazado';
      case 'annulled': return 'Anulado';
      default: return status;
    }
  }

  async createConsent(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Nuevo Consentimiento Informado',
      inputs: [
        {
          name: 'title',
          type: 'text',
          placeholder: 'Título del consentimiento'
        },
        {
          name: 'consent_type',
          type: 'text',
          placeholder: 'Tipo (general, extraction, implant, etc.)'
        },
        {
          name: 'content',
          type: 'textarea',
          placeholder: 'Contenido del consentimiento'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Crear',
          handler: (data) => {
            if (data.title && data.content) {
              this.clinicalHistoryService.createConsent({
                patient_id: this.patientId,
                title: data.title,
                consent_type: data.consent_type || 'general',
                content: data.content
              }).subscribe({
                next: () => {
                  this.showToast('Consentimiento creado exitosamente', 'success');
                  this.loadConsents();
                },
                error: (error) => {
                  console.error('Error creating consent:', error);
                  this.showToast('Error al crear consentimiento', 'danger');
                }
              });
            }
          }
        }
      ]
    });
    await alert.present();
  }

  view(consent: InformedConsent): void {
    this.alertController.create({
      header: consent.title,
      message: consent.content,
      buttons: ['Cerrar']
    }).then(alert => alert.present());
  }

  async requestSignature(consent: InformedConsent): Promise<void> {
    const modal = await this.modalController.create({
      component: SignatureModalComponent,
      componentProps: {
        modalTitle: 'Firma del Consentimiento',
        signatureTitle: 'Firma del Paciente',
        signatureSubtitle: consent.title,
        saveButtonText: 'Firmar Consentimiento'
      }
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data) {
      this.clinicalHistoryService.signConsent(consent.id!, data).subscribe({
        next: () => {
          this.showToast('Consentimiento firmado exitosamente', 'success');
          this.loadConsents();
        },
        error: (error) => {
          console.error('Error signing consent:', error);
          this.showToast('Error al firmar consentimiento', 'danger');
        }
      });
    }
  }

  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}
