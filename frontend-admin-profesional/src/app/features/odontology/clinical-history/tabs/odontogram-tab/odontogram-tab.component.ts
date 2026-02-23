import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSpinner,
  IonBadge,
  ToastController,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  printOutline,
  informationCircleOutline,
  eyeOutline,
  colorPaletteOutline,
  saveOutline
} from 'ionicons/icons';
import { OdontogramChartComponent } from '../../../components/odontogram-chart/odontogram-chart.component';
import { PERMANENT_TEETH, DECIDUOUS_TEETH, TOOTH_STATUS_COLORS, ToothStatus } from '../../../../../models/odontology.model';
import { OdontogramService, Odontogram, Tooth } from '../../../../../core/services/odontogram.service';
import { ToothImageData } from '../../../odontogram/tooth-image.component';

@Component({
  selector: 'app-odontogram-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonCard,
    IonCardContent,
    IonButton,
    IonIcon,
    IonSelect,
    IonSelectOption,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonSpinner,
    IonBadge,
    OdontogramChartComponent
  ],
  template: `
    <div class="odontogram-container">
      <!-- Header -->
      <div class="header-row">
        <!-- Dentition Type Tabs -->
        <ion-segment [(ngModel)]="dentitionType" class="dentition-segment">
          <ion-segment-button value="permanent">
            <ion-label>Permanente</ion-label>
          </ion-segment-button>
          <ion-segment-button value="temporary">
            <ion-label>Temporal</ion-label>
          </ion-segment-button>
        </ion-segment>

        <!-- Version Selector -->
        <ion-select [(ngModel)]="selectedVersion" interface="popover" class="version-select">
          @for (version of versions; track version.value) {
            <ion-select-option [value]="version.value">{{ version.label }}</ion-select-option>
          }
        </ion-select>

        <!-- Action Buttons -->
        <div class="header-actions">
          <ion-button fill="clear" class="icon-btn">
            <ion-icon slot="icon-only" name="color-palette-outline"></ion-icon>
          </ion-button>
          <ion-button color="tertiary" fill="outline">
            <ion-icon slot="start" name="information-circle-outline"></ion-icon>
            Diagnóstico
          </ion-button>
          <ion-button fill="outline">
            <ion-icon slot="start" name="information-circle-outline"></ion-icon>
            Información
          </ion-button>
          <ion-button fill="outline">
            <ion-icon slot="start" name="eye-outline"></ion-icon>
            Ver sólo diagnóstico
          </ion-button>
          <ion-button fill="clear" (click)="print()">
            <ion-icon slot="icon-only" name="print-outline"></ion-icon>
          </ion-button>
        </div>
      </div>

      <!-- Odontogram Title -->
      <h3 class="odontogram-title">Odontograma Internacional FDI</h3>

      @if (loading) {
        <div class="ion-text-center ion-padding">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Cargando odontograma...</p>
        </div>
      } @else {
        <!-- Odontogram Chart -->
        <div class="odontogram-wrapper">
          <app-odontogram-chart
            [teethData]="teethData"
            [readOnly]="false"
            (toothClick)="onToothClick($event)">
          </app-odontogram-chart>
        </div>

        <!-- Sextants and Arcs -->
        <div class="sextants-section">
          <div class="sextants-grid">
            @for (sextant of sextants; track sextant.id) {
              <div class="sextant-item" (click)="selectSextant(sextant.id)">
                <div class="sextant-icon">{{ sextant.icon }}</div>
                <span class="sextant-label">{{ sextant.label }}</span>
              </div>
            }
            <div class="sextant-item arc" (click)="selectArc('superior')">
              <div class="arc-icon">⌒</div>
              <span class="sextant-label">Arcada Superior</span>
            </div>
            <div class="sextant-item arc" (click)="selectArc('inferior')">
              <div class="arc-icon">⌓</div>
              <span class="sextant-label">Arcada Inferior</span>
            </div>
          </div>
        </div>

        <!-- Legend -->
        <div class="legend-section">
          <div class="legend-title">Arcadas y Sextantes</div>
          <div class="legend-colors">
            @for (status of statusList; track status.key) {
              <div class="legend-item">
                <span class="color-dot" [style.background-color]="status.color"></span>
                <span class="legend-label">{{ status.label }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Treatments Table -->
        <ion-card class="treatments-table-card">
          <ion-card-content>
            <table class="treatments-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Pieza</th>
                  <th>Caras</th>
                  <th>Estado</th>
                  <th>Creador</th>
                  <th>Anular</th>
                </tr>
              </thead>
              <tbody>
                @if (toothTreatments.length === 0) {
                  <tr>
                    <td colspan="6" class="empty-table">No hay tratamientos registrados</td>
                  </tr>
                } @else {
                  @for (treatment of toothTreatments; track treatment.id) {
                    <tr>
                      <td>{{ treatment.date | date:'dd/MM/yyyy' }}</td>
                      <td>{{ treatment.tooth }}</td>
                      <td>{{ treatment.surfaces }}</td>
                      <td>
                        <ion-badge [color]="treatment.status === 'completed' ? 'success' : 'warning'">
                          {{ treatment.status }}
                        </ion-badge>
                      </td>
                      <td>{{ treatment.creator }}</td>
                      <td>
                        <ion-button fill="clear" size="small" color="danger">
                          Anular
                        </ion-button>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </ion-card-content>
        </ion-card>
      }
    </div>
  `,
  styles: [`
    .odontogram-container {
      padding: 16px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }

    .dentition-segment {
      max-width: 250px;
    }

    .version-select {
      min-width: 200px;
      --background: var(--ion-color-light);
      --padding-start: 12px;
      --padding-end: 12px;
      border-radius: 8px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: auto;
    }

    .icon-btn {
      --padding-start: 8px;
      --padding-end: 8px;
    }

    .odontogram-title {
      text-align: center;
      font-size: 16px;
      font-weight: 400;
      color: var(--ion-color-medium);
      margin: 16px 0;
    }

    .odontogram-wrapper {
      background: white;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      overflow-x: auto;
    }

    .sextants-section {
      margin: 24px 0;
    }

    .sextants-grid {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px;
    }

    .sextant-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px 16px;
      border: 1px solid var(--ion-color-light-shade);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .sextant-item:hover {
      background: var(--ion-color-light);
      border-color: var(--ion-color-primary);
    }

    .sextant-icon, .arc-icon {
      font-size: 24px;
      margin-bottom: 4px;
    }

    .sextant-label {
      font-size: 12px;
      color: var(--ion-color-medium);
    }

    .legend-section {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: var(--ion-color-light);
      border-radius: 8px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .legend-title {
      font-weight: 500;
      color: var(--ion-color-primary);
    }

    .legend-colors {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .color-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .legend-label {
      font-size: 12px;
      color: var(--ion-color-medium);
    }

    .treatments-table-card {
      margin: 0;
    }

    .treatments-table {
      width: 100%;
      border-collapse: collapse;
    }

    .treatments-table th,
    .treatments-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid var(--ion-color-light-shade);
    }

    .treatments-table th {
      background: var(--ion-color-light);
      font-weight: 500;
      font-size: 13px;
      color: var(--ion-color-medium);
    }

    .treatments-table td {
      font-size: 14px;
    }

    .empty-table {
      text-align: center;
      color: var(--ion-color-medium);
      padding: 24px !important;
    }

    @media (max-width: 768px) {
      .header-row {
        flex-direction: column;
        align-items: flex-start;
      }

      .header-actions {
        width: 100%;
        overflow-x: auto;
        margin-left: 0;
      }

      .dentition-segment {
        max-width: 100%;
        width: 100%;
      }
    }
  `]
})
export class OdontogramTabComponent implements OnInit, OnChanges {
  @Input() patientId!: number;

