import { CommonModule, Location } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  IonBadge,
  IonButton,
  IonButtons,

  IonCard,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
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
  arrowBackOutline,
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
import { Patient } from '../../../models/patient.model';
import { NotificationService, PatientsApiService } from '../../../core/services';
import * as FilesActions from '../../../store/files/files.actions';
import {
  selectAllFiles,
  selectFilesError,
  selectFilesLoading,
  selectFilesUploading
} from '../../../store/files/files.selectors';

interface PatientFilesGroup {
  patientId: number;
  patientName: string;
  files: MedicalFile[];
}

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
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
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
          @if (backPatientId) {
            <ion-button fill="clear" (click)="goBack()" aria-label="Volver">
              <ion-icon slot="icon-only" name="arrow-back-outline"></ion-icon>
            </ion-button>
          } @else {
            <ion-menu-button></ion-menu-button>
          }
        </ion-buttons>
        <ion-title>Archivos</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="loadFiles(uploadPatientId || undefined)" [disabled]="!uploadPatientId" aria-label="Recargar archivos">
            <ion-icon slot="icon-only" name="refresh-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-card>
        <ion-card-content>
          <h3>Subir archivo clinico</h3>
          <p class="section-help">Selecciona primero el paciente por nombre y luego sube el archivo.</p>
          <ion-item class="field-item">
            <ion-label position="stacked">Paciente</ion-label>
            <ion-select
              [(ngModel)]="uploadPatientId"
              (ngModelChange)="onUploadPatientChange($event)"
              placeholder="Selecciona paciente por nombre"
              interface="popover"
              [disabled]="uploadPatients.length === 0"
            >
              <ion-select-option [value]="null">Sin seleccionar</ion-select-option>
              @for (patient of uploadPatients; track patient.id) {
                <ion-select-option [value]="patient.id">
                  {{ getUploadPatientDisplay(patient) }}
                </ion-select-option>
              }
            </ion-select>
          </ion-item>
          @if (uploadPatients.length === 0) {
            <p class="field-help">No se pudieron cargar pacientes. Recarga la pagina.</p>
          }
          @if (uploadPatientId) {
            <p class="field-help">ID seleccionado: {{ uploadPatientId }}</p>
          }
          <ion-item class="field-item">
            <ion-label position="stacked">Categoria del archivo</ion-label>
            <ion-select [(ngModel)]="uploadCategory">
              @for (category of categories; track category.value) {
                <ion-select-option [value]="category.value">{{ category.label }}</ion-select-option>
              }
            </ion-select>
          </ion-item>
          <ion-item class="field-item">
            <ion-label position="stacked">Descripcion (opcional)</ion-label>
            <ion-input [(ngModel)]="uploadDescription" placeholder="Notas del archivo"></ion-input>
          </ion-item>
          <p class="upload-help">Tamano maximo permitido: 64 MB.</p>
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
            <p class="selected-file">Archivo: {{ selectedFile.name }} ({{ getReadableSize(selectedFile.size) }})</p>
          }
        </ion-card-content>
      </ion-card>

      @if (uploadPatientId) {
        @if (loading$ | async) {
          <div class="state-box">
            <ion-spinner name="crescent"></ion-spinner>
            <p>Cargando archivos...</p>
          </div>
        } @else if (error$ | async; as error) {
          <div class="state-box">
            <ion-text color="danger">{{ error }}</ion-text>
          </div>
        } @else if (groupedFiles.length === 0) {
          <div class="state-box">
            <p>No hay archivos para el paciente seleccionado.</p>
          </div>
        } @else {
          @for (group of groupedFiles; track group.patientId) {
            <ion-card class="patient-files-card">
              <ion-card-header>
                <ion-card-title>{{ group.patientName }}</ion-card-title>
                <ion-card-subtitle>ID {{ group.patientId }} · {{ group.files.length }} archivo(s)</ion-card-subtitle>
              </ion-card-header>
              <ion-list>
                @for (file of group.files; track file.id) {
                  <ion-item>
                    <ion-icon [name]="getIcon(file)" slot="start"></ion-icon>
                    <ion-label>
                      <h2>{{ file.original_filename || file.filename }}</h2>
                      <div class="file-meta">
                        <p><strong>Categoria:</strong> {{ getCategoryLabel(file.category) }}</p>
                        <p><strong>Tamano:</strong> {{ getReadableSize(file.file_size) }}</p>
                        <p><strong>Fecha:</strong> {{ file.upload_date | date:'medium' }}</p>
                      </div>
                      @if (file.description) {
                        <p><strong>Descripcion:</strong> {{ file.description }}</p>
                      }
                    </ion-label>
                    <ion-badge slot="end" color="medium">{{ file.category }}</ion-badge>
                    <ion-button fill="clear" size="small" slot="end" (click)="download(file)" aria-label="Descargar archivo">
                      <ion-icon name="download-outline"></ion-icon>
                    </ion-button>
                    <ion-button fill="clear" size="small" color="danger" slot="end" (click)="remove(file)" aria-label="Eliminar archivo">
                      <ion-icon name="trash-outline"></ion-icon>
                    </ion-button>
                  </ion-item>
                }
              </ion-list>
            </ion-card>
          }
        }
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

    ion-searchbar {
      --background: var(--medical-bg-card);
      --border-radius: 12px;
      --box-shadow: none;
      --placeholder-color: var(--ion-color-medium);
      --icon-color: var(--ion-color-medium);
      padding: 0;
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

    .field-item {
      --min-height: 74px;
      --padding-top: 8px;
      --padding-bottom: 8px;
      --inner-padding-top: 6px;
      --inner-padding-bottom: 6px;
      align-items: flex-start;
    }

    .field-item ion-label[position="stacked"] {
      margin-bottom: 6px;
      font-size: 0.82rem;
      font-weight: 600;
      line-height: 1.2;
      white-space: normal;
    }

    .field-item ion-input,
    .field-item ion-select {
      margin-top: 2px;
      width: 100%;
    }

    .upload-help {
      color: var(--ion-color-medium);
      font-size: 0.8rem;
      margin: 8px 0 0;
    }

    .field-help {
      color: var(--ion-color-medium);
      font-size: 0.8rem;
      margin: 4px 0 0;
      padding: 0 4px;
    }

    .patient-files-card ion-card-header {
      padding-bottom: 8px;
    }

    .file-meta {
      display: grid;
      gap: 2px;
      margin-top: 4px;
    }

    .file-meta p {
      margin: 0;
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
  private readonly patientsApi = inject(PatientsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly notification = inject(NotificationService);

  readonly loading$ = this.store.select(selectFilesLoading);
  readonly uploading$ = this.store.select(selectFilesUploading);
  readonly error$ = this.store.select(selectFilesError);

  readonly categories = FILE_CATEGORIES;

  allFiles: MedicalFile[] = [];
  groupedFiles: PatientFilesGroup[] = [];
  selectedFile: File | null = null;
  uploadPatients: Patient[] = [];

  uploadPatientId: number | null = null;
  backPatientId: number | null = null;
  specialtyKey: string | null = null;
  uploadCategory: FileCategory = 'medical';
  uploadDescription = '';

  constructor() {
    addIcons({
      arrowBackOutline,
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
        this.allFiles = this.deduplicateFiles(files);
        this.rebuildPatientGroups();
      });

    this.loadPatients();

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const patientIdRaw = params.get('patient_id') ?? params.get('patientId');
        const patientId = patientIdRaw ? Number(patientIdRaw) : NaN;
        this.specialtyKey = params.get('specialty_key');

        if (Number.isFinite(patientId) && patientId > 0) {
          this.backPatientId = patientId;
          this.uploadPatientId = patientId;
          this.loadFiles(patientId);
          return;
        }

        this.backPatientId = null;
        this.uploadPatientId = null;
        this.loadFiles(undefined);
      });
  }

  goBack(): void {
    if (this.backPatientId) {
      void this.router.navigate(['/patients', this.backPatientId]);
      return;
    }
    this.location.back();
  }

  loadFiles(patientId?: number): void {
    if (!patientId) {
      this.store.dispatch(FilesActions.clearFilesState());
      return;
    }
    this.store.dispatch(FilesActions.loadFiles({
      patientId,
      specialtyKey: this.specialtyKey || undefined
    }));
  }

  onUploadPatientChange(value: unknown): void {
    const nextValue = Number(value);
    this.uploadPatientId = Number.isFinite(nextValue) && nextValue > 0 ? nextValue : null;
    this.loadFiles(this.uploadPatientId || undefined);
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
          specialty_key: this.specialtyKey || undefined,
          description: this.uploadDescription.trim() || undefined
        }
      })
    );

    this.selectedFile = null;
    this.uploadDescription = '';
  }

  download(file: MedicalFile): void {
    this.store.dispatch(
      FilesActions.downloadFile({
        id: file.id,
        filename: file.original_filename || file.filename
      })
    );
  }

  async remove(file: MedicalFile): Promise<void> {
    const confirmed = await this.notification.confirm(
      'Eliminar archivo',
      `Eliminar archivo "${file.original_filename || file.filename}"?`,
      'Eliminar'
    );
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

  getPatientDisplayName(file: MedicalFile): string {
    const fullName = `${file.patient?.first_name ?? ''} ${file.patient?.last_name ?? ''}`.trim();
    return fullName || 'No disponible';
  }

  getUploadPatientDisplay(patient: Patient): string {
    const fullName = `${patient.first_name ?? ''} ${patient.last_name ?? ''}`.trim();
    if (!fullName) {
      return `Paciente #${patient.id}`;
    }
    return `${fullName} (#${patient.id})`;
  }

  private normalizeText(rawValue: string | null | undefined): string {
    return (rawValue ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private deduplicateFiles(files: MedicalFile[]): MedicalFile[] {
    const filesById = new Map<number, MedicalFile>();
    files.forEach((file) => {
      filesById.set(file.id, file);
    });
    return Array.from(filesById.values());
  }

  private rebuildPatientGroups(): void {
    const groupsByPatient = new Map<number, PatientFilesGroup>();

    this.allFiles.forEach((file) => {
      const existingGroup = groupsByPatient.get(file.patient_id);
      if (existingGroup) {
        existingGroup.files.push(file);
        return;
      }

      groupsByPatient.set(file.patient_id, {
        patientId: file.patient_id,
        patientName: this.getPatientDisplayName(file),
        files: [file]
      });
    });

    this.groupedFiles = Array.from(groupsByPatient.values())
      .map((group) => ({
        ...group,
        files: [...group.files].sort((a, b) => {
          const dateA = new Date(a.upload_date ?? a.created_at ?? 0).getTime();
          const dateB = new Date(b.upload_date ?? b.created_at ?? 0).getTime();
          return dateB - dateA;
        })
      }))
      .sort((a, b) => {
        const byName = this.normalizeText(a.patientName).localeCompare(this.normalizeText(b.patientName));
        if (byName !== 0) {
          return byName;
        }
        return a.patientId - b.patientId;
      });
  }

  private loadPatients(): void {
    this.patientsApi
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (patients) => {
          this.uploadPatients = [...patients].sort((a, b) => {
            const nameA = this.normalizeText(`${a.first_name} ${a.last_name}`);
            const nameB = this.normalizeText(`${b.first_name} ${b.last_name}`);
            return nameA.localeCompare(nameB);
          });
        },
        error: () => {
          this.uploadPatients = [];
        }
      });
  }
}
