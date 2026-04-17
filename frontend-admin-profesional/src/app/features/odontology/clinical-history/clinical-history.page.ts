import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  timeOutline,
  documentTextOutline,
  clipboardOutline,
  gridOutline,
  analyticsOutline,
  imageOutline,
  medkitOutline,
  folderOutline,
  shieldCheckmarkOutline,
  printOutline
} from 'ionicons/icons';

// Tab Components
import { HistoryTabComponent } from './tabs/history-tab/history-tab.component';
import { EvolutionsTabComponent } from './tabs/evolutions-tab/evolutions-tab.component';
import { AnamnesisTabComponent } from './tabs/anamnesis-tab/anamnesis-tab.component';
import { OdontogramTabComponent } from './tabs/odontogram-tab/odontogram-tab.component';
import { PeriodontogramTabComponent } from './tabs/periodontogram-tab/periodontogram-tab.component';
import { DocumentsTabComponent } from './tabs/documents-tab/documents-tab.component';
import { PrescriptionsTabComponent } from './tabs/prescriptions-tab/prescriptions-tab.component';
import { ClinicalDocsTabComponent } from './tabs/clinical-docs-tab/clinical-docs-tab.component';
import { ConsentsTabComponent } from './tabs/consents-tab/consents-tab.component';

import { selectSelectedPatient } from '../../../store/patients/patients.selectors';
import * as PatientsActions from '../../../store/patients/patients.actions';

export type ClinicalHistoryTab = 'history' | 'evolutions' | 'anamnesis' | 'odontogram' |
  'periodontogram' | 'documents' | 'prescriptions' | 'clinical-docs' | 'consents';

interface TabConfig {
  id: ClinicalHistoryTab;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-clinical-history',
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
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonText,
    HistoryTabComponent,
    EvolutionsTabComponent,
    AnamnesisTabComponent,
    OdontogramTabComponent,
    PeriodontogramTabComponent,
    DocumentsTabComponent,
    PrescriptionsTabComponent,
    ClinicalDocsTabComponent,
    ConsentsTabComponent
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/odontology"></ion-back-button>
        </ion-buttons>
        <ion-title>
          @if (patient$ | async; as patient) {
            Historia Clínica - {{ patient.first_name }} {{ patient.last_name }}
          } @else {
            Historia Clínica
          }
        </ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="print()" aria-label="Imprimir historia clínica">
            <ion-icon slot="icon-only" name="print-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>

      <!-- Tabs Navigation -->
      <ion-toolbar class="tabs-toolbar">
        <div class="tabs-scroll-container">
          <ion-segment [value]="activeTab" (ionChange)="onTabChange($event)" scrollable="true">
            @for (tab of tabs; track tab.id) {
              <ion-segment-button [value]="tab.id">
                <ion-icon [name]="tab.icon"></ion-icon>
                <ion-label>{{ tab.label }}</ion-label>
              </ion-segment-button>
            }
          </ion-segment>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (!patientId) {
        <div class="ion-text-center ion-padding">
          <ion-text color="danger">
            <p>No se ha especificado un paciente</p>
          </ion-text>
        </div>
      } @else {
        <!-- Tab Content -->
        <div class="tab-content">
          @switch (activeTab) {
            @case ('history') {
              <app-history-tab [patientId]="patientId"></app-history-tab>
            }
            @case ('evolutions') {
              <app-evolutions-tab [patientId]="patientId"></app-evolutions-tab>
            }
            @case ('anamnesis') {
              <app-anamnesis-tab [patientId]="patientId"></app-anamnesis-tab>
            }
            @case ('odontogram') {
              <app-odontogram-tab [patientId]="patientId"></app-odontogram-tab>
            }
            @case ('periodontogram') {
              <app-periodontogram-tab [patientId]="patientId"></app-periodontogram-tab>
            }
            @case ('documents') {
              <app-documents-tab [patientId]="patientId"></app-documents-tab>
            }
            @case ('prescriptions') {
              <app-prescriptions-tab [patientId]="patientId"></app-prescriptions-tab>
            }
            @case ('clinical-docs') {
              <app-clinical-docs-tab [patientId]="patientId"></app-clinical-docs-tab>
            }
            @case ('consents') {
              <app-consents-tab [patientId]="patientId"></app-consents-tab>
            }
          }
        </div>
      }
    </ion-content>
  `,
  styles: [`
    .tabs-toolbar {
      --background: var(--ion-color-light);
      --border-width: 0;
    }

