import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonSpinner,
  IonText,
  IonChip,
  AlertController,
  IonNote
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  createOutline,
  trashOutline,
  documentTextOutline,
  personOutline,
  calendarOutline,
  heartOutline,
  thermometerOutline,
  fitnessOutline,
  medkitOutline,
  documentAttachOutline,
  cloudUploadOutline,
  downloadOutline
} from 'ionicons/icons';
import * as MedicalRecordsActions from '../../../store/medical-records/medical-records.actions';
import {
  selectSelectedMedicalRecord,
  selectMedicalRecordsLoading,
  selectMedicalRecordsError,
  selectMedicalRecordsUploading
} from '../../../store/medical-records/medical-records.selectors';
import { FilesApiService } from '../../../core/services';

@Component({
  selector: 'app-medical-record-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonSpinner,
    IonText,
    IonChip,
    IonNote
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/medical-records"></ion-back-button>
        </ion-buttons>
        <ion-title>Detalle de Historial</ion-title>
        <ion-buttons slot="end">
          @if (record$ | async; as record) {
            <!-- Mobile: solo iconos -->
            <ion-button [routerLink]="['/medical-records', record.id, 'edit']" class="hide-desktop">
              <ion-icon slot="icon-only" name="create-outline"></ion-icon>
            </ion-button>
            <ion-button color="danger" (click)="confirmDelete(record.id)" class="hide-desktop">
              <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
            </ion-button>
            <!-- Desktop: con texto -->
            <ion-button [routerLink]="['/medical-records', record.id, 'edit']" fill="outline" class="hide-mobile">
              <ion-icon slot="start" name="create-outline"></ion-icon>
              Editar
            </ion-button>
            <ion-button color="danger" fill="outline" (click)="confirmDelete(record.id)" class="hide-mobile">
              <ion-icon slot="start" name="trash-outline"></ion-icon>
              Eliminar
            </ion-button>
          }
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (loading$ | async) {
        <div class="ion-text-center ion-padding">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Cargando historial...</p>
        </div>
      } @else if (error$ | async; as error) {
        <ion-text color="danger">
          <p>{{ error }}</p>
        </ion-text>
      } @else if (record$ | async; as record) {
        <div class="desktop-layout">
          <!-- Left Column -->
          <div class="column-main">
            <!-- Header Card with Patient & Date -->
            <ion-card>
              <ion-card-header>
                <ion-card-title>
                  <ion-icon name="document-text-outline"></ion-icon>
                  Consulta del {{ record.record_date | date:'dd/MM/yyyy HH:mm' }}
                </ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <div class="info-grid">
                  <div class="info-item">
                    <ion-icon name="person-outline" color="primary"></ion-icon>
                    <div class="info-content">
                      <span class="info-label">Paciente</span>
                      <span class="info-value">
                        @if (record.patient) {
                          {{ record.patient.first_name }} {{ record.patient.last_name }}
                        } @else {
                          Paciente #{{ record.patient_id }}
                        }
                      </span>
                    </div>
                  </div>
                  @if (record.professional) {
                    <div class="info-item">
                      <ion-icon name="medkit-outline" color="tertiary"></ion-icon>
                      <div class="info-content">
                        <span class="info-label">Profesional</span>
                        <span class="info-value">{{ record.professional.first_name }} {{ record.professional.last_name }}</span>
                        <span class="info-sub">{{ record.professional.specialty }}</span>
                      </div>
                    </div>
                  }
                </div>
              </ion-card-content>
            </ion-card>

            <!-- Clinical Information -->
            <ion-card>
              <ion-card-header>
                <ion-card-title>Información Clínica</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <div class="clinical-grid">
                  @if (record.chief_complaint) {
                    <div class="clinical-item">
                      <span class="clinical-label">Motivo de Consulta</span>
                      <span class="clinical-value">{{ record.chief_complaint }}</span>
                    </div>
                  }
                  @if (record.symptoms) {
                    <div class="clinical-item">
                      <span class="clinical-label">Síntomas</span>
                      <span class="clinical-value">{{ record.symptoms }}</span>
                    </div>
                  }
                  @if (record.diagnosis) {
                    <div class="clinical-item">
                      <span class="clinical-label">Diagnóstico</span>
                      <ion-chip color="tertiary">{{ record.diagnosis }}</ion-chip>
                    </div>
                  }
                  @if (record.treatment) {
                    <div class="clinical-item full-width">
                      <span class="clinical-label">Tratamiento</span>
                      <span class="clinical-value">{{ record.treatment }}</span>
                    </div>
                  }
                  @if (record.prescriptions) {
                    <div class="clinical-item full-width">
                      <span class="clinical-label">Prescripciones</span>
                      <span class="clinical-value">{{ record.prescriptions }}</span>
                    </div>
                  }
                  @if (record.notes) {
                    <div class="clinical-item full-width">
                      <span class="clinical-label">Notas</span>
                      <span class="clinical-value">{{ record.notes }}</span>
                    </div>
                  }
                </div>
              </ion-card-content>
            </ion-card>
          </div>

          <!-- Right Column -->
          <div class="column-side">
            <!-- Vital Signs -->
            @if (record.blood_pressure || record.heart_rate || record.temperature || record.weight || record.height) {
              <ion-card>
                <ion-card-header>
                  <ion-card-title>
                    <ion-icon name="fitness-outline"></ion-icon>
                    Signos Vitales
                  </ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <div class="vitals-grid">
                    @if (record.blood_pressure) {
                      <div class="vital-item">
                        <ion-icon name="heart-outline" color="danger"></ion-icon>
                        <span class="vital-value">{{ record.blood_pressure }}</span>
                        <span class="vital-label">Presión</span>
                      </div>
                    }
                    @if (record.heart_rate) {
                      <div class="vital-item">
                        <ion-icon name="heart-outline" color="primary"></ion-icon>
                        <span class="vital-value">{{ record.heart_rate }} bpm</span>
                        <span class="vital-label">Pulso</span>
                      </div>
                    }
                    @if (record.temperature) {
                      <div class="vital-item">
                        <ion-icon name="thermometer-outline" color="warning"></ion-icon>
                        <span class="vital-value">{{ record.temperature }}°C</span>
                        <span class="vital-label">Temperatura</span>
                      </div>
                    }
                    @if (record.weight) {
                      <div class="vital-item">
                        <ion-icon name="fitness-outline" color="tertiary"></ion-icon>
                        <span class="vital-value">{{ record.weight }} kg</span>
                        <span class="vital-label">Peso</span>
                      </div>
                    }
                    @if (record.height) {
                      <div class="vital-item">
                        <ion-icon name="fitness-outline" color="success"></ion-icon>
                        <span class="vital-value">{{ record.height }} cm</span>
                        <span class="vital-label">Altura</span>
                      </div>
                    }
                  </div>
                </ion-card-content>
              </ion-card>
            }

            <!-- Files Section -->
            <ion-card>
              <ion-card-header>
                <ion-card-title>
                  <ion-icon name="document-attach-outline"></ion-icon>
                  Archivos Adjuntos
                </ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <div class="upload-section">
                  <input
                    type="file"
                    #fileInput
                    (change)="onFileSelected($event, record.id)"
                    accept=".pdf,.png,.jpg,.jpeg,.gif,.doc,.docx"
                    style="display: none;"
                  />
                  <ion-button fill="outline" size="small" (click)="fileInput.click()" [disabled]="uploading$ | async">
                    @if (uploading$ | async) {
                      <ion-spinner name="crescent" slot="start"></ion-spinner>
                      Subiendo...
                    } @else {
                      <ion-icon slot="start" name="cloud-upload-outline"></ion-icon>
                      Subir Archivo
                    }
                  </ion-button>
                </div>

                @if (record.files && record.files.length > 0) {
                  <ion-list lines="none" class="files-list">
                    @for (file of record.files; track file.id) {
                      <ion-item>
                        <ion-icon name="document-attach-outline" slot="start" color="medium"></ion-icon>
                        <ion-label>
                          <h3>{{ file.filename }}</h3>
                          <p>{{ file.file_type || 'Archivo' }} - {{ formatFileSize(file.file_size) }}</p>
                          <p>{{ file.created_at | date:'dd/MM/yyyy HH:mm' }}</p>
                        </ion-label>
                        <ion-button fill="clear" size="small" slot="end" (click)="downloadFile(file.id, file.filename)">
                          <ion-icon name="download-outline"></ion-icon>
                        </ion-button>
                        <ion-button fill="clear" size="small" color="danger" slot="end" (click)="confirmDeleteFile(file.id, file.filename)">
                          <ion-icon name="trash-outline"></ion-icon>
                        </ion-button>
                      </ion-item>
                    }
                  </ion-list>
                } @else {
                  <ion-note>No hay archivos adjuntos</ion-note>
                }
              </ion-card-content>
            </ion-card>
          </div>
        </div>
      }
    </ion-content>
  `,
  styles: [`
    ion-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
    }

    /* Desktop Layout */
    .desktop-layout {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .column-main, .column-side {
      width: 100%;
    }

    /* Info Grid */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .info-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .info-item ion-icon {
      font-size: 24px;
      min-width: 24px;
    }

    .info-content {
      display: flex;
      flex-direction: column;
    }

    .info-label {
      font-size: 12px;
      color: var(--ion-color-medium);
    }

    .info-value {
      font-size: 16px;
      font-weight: 500;
      color: var(--ion-text-color);
    }

    .info-sub {
      font-size: 13px;
      color: var(--ion-color-medium);
    }

    /* Clinical Grid */
    .clinical-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .clinical-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .clinical-label {
      font-size: 12px;
      color: var(--ion-color-medium);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .clinical-value {
      font-size: 15px;
      color: var(--ion-text-color);
      white-space: pre-wrap;
    }

    /* Vitals Grid */
    .vitals-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .vital-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 12px 8px;
      background: var(--ion-color-light);
      border-radius: 8px;
    }

    .vital-item ion-icon {
      font-size: 22px;
      margin-bottom: 4px;
    }

    .vital-value {
      font-size: 16px;
      font-weight: bold;
    }

    .vital-label {
      font-size: 11px;
      color: var(--ion-color-medium);
    }

    .upload-section {
      margin-bottom: 16px;
    }

    .files-list ion-item {
      --padding-start: 0;
    }

    .hide-mobile {
      display: none;
    }

    .hide-desktop {
      display: inline-flex;
    }

    /* Tablet and Desktop */
    @media (min-width: 768px) {
      .desktop-layout {
        flex-direction: row;
        gap: 24px;
      }

      .column-main {
        flex: 2;
        min-width: 0;
      }

      .column-side {
        flex: 1;
        min-width: 300px;
        max-width: 400px;
      }

      .info-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .clinical-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .clinical-item.full-width {
        grid-column: 1 / -1;
      }

      .vitals-grid {
        grid-template-columns: repeat(3, 1fr);
      }

      .hide-mobile {
        display: inline-flex;
      }

      .hide-desktop {
        display: none;
      }
    }

    /* Large Desktop */
    @media (min-width: 1200px) {
      .info-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .vitals-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class MedicalRecordDetailPage implements OnInit {
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private alertController = inject(AlertController);
  private filesApi = inject(FilesApiService);

  record$ = this.store.select(selectSelectedMedicalRecord);
  loading$ = this.store.select(selectMedicalRecordsLoading);
  error$ = this.store.select(selectMedicalRecordsError);
  uploading$ = this.store.select(selectMedicalRecordsUploading);

  constructor() {
    addIcons({
      createOutline,
      trashOutline,
      documentTextOutline,
      personOutline,
      calendarOutline,
      heartOutline,
      thermometerOutline,
      fitnessOutline,
      medkitOutline,
      documentAttachOutline,
      cloudUploadOutline,
      downloadOutline
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.store.dispatch(MedicalRecordsActions.loadMedicalRecord({ id: parseInt(id, 10) }));
    }
  }

  async confirmDelete(id: number): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: '¿Está seguro de eliminar este historial médico?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.store.dispatch(MedicalRecordsActions.deleteMedicalRecord({ id }));
          }
        }
      ]
    });
    await alert.present();
  }

  onFileSelected(event: Event, recordId: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.store.dispatch(MedicalRecordsActions.uploadFile({
        medicalRecordId: recordId,
        file,
        fileType: this.getFileType(file.name)
      }));
      input.value = '';
    }
  }

  getFileType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'document';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return 'image';
      case 'doc':
      case 'docx': return 'document';
      default: return 'other';
    }
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  downloadFile(fileId: number, filename: string): void {
    this.filesApi.download(fileId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
      }
    });
  }

  async confirmDeleteFile(fileId: number, filename: string): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Eliminar Archivo',
      message: `¿Está seguro de eliminar "${filename}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.store.dispatch(MedicalRecordsActions.deleteFile({ fileId }));
          }
        }
      ]
    });
    await alert.present();
  }
}
