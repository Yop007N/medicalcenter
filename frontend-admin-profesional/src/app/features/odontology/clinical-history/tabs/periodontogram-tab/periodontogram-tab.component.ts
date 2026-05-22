import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonSpinner,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { saveOutline, printOutline, refreshOutline } from 'ionicons/icons';
import { PERMANENT_TEETH, PeriodontalRecord, PeriodontalToothRecord } from '../../../../../models/odontology.model';
import { ClinicalHistoryService } from '../../../../../core/services/clinical-history.service';

@Component({
  selector: 'app-periodontogram-tab',
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
    IonSpinner,
  ],
  template: `
    <div class="periodontogram-container">
      <!-- Header -->
      <div class="header-row">
        <h2 class="section-title">Periodontograma</h2>
        <div class="header-actions">
          <span class="version-info">
            Versión del {{ selectedDate }} por Dr.(a) {{ selectedProfessional }}
          </span>
          <ion-button aria-label="Imprimir" fill="clear" (click)="print()">
            <ion-icon slot="icon-only" name="print-outline"></ion-icon>
          </ion-button>
          <ion-button color="success" (click)="save()">
            <ion-icon slot="start" name="save-outline"></ion-icon>
            Guardar
          </ion-button>
        </div>
      </div>

      @if (loading) {
        <div class="ion-text-center ion-padding">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Cargando periodontograma...</p>
        </div>
      } @else {
        <!-- Maxilar Superior -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Maxilar superior</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="perio-table-wrapper">
              <table class="perio-table">
                <thead>
                  <tr>
                    <th class="row-header"># Pieza</th>
                    @for (tooth of upperTeeth; track tooth) {
                      <th colspan="3">{{ tooth }}</th>
                    }
                  </tr>
                </thead>
                <tbody>
                  <!-- Profundidad Surco -->
                  <tr class="data-row">
                    <td class="row-header primary">Profundidad Surco</td>
                    @for (tooth of upperTeeth; track tooth) {
                      @for (i of [0, 1, 2]; track i) {
                        <td>
                          <input type="number" min="0" max="15"
                            [(ngModel)]="probingDepth[tooth][i]"
                            class="perio-input">
                        </td>
                      }
                    }
                  </tr>
                  <!-- Margen -->
                  <tr class="data-row">
                    <td class="row-header danger">Margen</td>
                    @for (tooth of upperTeeth; track tooth) {
                      @for (i of [0, 1, 2]; track i) {
                        <td>
                          <input type="number" min="-10" max="10"
                            [(ngModel)]="margin[tooth][i]"
                            class="perio-input">
                        </td>
                      }
                    }
                  </tr>
                  <!-- NIC -->
                  <tr class="data-row">
                    <td class="row-header">NIC</td>
                    @for (tooth of upperTeeth; track tooth) {
                      @for (i of [0, 1, 2]; track i) {
                        <td>
                          <input type="number" min="0" max="20"
                            [(ngModel)]="nic[tooth][i]"
                            class="perio-input" readonly>
                        </td>
                      }
                    }
                  </tr>
                  <!-- Furca -->
                  <tr class="data-row">
                    <td class="row-header">Furca</td>
                    @for (tooth of upperTeeth; track tooth) {
                      <td colspan="3">
                        <select [(ngModel)]="furcation[tooth]" class="perio-select">
                          <option value=""></option>
                          <option value="I">I</option>
                          <option value="II">II</option>
                          <option value="III">III</option>
                        </select>
                      </td>
                    }
                  </tr>
                  <!-- Exudado -->
                  <tr class="data-row">
                    <td class="row-header warning">Exudado</td>
                    @for (tooth of upperTeeth; track tooth) {
                      <td colspan="3">
                        <input type="checkbox" [(ngModel)]="exudate[tooth]" class="perio-checkbox">
                      </td>
                    }
                  </tr>
                  <!-- Sangramiento -->
                  <tr class="data-row">
                    <td class="row-header danger">Sangramiento</td>
                    @for (tooth of upperTeeth; track tooth) {
                      <td colspan="3">
                        <input type="checkbox" [(ngModel)]="bleeding[tooth]" class="perio-checkbox">
                      </td>
                    }
                  </tr>
                  <!-- Movilidad -->
                  <tr class="data-row">
                    <td class="row-header">Movilidad</td>
                    @for (tooth of upperTeeth; track tooth) {
                      <td colspan="3">
                        <input type="number" min="0" max="3"
                          [(ngModel)]="mobility[tooth]"
                          class="perio-input-sm">
                      </td>
                    }
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Tooth Visualization -->
            <div class="teeth-visualization">
              <div class="teeth-row">
                <span class="side-label">Vestibular</span>
                <div class="teeth-svg-container">
                  @for (tooth of upperTeeth; track tooth) {
                    <div class="tooth-visual" [class.selected]="selectedTooth === tooth" (click)="selectTooth(tooth)">
                      <svg viewBox="0 0 30 80" class="tooth-svg">
                        <!-- Tooth body -->
                        <path d="M5,10 L25,10 L25,50 C25,65 5,65 5,50 Z"
                          [attr.fill]="getToothFill(tooth)" stroke="currentColor" stroke-width="1.5"/>
                        <!-- Root -->
                        <path d="M10,50 L10,75 L20,75 L20,50"
                          fill="none" stroke="currentColor" stroke-width="1"/>
                        <!-- Periodontal pocket visualization -->
                        <polyline
                          [attr.points]="getPerioLine(tooth, 'upper')"
                          fill="none"
                          [attr.stroke]="getPerioColor(tooth, 'upper')"
                          stroke-width="2"/>
                        <!-- Bleeding indicator -->
                        @if (bleeding[tooth]) {
                          <circle cx="15" cy="5" r="3" fill="var(--ion-color-danger)"/>
                        }
                        <!-- Mobility indicator -->
                        @if (mobility[tooth] > 0) {
                          <text x="15" y="78" text-anchor="middle" font-size="8" fill="var(--ion-color-warning)">
                            M{{ mobility[tooth] }}
                          </text>
                        }
                      </svg>
                      <span class="tooth-number">{{ tooth }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Maxilar Inferior -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Maxilar inferior</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="perio-table-wrapper">
              <table class="perio-table">
                <thead>
                  <tr>
                    <th class="row-header"># Pieza</th>
                    @for (tooth of lowerTeeth; track tooth) {
                      <th colspan="3">{{ tooth }}</th>
                    }
                  </tr>
                </thead>
                <tbody>
                  <!-- Same structure as upper -->
                  <tr class="data-row">
                    <td class="row-header primary">Profundidad Surco</td>
                    @for (tooth of lowerTeeth; track tooth) {
                      @for (i of [0, 1, 2]; track i) {
                        <td>
                          <input type="number" min="0" max="15"
                            [(ngModel)]="probingDepthLower[tooth][i]"
                            class="perio-input">
                        </td>
                      }
                    }
                  </tr>
                  <tr class="data-row">
                    <td class="row-header danger">Margen</td>
                    @for (tooth of lowerTeeth; track tooth) {
                      @for (i of [0, 1, 2]; track i) {
                        <td>
                          <input type="number" min="-10" max="10"
                            [(ngModel)]="marginLower[tooth][i]"
                            class="perio-input">
                        </td>
                      }
                    }
                  </tr>
                  <tr class="data-row">
                    <td class="row-header">NIC</td>
                    @for (tooth of lowerTeeth; track tooth) {
                      @for (i of [0, 1, 2]; track i) {
                        <td>
                          <input type="number" min="0" max="20"
                            [(ngModel)]="nicLower[tooth][i]"
                            class="perio-input" readonly>
                        </td>
                      }
                    }
                  </tr>
                  <tr class="data-row">
                    <td class="row-header">Movilidad</td>
                    @for (tooth of lowerTeeth; track tooth) {
                      <td colspan="3">
                        <input type="number" min="0" max="3"
                          [(ngModel)]="mobilityLower[tooth]"
                          class="perio-input-sm">
                      </td>
                    }
                  </tr>
                </tbody>
              </table>
            </div>
          </ion-card-content>
        </ion-card>
      }
    </div>
  `,
  styles: [`
    .periodontogram-container {
      padding: 16px;
      max-width: 100%;
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
      gap: 12px;
    }

    .version-info {
      font-size: 14px;
      color: var(--ion-color-medium);
    }

    .perio-table-wrapper {
      overflow-x: auto;
      margin-bottom: 16px;
    }

    .perio-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }

    .perio-table th,
    .perio-table td {
      padding: 4px 2px;
      text-align: center;
      border: 1px solid var(--ion-color-light-shade);
      min-width: 20px;
    }

    .perio-table th {
      background: var(--ion-color-light);
      font-weight: 500;
      font-size: 11px;
    }

    .row-header {
      text-align: left !important;
      padding-left: 8px !important;
      min-width: 120px !important;
      font-weight: 500;
      background: var(--ion-color-light);
    }

    .row-header.primary {
      color: var(--ion-color-primary);
    }

    .row-header.danger {
      color: var(--ion-color-danger);
    }

    .row-header.warning {
      color: var(--ion-color-warning-shade);
    }

    .perio-input {
      width: 24px;
      height: 24px;
      text-align: center;
      border: 1px solid var(--ion-color-light-shade);
      border-radius: 4px;
      font-size: 11px;
      padding: 0;
    }

    .perio-input:focus {
      outline: none;
      border-color: var(--ion-color-primary);
    }

    .perio-input-sm {
      width: 32px;
      height: 24px;
      text-align: center;
      border: 1px solid var(--ion-color-light-shade);
      border-radius: 4px;
      font-size: 11px;
    }

    .perio-select {
      width: 40px;
      height: 24px;
      font-size: 11px;
      border: 1px solid var(--ion-color-light-shade);
      border-radius: 4px;
      text-align: center;
    }

    .perio-checkbox {
      width: 16px;
      height: 16px;
    }

    .teeth-visualization {
      margin-top: 16px;
      padding: 16px 0;
      border-top: 1px solid var(--ion-color-light-shade);
    }

    .teeth-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    .side-label {
      font-size: 12px;
      color: var(--ion-color-medium);
      writing-mode: vertical-rl;
      text-orientation: mixed;
      transform: rotate(180deg);
      min-width: 20px;
    }

    .teeth-svg-container {
      display: flex;
      gap: 2px;
      overflow-x: auto;
      padding: 8px 0;
    }

    .tooth-visual {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      transition: transform 0.2s;
      min-width: 32px;
    }

    .tooth-visual:hover {
      transform: scale(1.1);
    }

    .tooth-visual.selected {
      background: rgba(var(--ion-color-primary-rgb), 0.1);
      border-radius: 4px;
    }

    .tooth-svg {
      width: 30px;
      height: 80px;
      color: var(--ion-text-color);
    }

    .tooth-number {
      font-size: 10px;
      color: var(--ion-color-medium);
      margin-top: 2px;
    }

    @media (max-width: 768px) {
      .header-row {
        flex-direction: column;
        align-items: flex-start;
      }

      .perio-table {
        font-size: 10px;
      }

      .perio-input {
        width: 20px;
        height: 20px;
      }
    }
  `]
})
export class PeriodontogramTabComponent implements OnInit, OnChanges {
  @Input() patientId!: number;

