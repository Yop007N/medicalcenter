import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, documentOutline, trashOutline, eyeOutline, printOutline } from 'ionicons/icons';
import { ClinicalDocument, CLINICAL_DOCUMENT_TYPES } from '../../../../../models/odontology.model';

@Component({
  selector: 'app-clinical-docs-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonCheckbox,
    IonSpinner
  ],
  template: `
    <div class="clinical-docs-container">
      <!-- Header -->
      <div class="header-row">
        <h2 class="section-title">Documentos clínicos</h2>
        <div class="header-actions">
          <ion-item lines="none" class="checkbox-item">
            <ion-checkbox [(ngModel)]="showAnnulled"></ion-checkbox>
            <ion-label>Ver anulados</ion-label>
          </ion-item>
          <ion-button color="success" (click)="createDocument()">
            <ion-icon slot="start" name="add-outline"></ion-icon>
            Nuevo documento clínico
          </ion-button>
        </div>
      </div>

      @if (loading) {
        <div class="ion-text-center ion-padding">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Cargando documentos...</p>
        </div>
      } @else if (documents.length === 0) {
        <div class="empty-state">
          <ion-icon name="document-outline"></ion-icon>
          <p>Este paciente no cuenta con ningún documento clínico</p>
        </div>
      } @else {
        <div class="documents-grid">
          @for (doc of documents; track doc.id) {
            <ion-card class="document-card" [class.annulled]="!doc.is_active">
              <ion-card-header>
                <ion-card-title>{{ doc.title }}</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <p class="doc-type">{{ getDocTypeLabel(doc.document_type) }}</p>
                <p class="doc-date">{{ doc.created_at | date:'dd/MM/yyyy HH:mm' }}</p>
                @if (doc.professional) {
                  <p class="doc-professional">
                    Dr.(a) {{ doc.professional.first_name }} {{ doc.professional.last_name }}
                  </p>
                }
                <div class="document-actions">
                  <ion-button aria-label="Ver" fill="clear" size="small" (click)="view(doc)">
                    <ion-icon slot="icon-only" name="eye-outline"></ion-icon>
                  </ion-button>
                  <ion-button aria-label="Imprimir" fill="clear" size="small" (click)="print(doc)">
                    <ion-icon slot="icon-only" name="print-outline"></ion-icon>
                  </ion-button>
                  @if (doc.is_active) {
                    <ion-button aria-label="Eliminar" fill="clear" size="small" color="danger" (click)="annul(doc)">
                      <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
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
    .clinical-docs-container {
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

    .header-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .checkbox-item {
      --background: transparent;
      --padding-start: 0;
      font-size: 14px;
    }

    .documents-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }

    .document-card {
      margin: 0;
    }

    .document-card.annulled {
      opacity: 0.6;
      border-left: 4px solid var(--ion-color-danger);
    }

    .doc-type {
      font-size: 13px;
      color: var(--ion-color-primary);
      margin: 0 0 8px 0;
    }

    .doc-date {
      font-size: 12px;
      color: var(--ion-color-medium);
      margin: 0 0 4px 0;
    }

    .doc-professional {
      font-size: 12px;
      color: var(--ion-color-medium);
      margin: 0;
    }

    .document-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 12px;
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
  `]
})
export class ClinicalDocsTabComponent implements OnInit {
  @Input() patientId!: number;

  loading = false;
  documents: ClinicalDocument[] = [];
  showAnnulled = false;
  documentTypes = CLINICAL_DOCUMENT_TYPES;

  constructor() {
    addIcons({ addOutline, documentOutline, trashOutline, eyeOutline, printOutline });
  }

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.loading = true;
    setTimeout(() => {
      this.documents = [];
      this.loading = false;
    }, 500);
  }

  getDocTypeLabel(type: string): string {
    const found = this.documentTypes.find(t => t.value === type);
    return found ? found.label : type;
  }

  createDocument(): void {
    console.log('Create clinical document');
  }

  view(doc: ClinicalDocument): void {
    console.log('View document:', doc);
  }

  print(doc: ClinicalDocument): void {
    console.log('Print document:', doc);
  }

  annul(doc: ClinicalDocument): void {
    console.log('Annul document:', doc);
  }
}
