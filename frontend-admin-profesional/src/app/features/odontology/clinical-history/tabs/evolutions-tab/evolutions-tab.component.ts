import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonButton,
  IonIcon,
  IonSpinner,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonSegment,
  IonSegmentButton,
  AlertController,
  ToastController,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  printOutline,
  checkmarkCircleOutline,
  banOutline,
  createOutline,
  personOutline,
  calendarOutline,
  documentTextOutline
} from 'ionicons/icons';
import { Evolution } from '../../../../../models/odontology.model';
import { ClinicalHistoryService } from '../../../../../core/services/clinical-history.service';
import { SignatureModalComponent } from '../../../../../shared/components/signature-pad/signature-modal.component';

@Component({
  selector: 'app-evolutions-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonCard,
    IonCardHeader,
    IonCardContent,
    IonButton,
    IonIcon,
    IonSpinner,
    IonItem,
    IonLabel,
    IonCheckbox,
    IonSegment,
    IonSegmentButton
  ],
  template: `
    <div class="evolutions-container">
      <!-- Header -->
      <div class="header-row">
        <h2 class="section-title">Evoluciones</h2>
        <div class="header-actions">
          <ion-button aria-label="Imprimir" fill="clear" (click)="print()">
            <ion-icon slot="icon-only" name="print-outline"></ion-icon>
          </ion-button>
          <ion-item lines="none" class="checkbox-item">
            <ion-checkbox [(ngModel)]="showAnnulled"></ion-checkbox>
            <ion-label>Mostrar anuladas</ion-label>
          </ion-item>
          <ion-button color="success" (click)="createEvolution()">
            <ion-icon slot="start" name="add-outline"></ion-icon>
            Nueva evolución
          </ion-button>
        </div>
      </div>

      <!-- Filter Tabs -->
      <ion-segment [(ngModel)]="filterMode" class="filter-segment">
        <ion-segment-button value="all">
          <ion-label>Todas las evoluciones</ion-label>
        </ion-segment-button>
        <ion-segment-button value="mine">
          <ion-label>Solo mis evoluciones</ion-label>
        </ion-segment-button>
      </ion-segment>

      <!-- Evolutions List -->
      @if (loading) {
        <div class="ion-text-center ion-padding">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Cargando evoluciones...</p>
        </div>
      } @else if (evolutions.length === 0) {
        <div class="empty-state">
          <ion-icon name="document-text-outline"></ion-icon>
          <p>No hay evoluciones registradas</p>
        </div>
      } @else {
        @for (evolution of evolutions; track evolution.id) {
          <ion-card class="evolution-card" [class.annulled]="evolution.status === 'annulled'">
            <ion-card-header>
              <div class="evolution-header">
                <div class="professional-info">
                  <ion-icon name="person-outline" color="primary"></ion-icon>
                  <span class="professional-name">
                    {{ evolution.professional?.first_name }} {{ evolution.professional?.last_name }}
                    (#{{ evolution.id }})
                  </span>
                  <span class="evolution-location">
                    (a través de {{ evolution.professional?.first_name }} {{ evolution.professional?.last_name }})
                  </span>
                </div>
                <div class="evolution-date">
                  <ion-icon name="calendar-outline"></ion-icon>
                  Escrita el {{ evolution.created_at | date:'d MMM yyyy HH:mm' }}
                </div>
              </div>
            </ion-card-header>
            <ion-card-content>
              <!-- Treatment Plan Reference -->
              @if (evolution.treatment_plan) {
                <div class="treatment-plan">
                  <strong>Plan de tratamiento #{{ evolution.treatment_plan.id }}:</strong>
                </div>
              }

              <!-- Action Performed -->
              <div class="action-performed">
                <span class="action-label">Acción realizada:</span>
                <span class="action-value">{{ evolution.action_performed }}</span>
              </div>

              <!-- Notes -->
              @if (evolution.notes) {
                <div class="evolution-notes">
                  <em>{{ evolution.notes }}</em>
                </div>
              }

              <!-- Signatures Section -->
              <div class="signatures-section">
                <h4>Firmas</h4>
                <div class="signatures-grid">
                  <!-- Professional Signature -->
                  <div class="signature-box" [class.signed]="evolution.professional_signature"
                       (click)="!evolution.professional_signature && evolution.status !== 'annulled' ? openSignatureModal(evolution, 'professional') : null">
                    @if (evolution.professional_signature) {
                      <img [src]="evolution.professional_signature" alt="Firma profesional" class="signature-image">
                      <div class="signature-info">
                        <ion-icon name="checkmark-circle-outline" color="success"></ion-icon>
                        <span>Profesional: {{ evolution.professional?.first_name }} {{ evolution.professional?.last_name }}</span>
                      </div>
                    } @else {
                      <div class="signature-placeholder clickable">
                        <ion-icon name="create-outline" color="primary"></ion-icon>
                        <span>Firmar como profesional</span>
                      </div>
                    }
                  </div>

                  <!-- Patient Signature -->
                  <div class="signature-box" [class.signed]="evolution.patient_signature"
                       (click)="!evolution.patient_signature && evolution.status !== 'annulled' ? openSignatureModal(evolution, 'patient') : null">
                    @if (evolution.patient_signature) {
                      <img [src]="evolution.patient_signature" alt="Firma paciente" class="signature-image">
                      <div class="signature-info">
                        <ion-icon name="checkmark-circle-outline" color="success"></ion-icon>
                        <span>Paciente: {{ evolution.patient?.first_name }} {{ evolution.patient?.last_name }}</span>
                      </div>
                    } @else {
                      <div class="signature-placeholder clickable">
                        <ion-icon name="create-outline" color="primary"></ion-icon>
                        <span>Firmar como paciente</span>
                      </div>
                    }
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="evolution-actions">
                @if (evolution.status !== 'annulled') {
                  @if (!evolution.professional_signature || !evolution.patient_signature) {
                    <ion-button fill="clear" size="small" color="primary" (click)="openSignatureModal(evolution, evolution.professional_signature ? 'patient' : 'professional')">
                      <ion-icon slot="start" name="create-outline"></ion-icon>
                      Firmar
                    </ion-button>
                  }
                  <ion-button fill="clear" size="small" color="danger" (click)="annulEvolution(evolution)">
                    <ion-icon slot="start" name="ban-outline"></ion-icon>
                    Anular
                  </ion-button>
                }
              </div>
            </ion-card-content>
          </ion-card>
        }
      }
    </div>
  `,
  styles: [`
    .evolutions-container {
      padding: 16px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      gap: 16px;
    }

    .section-title {
      font-size: 24px;
      font-weight: 300;
      margin: 0;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .checkbox-item {
      --background: transparent;
      --padding-start: 0;
      font-size: 14px;
    }

    .filter-segment {
      margin-bottom: 24px;
    }

    .evolution-card {
      margin-bottom: 16px;
    }

    .evolution-card.annulled {
      opacity: 0.6;
      border-left: 4px solid var(--ion-color-danger);
    }

    .evolution-header {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .professional-info {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--ion-color-primary);
      font-weight: 500;
    }

    .professional-name {
      font-size: 15px;
    }

    .evolution-location {
      font-size: 13px;
      color: var(--ion-color-medium);
      font-weight: normal;
    }

    .evolution-date {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--ion-color-medium);
    }

    .treatment-plan {
      background: var(--ion-color-light);
      padding: 8px 12px;
      border-radius: 6px;
      margin-bottom: 12px;
      font-size: 14px;
    }

    .action-performed {
      margin-bottom: 12px;
    }

    .action-label {
      font-size: 13px;
      color: var(--ion-color-medium);
    }

    .action-value {
      display: block;
      font-size: 15px;
      margin-top: 4px;
    }

    .evolution-notes {
      background: var(--ion-color-light);
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 16px;
      font-size: 14px;
      color: var(--ion-color-medium);
    }

    .signatures-section {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--ion-color-light-shade);
    }

    .signatures-section h4 {
      font-size: 14px;
      font-weight: 500;
      margin: 0 0 12px 0;
    }

    .signatures-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .signature-box {
      border: 2px dashed var(--ion-color-light-shade);
      border-radius: 8px;
      padding: 16px;
      text-align: center;
      min-height: 120px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    .signature-box.signed {
      border-color: var(--ion-color-success);
      border-style: solid;
    }

    .signature-image {
      max-width: 150px;
      max-height: 80px;
      margin-bottom: 8px;
    }

    .signature-info {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--ion-color-success);
    }

    .signature-placeholder {
      color: var(--ion-color-medium);
      font-size: 13px;
    }

    .signature-placeholder.clickable {
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .signature-placeholder.clickable:hover {
      color: var(--ion-color-primary);
    }

    .signature-box:not(.signed) {
      cursor: pointer;
      transition: border-color 0.2s, background-color 0.2s;
    }

    .signature-box:not(.signed):hover {
      border-color: var(--ion-color-primary);
      background-color: rgba(var(--ion-color-primary-rgb), 0.05);
    }

    .evolution-actions {
      margin-top: 12px;
      display: flex;
      justify-content: flex-end;
    }

    .empty-state {
      text-align: center;
      padding: 48px 16px;
      color: var(--ion-color-medium);
    }

    .empty-state ion-icon {
      font-size: 64px;
      margin-bottom: 16px;
    }

    @media (max-width: 768px) {
      .header-row {
        flex-direction: column;
        align-items: flex-start;
      }

      .header-actions {
        width: 100%;
        flex-wrap: wrap;
      }
    }
  `]
})
export class EvolutionsTabComponent implements OnInit, OnChanges {
  @Input() patientId!: number;

