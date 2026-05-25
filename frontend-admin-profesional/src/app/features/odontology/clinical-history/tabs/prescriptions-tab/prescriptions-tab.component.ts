import { Component, Input, OnInit, OnChanges, SimpleChanges, inject, SecurityContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import {
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonCheckbox,
  IonSpinner,
  IonTextarea,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, printOutline, documentOutline } from 'ionicons/icons';
import { Prescription } from '../../../../../models/odontology.model';
import { ClinicalHistoryService } from '../../../../../core/services/clinical-history.service';

@Component({
  selector: 'app-prescriptions-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonCard,
    IonCardHeader,
    IonCardContent,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonCheckbox,
    IonSpinner,
    IonTextarea
  ],
  template: `
    <div class="prescriptions-container">
      <!-- Header -->
      <div class="header-row">
        <h2 class="section-title">Recetas</h2>
        <div class="header-actions">
          <ion-item lines="none" class="filter-item">
            <ion-label>Filtrar por tratamiento</ion-label>
            <ion-select [(ngModel)]="filterTreatment" interface="popover">
              <ion-select-option value="all">Todos</ion-select-option>
            </ion-select>
          </ion-item>
          <ion-item lines="none" class="checkbox-item">
            <ion-checkbox [(ngModel)]="showAnnulled"></ion-checkbox>
            <ion-label>Mostrar anuladas</ion-label>
          </ion-item>
        </div>
      </div>

      <div class="prescription-layout">
        <!-- Editor -->
        <ion-card class="editor-card">
          <ion-card-content>
            <div class="editor-toolbar">
              <ion-button fill="clear" size="small"><strong>B</strong></ion-button>
              <ion-button fill="clear" size="small"><em>I</em></ion-button>
              <ion-button fill="clear" size="small"><u>U</u></ion-button>
              <ion-button fill="clear" size="small">
                <ion-icon name="list-outline"></ion-icon>
              </ion-button>
              <ion-button fill="clear" size="small">
                <ion-icon name="expand-outline"></ion-icon>
              </ion-button>
            </div>
            <ion-textarea
              [(ngModel)]="newPrescription"
              placeholder="Escriba la receta aquí..."
              rows="10"
              class="prescription-editor">
            </ion-textarea>
            <div class="editor-actions">
              <ion-button fill="clear" size="small">
                Usar plantilla
              </ion-button>
              <ion-button color="success" (click)="createPrescription()">
                <ion-icon slot="start" name="add-outline"></ion-icon>
                Crear receta
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Prescriptions List -->
        <div class="prescriptions-list">
          @if (loading) {
            <div class="ion-text-center ion-padding">
              <ion-spinner name="crescent"></ion-spinner>
              <p>Cargando recetas...</p>
            </div>
          } @else if (prescriptions.length === 0) {
            <div class="empty-state">
              <ion-icon name="document-outline"></ion-icon>
              <p>Este tratamiento no tiene recetas</p>
            </div>
          } @else {
            @for (prescription of prescriptions; track prescription.id) {
              <ion-card class="prescription-card" [class.annulled]="prescription.status === 'annulled'">
                <ion-card-header>
                  <div class="prescription-header">
                    <span class="prescription-date">
                      {{ prescription.prescription_date | date:'dd/MM/yyyy HH:mm' }}
                    </span>
                    <ion-button fill="clear" size="small" (click)="print(prescription)">
                      <ion-icon slot="icon-only" name="print-outline"></ion-icon>
                    </ion-button>
                  </div>
                </ion-card-header>
                <ion-card-content>
                  <div class="prescription-content" [innerHTML]="prescription.content"></div>
                  @if (prescription.professional) {
                    <div class="prescription-professional">
                      Dr.(a) {{ prescription.professional.first_name }} {{ prescription.professional.last_name }}
                      @if (prescription.professional.license_number) {
                        - Mat. {{ prescription.professional.license_number }}
                      }
                    </div>
                  }
                </ion-card-content>
              </ion-card>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .prescriptions-container {
      padding: 16px;
      max-width: 1400px;
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

    .header-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .filter-item, .checkbox-item {
      --background: transparent;
      --padding-start: 0;
      font-size: 14px;
    }

    .prescription-layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
    }

    .editor-card {
      margin: 0;
    }

    .editor-toolbar {
      display: flex;
      gap: 4px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--ion-color-light-shade);
      margin-bottom: 8px;
    }

    .prescription-editor {
      --background: var(--ion-color-light);
      --padding-start: 12px;
      --padding-end: 12px;
      border-radius: 8px;
      min-height: 200px;
    }

    .editor-actions {
      display: flex;
      justify-content: space-between;
      margin-top: 16px;
    }

    .prescriptions-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .prescription-card {
      margin: 0;
    }

    .prescription-card.annulled {
      opacity: 0.6;
      border-left: 4px solid var(--ion-color-danger);
    }

    .prescription-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .prescription-date {
      font-size: 14px;
      color: var(--ion-color-medium);
    }

    .prescription-content {
      font-size: 14px;
      line-height: 1.6;
      white-space: pre-wrap;
    }

    .prescription-professional {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--ion-color-light-shade);
      font-size: 13px;
      color: var(--ion-color-primary);
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

    @media (min-width: 992px) {
      .prescription-layout {
        grid-template-columns: 1fr 1fr;
      }
    }
  `]
})
export class PrescriptionsTabComponent implements OnInit, OnChanges {
  @Input() patientId!: number;