  private clinicalHistoryService = inject(ClinicalHistoryService);
  private toastController = inject(ToastController);

  loading = false;
  saving = false;
  selectedDate = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  selectedProfessional = '';
  selectedTooth: number | null = null;

  // Upper teeth (right to left as viewed)
  upperTeeth = [...PERMANENT_TEETH.upperRight, ...PERMANENT_TEETH.upperLeft];
  // Lower teeth
  lowerTeeth = [...PERMANENT_TEETH.lowerRight, ...PERMANENT_TEETH.lowerLeft];

  // Data structures for upper arch
  probingDepth: Record<number, [number, number, number]> = {};
  margin: Record<number, [number, number, number]> = {};
  nic: Record<number, [number, number, number]> = {};
  furcation: Record<number, string> = {};
  exudate: Record<number, boolean> = {};
  bleeding: Record<number, boolean> = {};
  mobility: Record<number, number> = {};

  // Data structures for lower arch
  probingDepthLower: Record<number, [number, number, number]> = {};
  marginLower: Record<number, [number, number, number]> = {};
  nicLower: Record<number, [number, number, number]> = {};
  mobilityLower: Record<number, number> = {};

  constructor() {
    addIcons({ saveOutline, printOutline, refreshOutline });
    this.initializeData();
  }