  private clinicalHistoryService = inject(ClinicalHistoryService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private modalController = inject(ModalController);

  loading = false;
  evolutions: Evolution[] = [];
  filterMode = 'all';
  showAnnulled = false;

  constructor() {
    addIcons({
      addOutline,
      printOutline,
      checkmarkCircleOutline,
      banOutline,
      createOutline,
      personOutline,
      calendarOutline,
      documentTextOutline
    });
  }

  ngOnInit(): void {
    this.loadEvolutions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patientId'] && !changes['patientId'].firstChange) {
      this.loadEvolutions();
    }
  }

  loadEvolutions(): void {
    if (!this.patientId) return;

    this.loading = true;
    this.clinicalHistoryService.getEvolutions(this.patientId, this.showAnnulled).subscribe({
      next: (evolutions) => {
        this.evolutions = evolutions;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading evolutions:', error);
        this.loading = false;
        this.showToast('Error al cargar evoluciones', 'danger');
      }
    });
  }

  async createEvolution(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Nueva Evolución',
      inputs: [
        {
          name: 'action_performed',
          type: 'text',
          placeholder: 'Acción realizada'
        },
        {
          name: 'notes',
          type: 'textarea',
          placeholder: 'Notas adicionales'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (data) => {
            if (data.action_performed) {
              this.clinicalHistoryService.createEvolution({
                patient_id: this.patientId,
                action_performed: data.action_performed,
                notes: data.notes
              }).subscribe({
                next: () => {
                  this.showToast('Evolución creada exitosamente', 'success');
                  this.loadEvolutions();
                },
                error: (error) => {
                  console.error('Error creating evolution:', error);
                  this.showToast('Error al crear evolución', 'danger');
                }
              });
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async annulEvolution(evolution: Evolution): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirmar Anulación',
      message: `¿Está seguro de anular la evolución #${evolution.id}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Anular',
          cssClass: 'danger',
          handler: () => {
            this.clinicalHistoryService.annulEvolution(evolution.id!).subscribe({
              next: () => {
                this.showToast('Evolución anulada', 'warning');
                this.loadEvolutions();
              },
              error: (error) => {
                console.error('Error annulling evolution:', error);
                this.showToast('Error al anular evolución', 'danger');
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  toggleShowAnnulled(): void {
    this.loadEvolutions();
  }

  print(): void {
    window.print();
  }

  async openSignatureModal(evolution: Evolution, signatureType: 'professional' | 'patient'): Promise<void> {
    const signerName = signatureType === 'professional'
      ? `${evolution.professional?.first_name || ''} ${evolution.professional?.last_name || ''}`
      : `${evolution.patient?.first_name || ''} ${evolution.patient?.last_name || ''}`;

    const modal = await this.modalController.create({
      component: SignatureModalComponent,
      componentProps: {
        modalTitle: signatureType === 'professional' ? 'Firma del Profesional' : 'Firma del Paciente',
        signatureTitle: `Firma de ${signerName}`,
        signatureSubtitle: `Evolución #${evolution.id} - ${evolution.action_performed}`,
        saveButtonText: 'Confirmar Firma'
      }
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data) {
      this.saveSignature(evolution, signatureType, data);
    }
  }

  private saveSignature(evolution: Evolution, signatureType: 'professional' | 'patient', signatureData: string): void {
    this.clinicalHistoryService.signEvolution(evolution.id!, signatureType, signatureData).subscribe({
      next: () => {
        this.showToast(
          signatureType === 'professional' ? 'Firma del profesional guardada' : 'Firma del paciente guardada',
          'success'
        );
        this.loadEvolutions();
      },
      error: (error) => {
        console.error('Error saving signature:', error);
        this.showToast('Error al guardar la firma', 'danger');
      }
    });
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
