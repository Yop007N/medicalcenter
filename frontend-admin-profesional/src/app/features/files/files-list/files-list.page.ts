import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cloudUploadOutline,
  documentAttachOutline,
  downloadOutline,
  refreshOutline,
  trashOutline
} from 'ionicons/icons';
import {
  FILE_CATEGORIES,
  FileCategory,
  MedicalFile,
  formatFileSize,
  getFileCategoryLabel,
  getFileIcon
} from '../../../models/file.model';
import * as FilesActions from '../../../store/files/files.actions';
import {
  selectAllFiles,
  selectFilesError,
  selectFilesLoading,
  selectFilesUploading
} from '../../../store/files/files.selectors';

@Component({
  selector: 'app-files-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonMenuButton,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonSpinner,
    IonText,
    IonBadge,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonCard,
    IonCardContent
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Archivos</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="loadFiles()">
            <ion-icon slot="icon-only" name="refresh-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-card>
        <ion-card-content>
          <ion-item>
            <ion-label position="stacked">Filtrar por Patient ID</ion-label>
            <ion-input
              type="number"
              min="1"
              [(ngModel)]="patientFilterInput"
              placeholder="Ej: 3"
            ></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Categoria</ion-label>
            <ion-select [(ngModel)]="categoryFilter">
              <ion-select-option value="all">Todas</ion-select-option>
              @for (category of categories; track category.value) {
                <ion-select-option [value]="category.value">{{ category.label }}</ion-select-option>
              }
            </ion-select>
          </ion-item>
          <div class="action-row">
            <ion-button size="small" (click)="applyFilters()">Aplicar</ion-button>
            <ion-button size="small" fill="outline" (click)="clearFilters()">Limpiar</ion-button>
          </div>
        </ion-card-content>
      </ion-card>

      <ion-card>
        <ion-card-content>
          <h3>Subir archivo clinico</h3>
          <ion-item>
            <ion-label position="stacked">Patient ID</ion-label>
            <ion-input type="number" min="1" [(ngModel)]="uploadPatientId"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Categoria</ion-label>
            <ion-select [(ngModel)]="uploadCategory">
              @for (category of categories; track category.value) {
                <ion-select-option [value]="category.value">{{ category.label }}</ion-select-option>
              }
            </ion-select>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Descripcion (opcional)</ion-label>
            <ion-input [(ngModel)]="uploadDescription"></ion-input>
          </ion-item>
          <div class="action-row">
            <input #fileInput type="file" class="file-input" (change)="onFileSelected($event)" />
            <ion-button size="small" fill="outline" (click)="fileInput.click()">
              <ion-icon slot="start" name="document-attach-outline"></ion-icon>
              Seleccionar archivo
            </ion-button>
            <ion-button
              size="small"
              (click)="uploadFile()"
              [disabled]="!selectedFile || !uploadPatientId || (uploading$ | async)"
            >
              <ion-icon slot="start" name="cloud-upload-outline"></ion-icon>
              @if (uploading$ | async) { Subiendo... } @else { Subir }
            </ion-button>
          </div>
          @if (selectedFile) {
            <p class="selected-file">Archivo: {{ selectedFile.name }}</p>
          }
        </ion-card-content>
      </ion-card>

      @if (loading$ | async) {
        <div class="state-box">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Cargando archivos...</p>
        </div>
      } @else if (error$ | async; as error) {
        <div class="state-box">
          <ion-text color="danger">{{ error }}</ion-text>
        </div>
      } @else if (filteredFiles.length === 0) {
        <div class="state-box">
          <p>No hay archivos para los filtros aplicados.</p>
        </div>
      } @else {
        <ion-list>
          @for (file of filteredFiles; track file.id) {
            <ion-item>
              <ion-icon [name]="getIcon(file)" slot="start"></ion-icon>
              <ion-label>
                <h2>{{ file.original_filename || file.filename }}</h2>
                <p>Paciente: {{ file.patient?.first_name }} {{ file.patient?.last_name }} (ID {{ file.patient_id }})</p>
                <p>{{ getCategoryLabel(file.category) }} · {{ getReadableSize(file.file_size) }}</p>
                <p>{{ file.upload_date | date:'medium' }}</p>
              </ion-label>
              <ion-badge slot="end" color="medium">{{ file.category }}</ion-badge>
              <ion-button fill="clear" size="small" slot="end" (click)="download(file)">
                <ion-icon name="download-outline"></ion-icon>
              </ion-button>
              <ion-button fill="clear" size="small" color="danger" slot="end" (click)="remove(file)">
                <ion-icon name="trash-outline"></ion-icon>
              </ion-button>
            </ion-item>
          }
        </ion-list>
      }
    </ion-content>
  `,
  styles: [`
    ion-content {
      --background: var(--medical-bg-light);
    }

    ion-card {
      margin: 12px;
    }

    .action-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }

    .file-input {
      display: none;
    }

    .selected-file {
      color: var(--ion-color-primary);
      font-size: 0.85rem;
      margin: 8px 0 0;
    }

    .state-box {
      align-items: center;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 20px 16px;
      text-align: center;
    }
  `]
})
export class FilesListPage implements OnInit {
  private readonly store = inject(Store);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading$ = this.store.select(selectFilesLoading);
  readonly uploading$ = this.store.select(selectFilesUploading);
  readonly error$ = this.store.select(selectFilesError);

  readonly categories = FILE_CATEGORIES;

  allFiles: MedicalFile[] = [];
  filteredFiles: MedicalFile[] = [];
  selectedFile: File | null = null;

  patientFilterInput = '';
  categoryFilter: 'all' | FileCategory = 'all';

  uploadPatientId: number | null = null;
  uploadCategory: FileCategory = 'medical';
  uploadDescription = '';

  constructor() {
    addIcons({
      refreshOutline,
      documentAttachOutline,
      cloudUploadOutline,
      downloadOutline,
      trashOutline
    });
  }

  ngOnInit(): void {
    this.store
      .select(selectAllFiles)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((files) => {
        this.allFiles = files;
        this.applyClientFilters();
      });

    this.loadFiles();
  }

  loadFiles(): void {
    const patientId = this.parsePatientFilter(this.patientFilterInput);
    this.store.dispatch(FilesActions.loadFiles({ patientId: patientId ?? undefined }));
  }

  applyFilters(): void {
    this.loadFiles();
  }

  clearFilters(): void {
    this.patientFilterInput = '';
    this.categoryFilter = 'all';
    this.loadFiles();
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.selectedFile = target.files && target.files.length > 0 ? target.files[0] : null;
  }

  uploadFile(): void {
    if (!this.selectedFile || !this.uploadPatientId || this.uploadPatientId <= 0) {
      return;
    }

    this.store.dispatch(
      FilesActions.uploadFile({
        file: this.selectedFile,
        metadata: {
          patient_id: this.uploadPatientId,
          category: this.uploadCategory,
          description: this.uploadDescription.trim() || undefined
        }
      })
    );

    this.selectedFile = null;
    this.uploadDescription = '';
    this.patientFilterInput = String(this.uploadPatientId);
    this.loadFiles();
  }

  download(file: MedicalFile): void {
    this.store.dispatch(
      FilesActions.downloadFile({
        id: file.id,
        filename: file.original_filename || file.filename
      })
    );
  }

  remove(file: MedicalFile): void {
    const confirmed = window.confirm(`Eliminar archivo "${file.original_filename || file.filename}"?`);
    if (!confirmed) {
      return;
    }

    this.store.dispatch(FilesActions.deleteFile({ id: file.id }));
  }

  getReadableSize(bytes: number): string {
    return formatFileSize(bytes);
  }

  getCategoryLabel(category: FileCategory): string {
    return getFileCategoryLabel(category);
  }

  getIcon(file: MedicalFile): string {
    return getFileIcon(file.file_type);
  }

  private applyClientFilters(): void {
    if (this.categoryFilter === 'all') {
      this.filteredFiles = this.allFiles;
      return;
    }

    this.filteredFiles = this.allFiles.filter((file) => file.category === this.categoryFilter);
  }

  private parsePatientFilter(rawValue: string): number | null {
    const parsed = Number(rawValue);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }
}