  private odontogramService = inject(OdontogramService);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);

  loading = false;
  saving = false;
  dentitionType = 'permanent';
  selectedVersion = '';
  teethData = new Map<number, ToothImageData>();

  odontogram: Odontogram | null = null;
  versions: { value: string; label: string }[] = [];

  sextants = [
    { id: 1, icon: '⟍', label: 'Sextante 1' },
    { id: 2, icon: '∨', label: 'Sextante 2' },
    { id: 3, icon: '⟋', label: 'Sextante 3' },
    { id: 4, icon: '⊐', label: 'Sextante 4' },
    { id: 5, icon: '∧', label: 'Sextante 5' },
    { id: 6, icon: '⌐', label: 'Sextante 6' }
  ];

  statusList: { key: ToothStatus; label: string; color: string }[] = [];

  toothTreatments: any[] = [];

  constructor() {
    addIcons({
      printOutline,
      informationCircleOutline,
      eyeOutline,
      colorPaletteOutline,
      saveOutline
    });

    // Build status list from colors
    this.statusList = Object.entries(TOOTH_STATUS_COLORS).map(([key, color]) => ({
      key: key as ToothStatus,
      label: this.getStatusLabel(key as ToothStatus),
      color
    }));
  }

  ngOnInit(): void {
    this.loadOdontogram();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patientId'] && !changes['patientId'].firstChange) {
      this.loadOdontogram();
    }
  }

  loadOdontogram(): void {
    if (!this.patientId) return;

    this.loading = true;
    this.odontogramService.getPatientOdontogram(this.patientId).subscribe({
      next: (odontogram) => {
        this.odontogram = odontogram;
        this.applyTeethData(odontogram.teeth || []);
        this.selectedVersion = odontogram.created_at
          ? new Date(odontogram.created_at).toLocaleDateString('es-ES')
          : 'Actual';
        this.versions = [{ value: this.selectedVersion, label: `Ver. ${this.selectedVersion} Odontograma` }];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading odontogram:', error);
        // If no odontogram exists, create one
        if (error.status === 404) {
          this.createNewOdontogram();
        } else {
          this.loading = false;
          this.showToast('Error al cargar odontograma', 'danger');
        }
      }
    });
  }

  private createNewOdontogram(): void {
    this.odontogramService.createOdontogram({
      patient_id: this.patientId,
      is_active: true
    }).subscribe({
      next: (odontogram) => {
        this.odontogram = odontogram;
        this.teethData = new Map();
        this.selectedVersion = 'Nuevo';
        this.versions = [{ value: this.selectedVersion, label: `Ver. ${this.selectedVersion} Odontograma` }];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error creating odontogram:', error);
        this.loading = false;
        this.showToast('Error al crear odontograma', 'danger');
      }
    });
  }

  private applyTeethData(teeth: Tooth[]): void {
    this.teethData = new Map();
    teeth.forEach(tooth => {
      this.teethData.set(tooth.tooth_number, {
        number: tooth.tooth_number,
        status: tooth.status,
        surfaces: {
          mesial: tooth.mesial as any,
          distal: tooth.distal as any,
          oclusal: tooth.oclusal as any,
          vestibular: tooth.vestibular as any,
          lingual: tooth.lingual as any
        },
        notes: tooth.notes
      });
    });
  }

  async onToothClick(tooth: ToothImageData): Promise<void> {
    if (!this.odontogram) return;

    const alert = await this.alertController.create({
      header: `Diente ${tooth.number}`,
      subHeader: 'Seleccione el estado',
      inputs: this.statusList.map(status => ({
        type: 'radio',
        label: status.label,
        value: status.key,
        checked: tooth.status === status.key
      })),
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (selectedStatus: ToothStatus) => {
            if (selectedStatus) {
              this.saveToothStatus(tooth.number, selectedStatus);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  private saveToothStatus(toothNumber: number, status: ToothStatus): void {
    if (!this.odontogram) return;

    this.odontogramService.saveTooth(this.odontogram.id!, {
      tooth_number: toothNumber,
      tooth_type: this.dentitionType === 'permanent' ? 'permanent' : 'deciduous',
      status
    }).subscribe({
      next: (tooth) => {
        // Update local data
        this.teethData.set(toothNumber, {
          number: toothNumber,
          status: tooth.status
        });
        // Force Map update for change detection
        this.teethData = new Map(this.teethData);
        this.showToast(`Diente ${toothNumber} actualizado`, 'success');
      },
      error: (error) => {
        console.error('Error saving tooth:', error);
        this.showToast('Error al guardar diente', 'danger');
      }
    });
  }

  selectSextant(id: number): void {
    // Define teeth in each sextant
    const sextantTeeth: Record<number, number[]> = {
      1: [18, 17, 16, 15, 14], // Upper right
      2: [13, 12, 11, 21, 22, 23], // Upper front
      3: [24, 25, 26, 27, 28], // Upper left
      4: [34, 35, 36, 37, 38], // Lower left
      5: [33, 32, 31, 41, 42, 43], // Lower front
      6: [44, 45, 46, 47, 48]  // Lower right
    };

    console.log(`Sextant ${id} selected, teeth:`, sextantTeeth[id]);
    // Could highlight or select these teeth
  }

  selectArc(arc: string): void {
    console.log('Arc selected:', arc);
    // Could highlight entire upper or lower arch
  }

  print(): void {
    window.print();
  }

  private getStatusLabel(status: ToothStatus): string {
    const labels: Record<ToothStatus, string> = {
      healthy: 'Sano',
      caries: 'Caries',
      filled: 'Obturado',
      crown: 'Corona',
      implant: 'Implante',
      missing: 'Ausente',
      root_canal: 'Endodoncia',
      fractured: 'Fracturado',
      mobile: 'Móvil',
      to_extract: 'Para extraer',
      extracted: 'Extraído'
    };
    return labels[status] || status;
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