    .tabs-scroll-container {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    ion-segment {
      --background: transparent;
      min-width: max-content;
    }

    ion-segment-button {
      --background: transparent;
      --background-checked: var(--ion-color-primary);
      --color: var(--ion-color-medium);
      --color-checked: white;
      --indicator-color: transparent;
      --border-radius: 8px;
      --padding-start: 12px;
      --padding-end: 12px;
      min-width: 100px;
      margin: 4px;
      font-size: 12px;
    }

    ion-segment-button ion-icon {
      font-size: 18px;
      margin-bottom: 4px;
    }

    ion-segment-button ion-label {
      font-size: 11px;
      text-transform: none;
      white-space: nowrap;
    }

    .tab-content {
      height: 100%;
      overflow: auto;
    }

    /* Desktop styles */
    @media (min-width: 992px) {
      ion-segment-button {
        min-width: 120px;
        --padding-start: 16px;
        --padding-end: 16px;
      }

      ion-segment-button ion-icon {
        font-size: 20px;
      }

      ion-segment-button ion-label {
        font-size: 12px;
      }
    }
  `]
})
export class ClinicalHistoryPage implements OnInit, OnDestroy {
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  patient$ = this.store.select(selectSelectedPatient);
  patientId: number | null = null;
  activeTab: ClinicalHistoryTab = 'history';

  tabs: TabConfig[] = [
    { id: 'history', label: 'Historial', icon: 'time-outline' },
    { id: 'evolutions', label: 'Evoluciones', icon: 'document-text-outline' },
    { id: 'anamnesis', label: 'Ficha Anamnesis', icon: 'clipboard-outline' },
    { id: 'odontogram', label: 'Odontograma', icon: 'grid-outline' },
    { id: 'periodontogram', label: 'Periodontograma', icon: 'analytics-outline' },
    { id: 'documents', label: 'Rx y Documentos', icon: 'image-outline' },
    { id: 'prescriptions', label: 'Recetas', icon: 'medkit-outline' },
    { id: 'clinical-docs', label: 'Documentos Clínicos', icon: 'folder-outline' },
    { id: 'consents', label: 'Consentimientos', icon: 'shield-checkmark-outline' }
  ];

  constructor() {
    addIcons({
      timeOutline,
      documentTextOutline,
      clipboardOutline,
      gridOutline,
      analyticsOutline,
      imageOutline,
      medkitOutline,
      folderOutline,
      shieldCheckmarkOutline,
      printOutline
    });
  }

  ngOnInit(): void {
    // Get patient ID from route
    const idParam = this.route.snapshot.paramMap.get('patientId');
    if (idParam) {
      this.patientId = parseInt(idParam, 10);
      this.store.dispatch(PatientsActions.loadPatient({ id: this.patientId }));
    }

    // Get active tab from query params
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['tab'] && this.isValidTab(params['tab'])) {
          this.activeTab = params['tab'] as ClinicalHistoryTab;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTabChange(event: any): void {
    const newTab = event.detail.value as ClinicalHistoryTab;
    this.activeTab = newTab;

    // Update URL without navigating
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: newTab },
      queryParamsHandling: 'merge'
    });
  }

  print(): void {
    window.print();
  }

  private isValidTab(tab: string): boolean {
    return this.tabs.some(t => t.id === tab);
  }
}
