import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonSpinner,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cloudUploadOutline, documentOutline, imageOutline, trashOutline, downloadOutline, helpCircleOutline } from 'ionicons/icons';
import { PatientDocument } from '../../../../../models/odontology.model';
import { ClinicalHistoryService } from '../../../../../core/services/clinical-history.service';

@Component({
  selector: 'app-documents-tab',
  standalone: true,
  imports: [
    CommonModule,
    IonCard,
    IonCardContent,
    IonButton,
    IonIcon,
    IonSpinner
  ],
  template: `
    <div class="documents-container">
      <!-- Header -->
      <div class="header-row">
        <h2 class="section-title">Rx y Documentos</h2>
        <div class="header-actions">
          <ion-button color="success" (click)="fileInput.click()">
            <ion-icon slot="start" name="cloud-upload-outline"></ion-icon>
            Subir archivos
          </ion-button>
          <ion-button aria-label="Ayuda" fill="clear">
            <ion-icon slot="icon-only" name="help-circle-outline"></ion-icon>
          </ion-button>
        </div>
        <input type="file" #fileInput (change)="onFileSelected($event)" multiple accept="image/*,.pdf" style="display: none;">
      </div>

      @if (loading) {
        <div class="ion-text-center ion-padding">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Cargando documentos...</p>
        </div>
      } @else if (documents.length === 0) {
        <!-- Empty State with Drop Zone -->
        <div class="drop-zone"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
          [class.dragover]="isDragOver">
          <ion-icon name="cloud-upload-outline"></ion-icon>
          <p>Este paciente aún no cuenta con documentos, arrástrelos aquí para comenzar</p>
          <ion-button fill="outline" (click)="fileInput.click()">
            Seleccionar archivos
          </ion-button>
        </div>
      } @else {
        <!-- Documents Grid -->
        <div class="documents-grid">
          @for (doc of documents; track doc.id) {
            <ion-card class="document-card">
              <div class="document-preview" (click)="download(doc)">
                @if (isImage(doc.mime_type)) {
                  <ion-icon name="image-outline" class="file-icon"></ion-icon>
                  <span class="preview-hint">Click para descargar</span>
                } @else {
                  <ion-icon name="document-outline" class="file-icon"></ion-icon>
                  <span class="preview-hint">Click para descargar</span>
                }
              </div>
              <ion-card-content>
                <div class="document-info">
                  <h4>{{ doc.file_name || doc.title }}</h4>
                  <p>{{ doc.created_at | date:'dd/MM/yyyy' }}</p>
                  <p class="file-size" *ngIf="doc.file_size">{{ formatFileSize(doc.file_size) }}</p>
                  @if (doc.description) {
                    <p class="description">{{ doc.description }}</p>
                  }
                </div>
                <div class="document-actions">
                  <ion-button aria-label="Descargar" fill="clear" size="small" (click)="download(doc)">
                    <ion-icon slot="icon-only" name="download-outline"></ion-icon>
                  </ion-button>
                  <ion-button aria-label="Eliminar" fill="clear" size="small" color="danger" (click)="delete(doc)">
                    <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
                  </ion-button>
                </div>
              </ion-card-content>
            </ion-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .documents-container {
      padding: 16px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .section-title {
      font-size: 24px;
      font-weight: 300;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .drop-zone {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 32px;
      border: 2px dashed var(--ion-color-medium);
      border-radius: 12px;
      background: var(--ion-color-light);
      text-align: center;
      transition: all 0.3s ease;
    }

    .drop-zone.dragover {
      border-color: var(--ion-color-primary);
      background: rgba(var(--ion-color-primary-rgb), 0.1);
    }

    .drop-zone ion-icon {
      font-size: 64px;
      color: var(--ion-color-medium);
      margin-bottom: 16px;
    }

    .drop-zone p {
      color: var(--ion-color-medium);
      margin-bottom: 16px;
      max-width: 400px;
    }

    .documents-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }

    .document-card {
      margin: 0;
    }

    .document-preview {
      height: 150px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: var(--ion-color-light);
      overflow: hidden;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .document-preview:hover {
      background: rgba(var(--ion-color-primary-rgb), 0.1);
    }

    .document-preview .file-icon {
      font-size: 48px;
      color: var(--ion-color-medium);
    }

    .document-preview .preview-hint {
      font-size: 11px;
      color: var(--ion-color-medium);
      margin-top: 8px;
    }

    .document-info h4 {
      font-size: 14px;
      margin: 0 0 4px 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .document-info p {
      font-size: 12px;
      color: var(--ion-color-medium);
      margin: 0;
    }

    .document-info .file-size {
      color: var(--ion-color-medium-shade);
    }

    .document-info .description {
      margin-top: 8px;
      font-style: italic;
    }

    .document-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 8px;
    }
  `]
})
export class DocumentsTabComponent implements OnInit, OnChanges {
  @Input() patientId!: number;

