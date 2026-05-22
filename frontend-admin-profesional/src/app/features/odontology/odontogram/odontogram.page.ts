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
  IonItemDivider,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonChip,
  IonFab,
  IonFabButton,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  saveOutline,
  refreshOutline,
  informationCircleOutline,
  closeOutline,
  checkmarkOutline,
  createOutline,
  trashOutline,
  colorPaletteOutline
} from 'ionicons/icons';
import { AppState } from '../../../store';
import * as OdontologyActions from '../../../store/odontology/odontology.actions';
import { selectSelectedOdontogram, selectOdontologyLoading, selectOdontologyError } from '../../../store/odontology/odontology.selectors';
import {
  ToothStatus,
  SurfaceCondition,
  ToothUpdate,
  PERMANENT_TEETH,
  DECIDUOUS_TEETH,
  TOOTH_STATUS_COLORS
} from '../../../models/odontology.model';
import { ToothSvgComponent, ToothData } from './tooth-svg.component';

type DentitionType = 'permanent' | 'deciduous' | 'mixed';

@Component({
  selector: 'app-odontogram',
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
    IonItemDivider,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonChip,
    IonFab,
    IonFabButton,
    ToothSvgComponent
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/odontology"></ion-back-button>
        </ion-buttons>
        <ion-title>Odontograma</ion-title>
        <ion-buttons slot="end">
          <ion-button aria-label="Guardar" (click)="saveOdontogram()" [disabled]="!hasChanges">
            <ion-icon name="save-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment [(ngModel)]="dentitionType" (ionChange)="onDentitionChange()">
          <ion-segment-button value="permanent">
            <ion-label>Permanente</ion-label>
          </ion-segment-button>
          <ion-segment-button value="deciduous">
            <ion-label>Decidua</ion-label>
          </ion-segment-button>
          <ion-segment-button value="mixed">
            <ion-label>Mixta</ion-label>
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
          <ion-card class="patient-info">
            <ion-card-header>
              <ion-card-subtitle>Paciente</ion-card-subtitle>
              <ion-card-title>{{ patientName }}</ion-card-title>
            </ion-card-header>
          </ion-card>
        }

        <!-- Status Legend -->
        <div class="legend-container">
          <h4>Leyenda de Estados:</h4>
          <div class="legend-items">
            @for (status of toothStatuses; track status.value) {
              <ion-chip
                [outline]="selectedStatus !== status.value"
                [class.selected]="selectedStatus === status.value"
                (click)="selectStatus(status.value)"
                [style.--background]="status.color"
                [style.--color]="getContrastColor(status.color)"
              >
                <ion-label>{{ status.label }}</ion-label>
              </ion-chip>
            }
          </div>
        </div>

        <!-- Odontogram Chart -->
        <div class="odontogram-container">
          <!-- Upper Arch -->
          <div class="arch upper-arch">
            <h4 class="arch-label">Arcada Superior</h4>
            <div class="quadrant-row">
              <!-- Upper Right (Q1) -->
              <div class="quadrant upper-right">
                <span class="quadrant-label">Cuadrante 1</span>
                <div class="teeth-row">
                  @for (toothNum of getQuadrantTeeth('upperRight'); track toothNum) {
                    <app-tooth-svg
                      [tooth]="getToothData(toothNum)"
                      [selected]="selectedTooth?.number === toothNum"
                      [isUpperTooth]="true"
                      (toothClick)="onToothClick($event)"
                      (surfaceClick)="onSurfaceClick($event)"
                    ></app-tooth-svg>
                  }
                </div>
              </div>
              <!-- Upper Left (Q2) -->
              <div class="quadrant upper-left">
                <span class="quadrant-label">Cuadrante 2</span>
                <div class="teeth-row">
                  @for (toothNum of getQuadrantTeeth('upperLeft'); track toothNum) {
                    <app-tooth-svg
                      [tooth]="getToothData(toothNum)"
                      [selected]="selectedTooth?.number === toothNum"
                      [isUpperTooth]="true"
                      (toothClick)="onToothClick($event)"
                      (surfaceClick)="onSurfaceClick($event)"
                    ></app-tooth-svg>
                  }
                </div>
              </div>
            </div>
          </div>

          <!-- Center Line -->
          <div class="center-line">
            <span>Línea Media</span>
          </div>

          <!-- Lower Arch -->
          <div class="arch lower-arch">
            <h4 class="arch-label">Arcada Inferior</h4>
            <div class="quadrant-row">
              <!-- Lower Right (Q4) -->
              <div class="quadrant lower-right">
                <span class="quadrant-label">Cuadrante 4</span>
                <div class="teeth-row">
                  @for (toothNum of getQuadrantTeeth('lowerRight'); track toothNum) {
                    <app-tooth-svg
                      [tooth]="getToothData(toothNum)"
                      [selected]="selectedTooth?.number === toothNum"
                      [isUpperTooth]="false"
                      (toothClick)="onToothClick($event)"
                      (surfaceClick)="onSurfaceClick($event)"
                    ></app-tooth-svg>
                  }
                </div>
              </div>
              <!-- Lower Left (Q3) -->
              <div class="quadrant lower-left">
                <span class="quadrant-label">Cuadrante 3</span>
                <div class="teeth-row">
                  @for (toothNum of getQuadrantTeeth('lowerLeft'); track toothNum) {
                    <app-tooth-svg
                      [tooth]="getToothData(toothNum)"
                      [selected]="selectedTooth?.number === toothNum"
                      [isUpperTooth]="false"
                      (toothClick)="onToothClick($event)"
                      (surfaceClick)="onSurfaceClick($event)"
                    ></app-tooth-svg>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Selected Tooth Details -->
        @if (selectedTooth) {
          <ion-card class="tooth-details">
            <ion-card-header>
              <ion-card-title>
                <ion-icon name="information-circle-outline"></ion-icon>
                Diente {{ selectedTooth.number }}
              </ion-card-title>
              <ion-card-subtitle>{{ getToothName(selectedTooth.number) }}</ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              <ion-list>
                <ion-item>
                  <ion-label position="stacked">Estado General</ion-label>
                  <ion-select
                    [(ngModel)]="selectedTooth.status"
                    (ionChange)="onToothStatusChange()"
                    interface="action-sheet"
                  >
                    @for (status of toothStatuses; track status.value) {
                      <ion-select-option [value]="status.value">{{ status.label }}</ion-select-option>
                    }
                  </ion-select>
                </ion-item>

                <ion-item-divider>
                  <ion-label>Superficies</ion-label>
                </ion-item-divider>

                @for (surface of surfaces; track surface.key) {
                  <ion-item>
                    <ion-label>{{ surface.label }}</ion-label>
                    <ion-select
                      [(ngModel)]="selectedTooth.surfaces[surface.key]"
                      (ionChange)="onSurfaceStatusChange()"
                      interface="popover"
                      slot="end"
                    >
                      @for (condition of surfaceConditions; track condition.value) {
                        <ion-select-option [value]="condition.value">{{ condition.label }}</ion-select-option>
                      }
                    </ion-select>
                  </ion-item>
                }

                <ion-item>
                  <ion-label position="stacked">Notas</ion-label>
                  <ion-textarea
                    [(ngModel)]="toothNotes[selectedTooth.number]"
                    placeholder="Observaciones del diente..."
                    rows="2"
                  ></ion-textarea>
                </ion-item>
              </ion-list>

              <div class="tooth-actions">
                <ion-button fill="outline" (click)="resetTooth()">
                  <ion-icon name="refresh-outline" slot="start"></ion-icon>
                  Limpiar
                </ion-button>
                <ion-button (click)="applySelectedStatus()">
                  <ion-icon name="color-palette-outline" slot="start"></ion-icon>
                  Aplicar Estado
                </ion-button>
              </div>
            </ion-card-content>
          </ion-card>
        }

        <!-- Quick Actions -->
        <ion-card class="quick-actions">
          <ion-card-header>
            <ion-card-title>Acciones Rápidas</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="action-buttons">
              <ion-button fill="outline" size="small" (click)="markAllHealthy()">
                Marcar Todo Sano
              </ion-button>
              <ion-button fill="outline" size="small" (click)="resetOdontogram()">
                Reiniciar
              </ion-button>
              <ion-button fill="outline" size="small" (click)="printOdontogram()">
                Imprimir
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Notes -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Notas Generales</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-textarea
              [(ngModel)]="generalNotes"
              placeholder="Observaciones generales del odontograma..."
              rows="3"
            ></ion-textarea>
          </ion-card-content>
        </ion-card>
      }

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button (click)="saveOdontogram()" [disabled]="!hasChanges">
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
      height: 300px;
      gap: 16px;
    }

    .patient-info {
      margin-bottom: 16px;
    }

    .legend-container {
      background: var(--ion-color-light);
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 16px;

      h4 {
        margin: 0 0 8px 0;
        font-size: 14px;
        color: var(--ion-color-medium);
      }

      .legend-items {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;

        ion-chip {
          margin: 0;
          font-size: 11px;
          height: 28px;
          cursor: pointer;

          &.selected {
            transform: scale(1.1);
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          }
        }
      }
    }

    .odontogram-container {
      background: white;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow-x: auto;
    }

    .arch {
      .arch-label {
        text-align: center;
        font-size: 14px;
        color: var(--ion-color-medium);
        margin: 8px 0;
      }
    }

    .quadrant-row {
      display: flex;
      justify-content: center;
      gap: 20px;
    }

    .quadrant {
      .quadrant-label {
        display: block;
        text-align: center;
        font-size: 11px;
        color: var(--ion-color-medium);
        margin-bottom: 4px;
      }

      .teeth-row {
        display: flex;
        gap: 2px;
      }
    }

    .upper-right .teeth-row {
      flex-direction: row-reverse;
    }

    .lower-right .teeth-row {
      flex-direction: row-reverse;
    }

    .center-line {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 12px 0;

      span {
        font-size: 12px;
        color: var(--ion-color-medium);
        padding: 0 16px;
        position: relative;

        &::before,
        &::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 100px;
          height: 2px;
          background: var(--ion-color-light-shade);
        }

        &::before {
          right: 100%;
        }

        &::after {
          left: 100%;
        }
      }
    }

    .tooth-details {
      margin-top: 16px;

      ion-card-title {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .tooth-actions {
        display: flex;
        gap: 8px;
        margin-top: 16px;
        justify-content: flex-end;
      }
    }

    .quick-actions {
      .action-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
    }

    ion-item-divider {
      --background: var(--ion-color-light);
      font-weight: 600;
      margin: 8px 0;
    }

    @media (max-width: 768px) {
      .quadrant-row {
        flex-direction: column;
        align-items: center;
      }

      .upper-right,
      .lower-right {
        order: 1;
      }

      .upper-left,
      .lower-left {
        order: 2;
      }

      app-tooth-svg {
        --width: 45px;
        --height: 65px;
      }
    }
  `]
})
export class OdontogramPage implements OnInit, OnDestroy {
  private store = inject(Store<AppState>);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private destroy$ = new Subject<void>();

  dentitionType: DentitionType = 'permanent';
  selectedTooth: ToothData | null = null;
  selectedStatus: ToothStatus = 'caries';
  hasChanges = false;
  generalNotes = '';
  patientName = '';

  loading$ = this.store.select(selectOdontologyLoading);
  error$ = this.store.select(selectOdontologyError);

  // Tooth data storage
  teethData: Map<number, ToothData> = new Map();
  toothNotes: Record<number, string> = {};

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

  surfaceConditions: { value: SurfaceCondition; label: string }[] = [
    { value: 'healthy', label: 'Sano' },
    { value: 'caries', label: 'Caries' },
    { value: 'filled', label: 'Obturado' },
    { value: 'composite', label: 'Composite' },
    { value: 'amalgam', label: 'Amalgama' }
  ];

  surfaces = [
    { key: 'mesial' as const, label: 'Mesial (M)' },
    { key: 'distal' as const, label: 'Distal (D)' },
    { key: 'oclusal' as const, label: 'Oclusal/Incisal (O)' },
    { key: 'vestibular' as const, label: 'Vestibular (V)' },
    { key: 'lingual' as const, label: 'Lingual/Palatino (L)' }
  ];

  constructor() {
    addIcons({
      saveOutline,
      refreshOutline,
      informationCircleOutline,
      closeOutline,
      checkmarkOutline,
      createOutline,
      trashOutline,
      colorPaletteOutline
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
        surfaces: {
          mesial: 'healthy',
          distal: 'healthy',
          oclusal: 'healthy',
          vestibular: 'healthy',
          lingual: 'healthy'
        }
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

          // Load teeth data
          odontogram.teeth?.forEach(tooth => {
            const toothData = this.teethData.get(tooth.tooth_number);
            if (toothData) {
              toothData.status = tooth.status;
              toothData.surfaces = {
                mesial: tooth.mesial || 'healthy',
                distal: tooth.distal || 'healthy',
                oclusal: tooth.oclusal || 'healthy',
                vestibular: tooth.vestibular || 'healthy',
                lingual: tooth.lingual || 'healthy'
              };
              this.toothNotes[tooth.tooth_number] = tooth.notes || '';
            }
          });
        }
      });
  }

  private getAllTeethNumbers(): number[] {
    const permanent = [
      ...PERMANENT_TEETH.upperRight,
      ...PERMANENT_TEETH.upperLeft,
      ...PERMANENT_TEETH.lowerRight,
      ...PERMANENT_TEETH.lowerLeft
    ];
    const deciduous = [
      ...DECIDUOUS_TEETH.upperRight,
      ...DECIDUOUS_TEETH.upperLeft,
      ...DECIDUOUS_TEETH.lowerRight,
      ...DECIDUOUS_TEETH.lowerLeft
    ];
    return [...permanent, ...deciduous];
  }

  getQuadrantTeeth(quadrant: 'upperRight' | 'upperLeft' | 'lowerRight' | 'lowerLeft'): number[] {
    if (this.dentitionType === 'permanent') {
      return PERMANENT_TEETH[quadrant];
    } else if (this.dentitionType === 'deciduous') {
      return DECIDUOUS_TEETH[quadrant];
    } else {
      // Mixed dentition - show both
      return [...(PERMANENT_TEETH[quadrant] || []), ...(DECIDUOUS_TEETH[quadrant] || [])];
    }
  }

  getToothData(toothNumber: number): ToothData {
    return this.teethData.get(toothNumber) || {
      number: toothNumber,
      status: 'healthy',
      surfaces: {}
    };
  }

  getToothName(toothNumber: number): string {
    const quadrant = Math.floor(toothNumber / 10);
    const position = toothNumber % 10;

    const quadrantNames: Record<number, string> = {
      1: 'Superior Derecho',
      2: 'Superior Izquierdo',
      3: 'Inferior Izquierdo',
      4: 'Inferior Derecho',
      5: 'Superior Derecho (Deciduo)',
      6: 'Superior Izquierdo (Deciduo)',
      7: 'Inferior Izquierdo (Deciduo)',
      8: 'Inferior Derecho (Deciduo)'
    };

    const toothNames: Record<number, string> = {
      1: 'Incisivo Central',
      2: 'Incisivo Lateral',
      3: 'Canino',
      4: 'Primer Premolar',
      5: 'Segundo Premolar',
      6: 'Primer Molar',
      7: 'Segundo Molar',
      8: 'Tercer Molar (Cordal)'
    };

    return `${toothNames[position] || 'Diente'} - ${quadrantNames[quadrant] || ''}`;
  }

  onDentitionChange() {
    // Teeth data is preserved, only view changes
  }

  onToothClick(tooth: ToothData) {
    this.selectedTooth = { ...tooth };
  }

  onSurfaceClick(event: { tooth: ToothData; surface: string }) {
    this.selectedTooth = { ...event.tooth };
    // Apply selected status to the clicked surface
    if (this.selectedTooth.surfaces) {
      const surface = event.surface as keyof typeof this.selectedTooth.surfaces;
      const currentCondition = this.selectedTooth.surfaces[surface];
      // Cycle through conditions
      const conditions: SurfaceCondition[] = ['healthy', 'caries', 'filled', 'composite', 'amalgam'];
      const currentIndex = conditions.indexOf(currentCondition || 'healthy');
      const nextIndex = (currentIndex + 1) % conditions.length;
      this.selectedTooth.surfaces[surface] = conditions[nextIndex];
      this.updateToothData(this.selectedTooth);
    }
  }

  onToothStatusChange() {
    if (this.selectedTooth) {
      this.updateToothData(this.selectedTooth);
    }
  }

  onSurfaceStatusChange() {
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

  private updateToothData(tooth: ToothData) {
    this.teethData.set(tooth.number, { ...tooth });
    this.hasChanges = true;
  }

  resetTooth() {
    if (this.selectedTooth) {
      this.selectedTooth.status = 'healthy';
      this.selectedTooth.surfaces = {
        mesial: 'healthy',
        distal: 'healthy',
        oclusal: 'healthy',
        vestibular: 'healthy',
        lingual: 'healthy'
      };
      this.toothNotes[this.selectedTooth.number] = '';
      this.updateToothData(this.selectedTooth);
    }
  }

  async markAllHealthy() {
    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: '¿Marcar todos los dientes como sanos?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar',
          handler: () => {
            this.teethData.forEach((tooth, num) => {
              this.teethData.set(num, {
                ...tooth,
                status: 'healthy',
                surfaces: {
                  mesial: 'healthy',
                  distal: 'healthy',
                  oclusal: 'healthy',
                  vestibular: 'healthy',
                  lingual: 'healthy'
                }
              });
            });
            this.toothNotes = {};
            this.hasChanges = true;
            if (this.selectedTooth) {
              this.selectedTooth = this.teethData.get(this.selectedTooth.number) || null;
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async resetOdontogram() {
    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: '¿Reiniciar todo el odontograma? Se perderán todos los cambios.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Reiniciar',
          role: 'destructive',
          handler: () => {
            this.initializeTeeth();
            this.toothNotes = {};
            this.generalNotes = '';
            this.selectedTooth = null;
            this.hasChanges = true;
          }
        }
      ]
    });
    await alert.present();
  }

  async saveOdontogram() {
    const odontogramId = this.route.snapshot.paramMap.get('id');
    const patientId = this.route.snapshot.paramMap.get('patientId');

    // Convert tooth data to API format
    const teethPayload: { toothNumber: number; tooth: ToothUpdate }[] = [];
    this.teethData.forEach((tooth, num) => {
      if (tooth.status !== 'healthy' || this.toothNotes[num]) {
        teethPayload.push({
          toothNumber: num,
          tooth: {
            status: tooth.status,
            mesial: tooth.surfaces.mesial,
            distal: tooth.surfaces.distal,
            oclusal: tooth.surfaces.oclusal,
            vestibular: tooth.surfaces.vestibular,
            lingual: tooth.surfaces.lingual,
            notes: this.toothNotes[num]
          }
        });
      }
    });

    if (odontogramId) {
      // Update each modified tooth
      teethPayload.forEach(payload => {
        this.store.dispatch(OdontologyActions.updateTooth({
          odontogramId: +odontogramId,
          toothNumber: payload.toothNumber,
          tooth: payload.tooth
        }));
      });
    } else if (patientId) {
      // Create new odontogram
      this.store.dispatch(OdontologyActions.createOdontogram({
        odontogram: {
          patient_id: +patientId,
          notes: this.generalNotes
        }
      }));
    }

    const toast = await this.toastController.create({
      message: 'Odontograma guardado correctamente',
      duration: 2000,
      color: 'success'
    });
    await toast.present();
    this.hasChanges = false;
  }

  printOdontogram() {
    window.print();
  }

  getContrastColor(hexColor: string): string {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#233142' : '#ffffff';
  }
}