  private clinicalHistoryService = inject(ClinicalHistoryService);
  private toastController = inject(ToastController);
  private sanitizer = inject(DomSanitizer);

  loading = false;
  creating = false;
  prescriptions: Prescription[] = [];
  newPrescription = '';
  filterTreatment = 'all';
  showAnnulled = false;

  constructor() {
    addIcons({ addOutline, printOutline, documentOutline });
  }

  ngOnInit(): void {
    this.loadPrescriptions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patientId'] && !changes['patientId'].firstChange) {
      this.loadPrescriptions();
    }
  }

  loadPrescriptions(): void {
    if (!this.patientId) return;

    this.loading = true;
    this.clinicalHistoryService.getPrescriptions(this.patientId, undefined, this.showAnnulled).subscribe({
      next: (prescriptions) => {
        this.prescriptions = prescriptions;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading prescriptions:', error);
        this.loading = false;
        this.showToast('Error al cargar recetas', 'danger');
      }
    });
  }

  createPrescription(): void {
    if (!this.newPrescription.trim()) {
      this.showToast('Ingrese el contenido de la receta', 'warning');
      return;
    }

    this.creating = true;
    this.clinicalHistoryService.createPrescription({
      patient_id: this.patientId,
      content: this.newPrescription
    }).subscribe({
      next: () => {
        this.newPrescription = '';
        this.creating = false;
        this.showToast('Receta creada exitosamente', 'success');
        this.loadPrescriptions();
      },
      error: (error) => {
        console.error('Error creating prescription:', error);
        this.creating = false;
        this.showToast('Error al crear receta', 'danger');
      }
    });
  }

  print(prescription: Prescription): void {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const safeContent = this.sanitizer.sanitize(SecurityContext.HTML, prescription.content) || '';
      printWindow.document.write(`
        <html>
          <head><title>Receta - ${prescription.prescription_date}</title></head>
          <body>
            <h1>Receta Médica</h1>
            <p><strong>Fecha:</strong> ${new Date(prescription.prescription_date!).toLocaleDateString()}</p>
            <div>${safeContent}</div>
            ${prescription.professional ? `<p><strong>Dr.(a)</strong> ${prescription.professional.first_name} ${prescription.professional.last_name}</p>` : ''}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }

  toggleShowAnnulled(): void {
    this.loadPrescriptions();
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
