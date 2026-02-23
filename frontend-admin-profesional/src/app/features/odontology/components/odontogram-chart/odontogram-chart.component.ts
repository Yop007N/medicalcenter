import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToothImageData, ToothImageComponent } from '../../odontogram/tooth-image.component';
import { PERMANENT_TEETH, DECIDUOUS_TEETH } from '../../../../models/odontology.model';

type DentitionType = 'permanent' | 'deciduous' | 'mixed';

@Component({
    selector: 'app-odontogram-chart',
    standalone: true,
    imports: [CommonModule, ToothImageComponent],
    template: `
    <div class="odontogram-chart" [class.print-mode]="printMode">
      <!-- Upper Jaw -->
      <div class="jaw upper-jaw">
        <div class="jaw-label">MAXILAR SUPERIOR</div>

        <div class="arch">
          <!-- Upper Right Quadrant (18-11) -->
          <div class="quadrant right">
            <div class="quadrant-label">Q1 (Derecho)</div>
            <div class="teeth-row">
              @for (num of getQuadrantTeeth('upperRight'); track num) {
                <app-tooth-image
                  [tooth]="getToothData(num)"
                  [selected]="selectedToothNumber === num"
                  [isUpperTooth]="true"
                  (toothClick)="onToothClick($event)"
                ></app-tooth-image>
              }
            </div>
          </div>

          <!-- Center line -->
          <div class="center-line"></div>

          <!-- Upper Left Quadrant (21-28) -->
          <div class="quadrant left">
            <div class="quadrant-label">Q2 (Izquierdo)</div>
            <div class="teeth-row">
              @for (num of getQuadrantTeeth('upperLeft'); track num) {
                <app-tooth-image
                  [tooth]="getToothData(num)"
                  [selected]="selectedToothNumber === num"
                  [isUpperTooth]="true"
                  (toothClick)="onToothClick($event)"
                ></app-tooth-image>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Jaw Separator -->
      <div class="jaw-separator">
        <span class="separator-label">LÍNEA DE OCLUSIÓN</span>
      </div>

      <!-- Lower Jaw -->
      <div class="jaw lower-jaw">
        <div class="jaw-label">MAXILAR INFERIOR</div>

        <div class="arch">
          <!-- Lower Right Quadrant (48-41) -->
          <div class="quadrant right">
            <div class="quadrant-label">Q4 (Derecho)</div>
            <div class="teeth-row">
              @for (num of getQuadrantTeeth('lowerRight'); track num) {
                <app-tooth-image
                  [tooth]="getToothData(num)"
                  [selected]="selectedToothNumber === num"
                  [isUpperTooth]="false"
                  (toothClick)="onToothClick($event)"
                ></app-tooth-image>
              }
            </div>
          </div>

          <!-- Center line -->
          <div class="center-line"></div>

          <!-- Lower Left Quadrant (31-38) -->
          <div class="quadrant left">
            <div class="quadrant-label">Q3 (Izquierdo)</div>
            <div class="teeth-row">
              @for (num of getQuadrantTeeth('lowerLeft'); track num) {
                <app-tooth-image
                  [tooth]="getToothData(num)"
                  [selected]="selectedToothNumber === num"
                  [isUpperTooth]="false"
                  (toothClick)="onToothClick($event)"
                ></app-tooth-image>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .odontogram-chart {
      background: white;
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      margin-bottom: 16px;
      overflow-x: auto;

      &.print-mode {
        box-shadow: none;
        border: 2px solid #333;
      }
    }

    .jaw {
      margin-bottom: 8px;

      .jaw-label {
        text-align: center;
        font-weight: bold;
        font-size: 12px;
        color: var(--ion-color-medium);
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 8px;
      }
    }

    .arch {
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }

    .quadrant {
      .quadrant-label {
        text-align: center;
        font-size: 10px;
        color: var(--ion-color-medium);
        margin-bottom: 4px;
      }

      .teeth-row {
        display: flex;
        gap: 2px;
      }

      &.right .teeth-row {
        flex-direction: row-reverse;
      }
    }

    .center-line {
      width: 3px;
      background: linear-gradient(180deg, var(--ion-color-primary) 0%, var(--ion-color-primary-tint) 100%);
      margin: 0 8px;
      border-radius: 2px;
      min-height: 80px;
      align-self: stretch;
    }

    .jaw-separator {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 16px 0;

      .separator-label {
        background: var(--ion-color-light);
        padding: 4px 16px;
        border-radius: 20px;
        font-size: 10px;
        font-weight: 600;
        color: var(--ion-color-medium);
        text-transform: uppercase;
        letter-spacing: 1px;
      }
    }

    @media print {
      .odontogram-chart {
        box-shadow: none;
        border: 1px solid #000;
      }
    }

    @media (max-width: 600px) {
      .arch {
        flex-direction: column;
        align-items: center;
      }

      .center-line {
        width: 100%;
        height: 3px;
        min-height: auto;
        margin: 8px 0;
      }

      .quadrant.right .teeth-row,
      .quadrant.left .teeth-row {
        flex-direction: row;
      }
    }
  `]
})
export class OdontogramChartComponent {
    @Input() teethData: Map<number, ToothImageData> = new Map();
    @Input() dentitionType: DentitionType = 'permanent';
    @Input() selectedToothNumber: number | null = null;
    @Input() printMode = false;
    @Input() readOnly = false;

    @Output() toothClick = new EventEmitter<ToothImageData>();

    getQuadrantTeeth(quadrant: 'upperRight' | 'upperLeft' | 'lowerRight' | 'lowerLeft'): number[] {
        if (this.dentitionType === 'permanent') {
            return PERMANENT_TEETH[quadrant];
        } else {
            return DECIDUOUS_TEETH[quadrant];
        }
    }

    getToothData(toothNumber: number): ToothImageData {
        return this.teethData.get(toothNumber) || {
            number: toothNumber,
            status: 'healthy'
        };
    }

    onToothClick(tooth: ToothImageData) {
        if (!this.readOnly) {
            this.toothClick.emit(tooth);
        }
    }
}
