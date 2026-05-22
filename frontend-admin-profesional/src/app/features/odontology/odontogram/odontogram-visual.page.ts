import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonList,
  IonItem,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonChip,
  IonFab,
  IonFabButton,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  saveOutline,
  refreshOutline,
  informationCircleOutline,
  colorPaletteOutline,
  printOutline,
  eyeOutline
} from 'ionicons/icons';
import { AppState } from '../../../store';
import * as OdontologyActions from '../../../store/odontology/odontology.actions';
import { selectSelectedOdontogram, selectOdontologyLoading } from '../../../store/odontology/odontology.selectors';
import {
  ToothStatus,
  ToothUpdate,
  PERMANENT_TEETH,
  DECIDUOUS_TEETH,
  TOOTH_STATUS_COLORS
} from '../../../models/odontology.model';
import { ToothImageData } from './tooth-image.component';
import { OdontogramChartComponent } from '../components/odontogram-chart/odontogram-chart.component';

type DentitionType = 'permanent' | 'deciduous' | 'mixed';

@Component({
  selector: 'app-odontogram-visual',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonList,
    IonItem,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonChip,
    IonFab,
    IonFabButton,
    OdontogramChartComponent
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/odontology"></ion-back-button>
        </ion-buttons>
        <ion-title>Odontograma Visual</ion-title>
        <ion-buttons slot="end">
          <ion-button aria-label="Ver" (click)="toggleView()">
            <ion-icon name="eye-outline" slot="icon-only"></ion-icon>
          </ion-button>
          <ion-button aria-label="Imprimir" (click)="printOdontogram()">
            <ion-icon name="print-outline" slot="icon-only"></ion-icon>
          </ion-button>
          <ion-button aria-label="Guardar" (click)="saveOdontogram()" [disabled]="!hasChanges">
            <ion-icon name="save-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment [(ngModel)]="dentitionType" (ionChange)="onDentitionChange()">
          <ion-segment-button value="permanent">
            <ion-label>Adulto</ion-label>
          </ion-segment-button>
          <ion-segment-button value="deciduous">
            <ion-label>Niño</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (loading$ | async) {
        <div class="loading-container">
          <ion-spinner></ion-spinner>
          <p>Cargando odontograma...</p>
        </div>
      } @else {
        <!-- Patient Info -->
        @if (patientName) {
          <ion-card class="patient-card">
            <ion-card-header>
              <ion-card-subtitle>Paciente</ion-card-subtitle>
              <ion-card-title>{{ patientName }}</ion-card-title>
            </ion-card-header>
          </ion-card>
        }

        <!-- Status Legend -->
        <div class="legend-section">
          <h4>Estado a aplicar:</h4>
          <div class="status-chips">
            @for (status of toothStatuses; track status.value) {
              <ion-chip
                [outline]="selectedStatus !== status.value"
                [class.active]="selectedStatus === status.value"
                (click)="selectStatus(status.value)"
              >
                <span class="status-dot" [style.background-color]="status.color"></span>
                <ion-label>{{ status.label }}</ion-label>
              </ion-chip>
            }
          </div>
        </div>

        <!-- Odontogram Chart Component -->
        <app-odontogram-chart
          [teethData]="teethData"
          [dentitionType]="dentitionType"
          [selectedToothNumber]="selectedTooth?.number || null"
          [printMode]="printMode"
          (toothClick)="onToothClick($event)"
        ></app-odontogram-chart>

        <!-- Selected Tooth Panel -->
        @if (selectedTooth) {
          <ion-card class="tooth-panel">
            <ion-card-header>
              <ion-card-title>
                <ion-icon name="information-circle-outline"></ion-icon>
                Diente #{{ selectedTooth.number }}
              </ion-card-title>
              <ion-card-subtitle>{{ getToothName(selectedTooth.number) }}</ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              <ion-list lines="none">
                <ion-item>
                  <ion-label position="stacked">Estado</ion-label>
                  <ion-select
                    [(ngModel)]="selectedTooth.status"
                    (ionChange)="onStatusChange()"
                    interface="action-sheet"
                  >
                    @for (status of toothStatuses; track status.value) {
                      <ion-select-option [value]="status.value">
                        {{ status.label }}
                      </ion-select-option>
                    }
                  </ion-select>
                </ion-item>

                <ion-item>
                  <ion-label position="stacked">Notas</ion-label>
                  <ion-textarea
                    [(ngModel)]="selectedTooth.notes"
                    placeholder="Observaciones..."
                    rows="2"
                    (ionBlur)="onNotesChange()"
                  ></ion-textarea>
                </ion-item>
              </ion-list>

              <div class="panel-actions">
                <ion-button fill="outline" size="small" (click)="resetTooth()">
                  <ion-icon name="refresh-outline" slot="start"></ion-icon>
                  Limpiar
                </ion-button>
                <ion-button size="small" (click)="applySelectedStatus()">
                  <ion-icon name="color-palette-outline" slot="start"></ion-icon>
                  Aplicar {{ getStatusLabel(selectedStatus) }}
                </ion-button>
              </div>
            </ion-card-content>
          </ion-card>
        }

        <!-- Color Legend -->
        <ion-card class="legend-card">
          <ion-card-header>
            <ion-card-title>Leyenda de Colores</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="legend-grid">
              @for (status of toothStatuses; track status.value) {
                <div class="legend-item">
                  <span class="legend-color" [style.background-color]="status.color"></span>
                  <span class="legend-text">{{ status.label }}</span>
                </div>
              }
            </div>
          </ion-card-content>
        </ion-card>

        <!-- General Notes -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Notas Generales</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-textarea
              [(ngModel)]="generalNotes"
              placeholder="Observaciones generales del odontograma..."
              rows="3"
              (ionBlur)="hasChanges = true"
            ></ion-textarea>
          </ion-card-content>
        </ion-card>
      }

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button (click)="saveOdontogram()" [disabled]="!hasChanges" color="success">
          <ion-icon name="save-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      gap: 16px;
    }

    .patient-card {
      margin-bottom: 16px;
    }

    .legend-section {
      background: var(--ion-color-light);
      padding: 12px;
      border-radius: 12px;
      margin-bottom: 16px;

      h4 {
        margin: 0 0 8px 0;
        font-size: 14px;
        font-weight: 600;
      }

      .status-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;

        ion-chip {
          --padding-start: 8px;
          --padding-end: 12px;
          cursor: pointer;
          margin: 0;

          &.active {
            --background: var(--ion-color-primary);
            --color: white;
          }

          .status-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 6px;
          }
        }
      }
    }

    .tooth-panel {
      ion-card-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 18px;
      }

      .panel-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        margin-top: 12px;
      }
    }

    .legend-card {
      .legend-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 8px;

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 8px;
          background: var(--ion-color-light);
          border-radius: 6px;

          .legend-color {
            width: 16px;
            height: 16px;
            border-radius: 4px;
            flex-shrink: 0;
          }

          .legend-text {
            font-size: 12px;
          }
        }
      }
    }

    @media print {
      .legend-section,
      .tooth-panel,
      ion-fab {
        display: none !important;
      }
    }
  `]
})
export class OdontogramVisualPage implements OnInit, OnDestroy {
  private store = inject(Store<AppState>);
  private route = inject(ActivatedRoute);
  private toastController = inject(ToastController);
  private destroy$ = new Subject<void>();

  dentitionType: DentitionType = 'permanent';
  selectedTooth: ToothImageData | null = null;
  selectedStatus: ToothStatus = 'caries';
  hasChanges = false;
  generalNotes = '';
  patientName = '';
  printMode = false;

  loading$ = this.store.select(selectOdontologyLoading);

  teethData: Map<number, ToothImageData> = new Map();

  toothStatuses: { value: ToothStatus; label: string; color: string }[] = [
    { value: 'healthy', label: 'Sano', color: TOOTH_STATUS_COLORS.healthy },
    { value: 'caries', label: 'Caries', color: TOOTH_STATUS_COLORS.caries },
    { value: 'filled', label: 'Obturado', color: TOOTH_STATUS_COLORS.filled },
    { value: 'crown', label: 'Corona', color: TOOTH_STATUS_COLORS.crown },
    { value: 'implant', label: 'Implante', color: TOOTH_STATUS_COLORS.implant },
    { value: 'missing', label: 'Ausente', color: TOOTH_STATUS_COLORS.missing },
    { value: 'root_canal', label: 'Endodoncia', color: TOOTH_STATUS_COLORS.root_canal },
    { value: 'fractured', label: 'Fracturado', color: TOOTH_STATUS_COLORS.fractured },
    { value: 'mobile', label: 'Movilidad', color: TOOTH_STATUS_COLORS.mobile },
    { value: 'to_extract', label: 'A Extraer', color: TOOTH_STATUS_COLORS.to_extract },
    { value: 'extracted', label: 'Extraído', color: TOOTH_STATUS_COLORS.extracted }
  ];

  constructor() {
    addIcons({
      saveOutline,
      refreshOutline,
      informationCircleOutline,
      colorPaletteOutline,
      printOutline,
      eyeOutline
    });
  }

  ngOnInit() {
    this.initializeTeeth();
    this.loadOdontogramData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeTeeth() {
    const allTeeth = this.getAllTeethNumbers();
    allTeeth.forEach(num => {
      this.teethData.set(num, {
        number: num,
        status: 'healthy',
        notes: ''
      });
    });
  }

  private loadOdontogramData() {
    const patientId = this.route.snapshot.paramMap.get('patientId');
    const odontogramId = this.route.snapshot.paramMap.get('id');

    if (odontogramId) {
      this.store.dispatch(OdontologyActions.loadOdontogram({ id: +odontogramId }));
    } else if (patientId) {
      this.store.dispatch(OdontologyActions.loadOdontograms({ patientId: +patientId }));
    }

    this.store.select(selectSelectedOdontogram)
      .pipe(takeUntil(this.destroy$))
      .subscribe(odontogram => {
        if (odontogram) {
          this.patientName = odontogram.patient
            ? `${odontogram.patient.first_name} ${odontogram.patient.last_name}`
            : '';
          this.generalNotes = odontogram.notes || '';

          odontogram.teeth?.forEach(tooth => {
            const toothData = this.teethData.get(tooth.tooth_number);
            if (toothData) {
              toothData.status = tooth.status;
              toothData.notes = tooth.notes || '';
            }
          });
        }
      });
  }

  private getAllTeethNumbers(): number[] {
    return [
      ...PERMANENT_TEETH.upperRight,
      ...PERMANENT_TEETH.upperLeft,
      ...PERMANENT_TEETH.lowerRight,
      ...PERMANENT_TEETH.lowerLeft,
      ...DECIDUOUS_TEETH.upperRight,
      ...DECIDUOUS_TEETH.upperLeft,
      ...DECIDUOUS_TEETH.lowerRight,
      ...DECIDUOUS_TEETH.lowerLeft
    ];
  }

  getToothName(toothNumber: number): string {
    const quadrant = Math.floor(toothNumber / 10);
    const position = toothNumber % 10;

    const quadrantNames: Record<number, string> = {
      1: 'Superior Derecho',
      2: 'Superior Izquierdo',
      3: 'Inferior Izquierdo',
      4: 'Inferior Derecho',
      5: 'Sup. Derecho (Temporal)',
      6: 'Sup. Izquierdo (Temporal)',
      7: 'Inf. Izquierdo (Temporal)',
      8: 'Inf. Derecho (Temporal)'
    };

    const toothNames: Record<number, string> = {
      1: 'Incisivo Central',
      2: 'Incisivo Lateral',
      3: 'Canino',
      4: 'Primer Premolar',
      5: 'Segundo Premolar',
      6: 'Primer Molar',
      7: 'Segundo Molar',
      8: 'Tercer Molar'
    };

    return `${toothNames[position] || 'Diente'} - ${quadrantNames[quadrant] || ''}`;
  }

  getStatusLabel(status: ToothStatus): string {
    return this.toothStatuses.find(s => s.value === status)?.label || status;
  }

  onDentitionChange() {
    this.selectedTooth = null;
  }

  onToothClick(tooth: ToothImageData) {
    this.selectedTooth = { ...tooth };
  }

  onStatusChange() {
    if (this.selectedTooth) {
      this.updateToothData(this.selectedTooth);
    }
  }

  onNotesChange() {
    if (this.selectedTooth) {
      this.updateToothData(this.selectedTooth);
    }
  }

  selectStatus(status: ToothStatus) {
    this.selectedStatus = status;
  }

  applySelectedStatus() {
    if (this.selectedTooth) {
      this.selectedTooth.status = this.selectedStatus;
      this.updateToothData(this.selectedTooth);
    }
  }

  private updateToothData(tooth: ToothImageData) {
    this.teethData.set(tooth.number, { ...tooth });
    this.hasChanges = true;
  }

  resetTooth() {
    if (this.selectedTooth) {
      this.selectedTooth.status = 'healthy';
      this.selectedTooth.notes = '';
      this.updateToothData(this.selectedTooth);
    }
  }

  toggleView() {
    this.printMode = !this.printMode;
  }

  printOdontogram() {
    window.print();
  }

  async saveOdontogram() {
    const odontogramId = this.route.snapshot.paramMap.get('id');
    const patientId = this.route.snapshot.paramMap.get('patientId');

    const teethPayload: { toothNumber: number; tooth: ToothUpdate }[] = [];
    this.teethData.forEach((tooth, num) => {
      if (tooth.status !== 'healthy' || tooth.notes) {
        teethPayload.push({
          toothNumber: num,
          tooth: {
            status: tooth.status,
            notes: tooth.notes
          }
        });
      }
    });

    if (odontogramId) {
      teethPayload.forEach(payload => {
        this.store.dispatch(OdontologyActions.updateTooth({
          odontogramId: +odontogramId,
          toothNumber: payload.toothNumber,
          tooth: payload.tooth
        }));
      });
    } else if (patientId) {
      this.store.dispatch(OdontologyActions.createOdontogram({
        odontogram: {
          patient_id: +patientId,
          notes: this.generalNotes
        }
      }));
    }

    const toast = await this.toastController.create({
      message: 'Odontograma guardado',
      duration: 2000,
      color: 'success'
    });
    await toast.present();
    this.hasChanges = false;
  }
}