  ngOnInit(): void {
    this.loadPeriodontogram();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patientId'] && !changes['patientId'].firstChange) {
      this.loadPeriodontogram();
    }
  }

  initializeData(): void {
    // Initialize upper teeth data
    this.upperTeeth.forEach(tooth => {
      this.probingDepth[tooth] = [0, 0, 0];
      this.margin[tooth] = [0, 0, 0];
      this.nic[tooth] = [0, 0, 0];
      this.furcation[tooth] = '';
      this.exudate[tooth] = false;
      this.bleeding[tooth] = false;
      this.mobility[tooth] = 0;
    });

    // Initialize lower teeth data
    this.lowerTeeth.forEach(tooth => {
      this.probingDepthLower[tooth] = [0, 0, 0];
      this.marginLower[tooth] = [0, 0, 0];
      this.nicLower[tooth] = [0, 0, 0];
      this.mobilityLower[tooth] = 0;
    });
  }

  loadPeriodontogram(): void {
    if (!this.patientId) return;

    this.loading = true;
    this.clinicalHistoryService.getPeriodontalRecords(this.patientId).subscribe({
      next: (records) => {
        this.applyRecordsToData(records);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading periodontogram:', error);
        this.loading = false;
      }
    });
  }

  private applyRecordsToData(records: PeriodontalRecord[]): void {
    // Get the most recent record
    if (records.length === 0) return;

    const latestRecord = records[0]; // Assuming sorted by date desc
    if (latestRecord.professional) {
      this.selectedProfessional = `${latestRecord.professional.first_name} ${latestRecord.professional.last_name}`;
    }

    // Apply teeth records
    latestRecord.teeth_records?.forEach((toothRecord: PeriodontalToothRecord) => {
      const tooth = toothRecord.tooth_number;
      const isUpper = this.upperTeeth.includes(tooth);

      if (isUpper) {
        if (toothRecord.probing_depth_vestibular) this.probingDepth[tooth] = toothRecord.probing_depth_vestibular;
        if (toothRecord.margin_vestibular) this.margin[tooth] = toothRecord.margin_vestibular;
        if (toothRecord.nic_vestibular) this.nic[tooth] = toothRecord.nic_vestibular;
        if (toothRecord.furcation !== undefined) this.furcation[tooth] = toothRecord.furcation?.toString() || '';
        if (toothRecord.bleeding !== undefined) this.bleeding[tooth] = toothRecord.bleeding;
        if (toothRecord.suppuration !== undefined) this.exudate[tooth] = toothRecord.suppuration;
        if (toothRecord.mobility !== undefined) this.mobility[tooth] = toothRecord.mobility;
      } else {
        if (toothRecord.probing_depth_vestibular) this.probingDepthLower[tooth] = toothRecord.probing_depth_vestibular;
        if (toothRecord.margin_vestibular) this.marginLower[tooth] = toothRecord.margin_vestibular;
        if (toothRecord.nic_vestibular) this.nicLower[tooth] = toothRecord.nic_vestibular;
        if (toothRecord.mobility !== undefined) this.mobilityLower[tooth] = toothRecord.mobility;
      }
    });
  }

  selectTooth(tooth: number): void {
    this.selectedTooth = this.selectedTooth === tooth ? null : tooth;
  }

  getToothFill(tooth: number): string {
    const isUpper = this.upperTeeth.includes(tooth);
    const depth = isUpper ? this.probingDepth[tooth] : this.probingDepthLower[tooth];
    const maxDepth = Math.max(...depth);

    if (maxDepth >= 6) return 'rgba(var(--ion-color-danger-rgb), 0.3)';
    if (maxDepth >= 4) return 'rgba(var(--ion-color-warning-rgb), 0.3)';
    return 'rgba(var(--ion-color-success-rgb), 0.1)';
  }

  getPerioLine(tooth: number, arch: 'upper' | 'lower'): string {
    const depth = arch === 'upper' ? this.probingDepth[tooth] : this.probingDepthLower[tooth];
    // Convert depth values to Y coordinates (0-15mm scale, mapped to 10-50 in SVG)
    const scale = (val: number) => 10 + (val / 15) * 40;
    return `5,${scale(depth[0])} 15,${scale(depth[1])} 25,${scale(depth[2])}`;
  }

  getPerioColor(tooth: number, arch: 'upper' | 'lower'): string {
    const depth = arch === 'upper' ? this.probingDepth[tooth] : this.probingDepthLower[tooth];
    const maxDepth = Math.max(...depth);

    if (maxDepth >= 6) return 'var(--ion-color-danger)';
    if (maxDepth >= 4) return 'var(--ion-color-warning)';
    return 'var(--ion-color-success)';
  }

  calculateNIC(): void {
    // NIC = Probing Depth + Margin (when margin is negative/recession)
    this.upperTeeth.forEach(tooth => {
      for (let i = 0; i < 3; i++) {
        this.nic[tooth][i] = this.probingDepth[tooth][i] + Math.abs(this.margin[tooth][i]);
      }
    });
    this.lowerTeeth.forEach(tooth => {
      for (let i = 0; i < 3; i++) {
        this.nicLower[tooth][i] = this.probingDepthLower[tooth][i] + Math.abs(this.marginLower[tooth][i]);
      }
    });
  }

  onValueChange(): void {
    this.calculateNIC();
  }

  save(): void {
    if (!this.patientId) return;

    this.saving = true;
    const teethRecords: PeriodontalToothRecord[] = [];

    // Prepare upper teeth records
    this.upperTeeth.forEach(tooth => {
      teethRecords.push({
        tooth_number: tooth,
        probing_depth_vestibular: this.probingDepth[tooth],
        margin_vestibular: this.margin[tooth],
        nic_vestibular: this.nic[tooth],
        probing_depth_lingual: [0, 0, 0],
        margin_lingual: [0, 0, 0],
        nic_lingual: [0, 0, 0],
        bleeding: this.bleeding[tooth],
        suppuration: this.exudate[tooth],
        furcation: this.furcation[tooth] ? parseInt(this.furcation[tooth]) : undefined,
        mobility: this.mobility[tooth]
      });
    });

    // Prepare lower teeth records
    this.lowerTeeth.forEach(tooth => {
      teethRecords.push({
        tooth_number: tooth,
        probing_depth_vestibular: this.probingDepthLower[tooth],
        margin_vestibular: this.marginLower[tooth],
        nic_vestibular: this.nicLower[tooth],
        probing_depth_lingual: [0, 0, 0],
        margin_lingual: [0, 0, 0],
        nic_lingual: [0, 0, 0],
        mobility: this.mobilityLower[tooth]
      });
    });

    // Create a record for each tooth as Partial<PeriodontalRecord>
    const records: Partial<PeriodontalRecord>[] = [{
      patient_id: this.patientId,
      notes: '',
      teeth_records: teethRecords
    }];

    this.clinicalHistoryService.bulkSavePeriodontalRecords(this.patientId, records).subscribe({
      next: () => {
        this.saving = false;
        this.showToast('Periodontograma guardado exitosamente', 'success');
      },
      error: (error) => {
        console.error('Error saving periodontogram:', error);
        this.saving = false;
        this.showToast('Error al guardar periodontograma', 'danger');
      }
    });
  }

  print(): void {
    window.print();
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