  private clinicalHistoryService = inject(ClinicalHistoryService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);

  loading = false;
  uploading = false;
  documents: PatientDocument[] = [];
  isDragOver = false;

  constructor() {
    addIcons({
      cloudUploadOutline,
      documentOutline,
      imageOutline,
      trashOutline,
      downloadOutline,
      helpCircleOutline
    });
  }

  ngOnInit(): void {
    this.loadDocuments();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patientId'] && !changes['patientId'].firstChange) {
      this.loadDocuments();
    }
  }

  loadDocuments(): void {
    if (!this.patientId) return;

    this.loading = true;
    this.clinicalHistoryService.getDocuments(this.patientId).subscribe({
      next: (documents) => {
        this.documents = documents;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading documents:', error);
        this.loading = false;
        this.showToast('Error al cargar documentos', 'danger');
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.uploadFiles(Array.from(input.files));
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    if (event.dataTransfer?.files) {
      this.uploadFiles(Array.from(event.dataTransfer.files));
    }
  }

  uploadFiles(files: File[]): void {
    this.uploading = true;
    let uploadedCount = 0;
    let errorCount = 0;

    files.forEach(file => {
      const documentType = this.getDocumentType(file);

      this.clinicalHistoryService.uploadDocument(
        file,
        this.patientId,
        documentType,
        { title: file.name }
      ).subscribe({
        next: () => {
          uploadedCount++;
          if (uploadedCount + errorCount === files.length) {
            this.uploading = false;
            if (errorCount === 0) {
              this.showToast(`${uploadedCount} documento(s) subido(s) exitosamente`, 'success');
            } else {
              this.showToast(`${uploadedCount} subido(s), ${errorCount} fallido(s)`, 'warning');
            }
            this.loadDocuments();
          }
        },
        error: (error) => {
          console.error('Error uploading document:', error);
          errorCount++;
          if (uploadedCount + errorCount === files.length) {
            this.uploading = false;
            if (uploadedCount === 0) {
              this.showToast('Error al subir documentos', 'danger');
            } else {
              this.showToast(`${uploadedCount} subido(s), ${errorCount} fallido(s)`, 'warning');
            }
            this.loadDocuments();
          }
        }
      });
    });
  }

  download(doc: PatientDocument): void {
    if (!doc.id) {
      this.showToast('No se puede descargar el documento', 'danger');
      return;
    }

    this.clinicalHistoryService.downloadDocument(doc.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.file_name || 'documento';
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error downloading document:', error);
        this.showToast('Error al descargar documento', 'danger');
      }
    });
  }

  async delete(doc: PatientDocument): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Está seguro de eliminar el documento "${doc.file_name}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          cssClass: 'danger',
          handler: () => {
            this.clinicalHistoryService.deleteDocument(doc.id!).subscribe({
              next: () => {
                this.showToast('Documento eliminado', 'success');
                this.loadDocuments();
              },
              error: (error) => {
                console.error('Error deleting document:', error);
                this.showToast('Error al eliminar documento', 'danger');
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  isImage(mimeType?: string): boolean {
    return mimeType?.startsWith('image/') || false;
  }

  formatFileSize(bytes?: number): string {
    if (!bytes || bytes === 0) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private getDocumentType(file: File): string {
    if (file.type.startsWith('image/')) return 'radiograph';
    if (file.type === 'application/pdf') return 'report';
    return 'other';
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
