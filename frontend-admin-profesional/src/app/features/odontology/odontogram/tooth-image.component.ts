import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToothStatus, SurfaceCondition, TOOTH_STATUS_COLORS } from '../../../models/odontology.model';

export interface ToothImageData {
  number: number;
  status: ToothStatus;
  notes?: string;
  surfaces?: {
    mesial?: SurfaceCondition;
    distal?: SurfaceCondition;
    oclusal?: SurfaceCondition;
    vestibular?: SurfaceCondition;
    lingual?: SurfaceCondition;
  };
}

type ToothType = 'incisor' | 'canine' | 'premolar' | 'molar';

@Component({
  selector: 'app-tooth-image',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="tooth-container"
      [class.selected]="selected"
      [class.missing]="tooth.status === 'missing' || tooth.status === 'extracted'"
      [class.upper]="isUpperTooth"
      [class.lower]="!isUpperTooth"
      (click)="onToothClick()"
    >
      <!-- Tooth number (top for lower, bottom for upper) -->
      @if (!isUpperTooth) {
        <span class="tooth-number top">{{ tooth.number }}</span>
      }

      <!-- Tooth image container -->
      <div class="tooth-image-wrapper" [style.background-color]="getStatusColor()">
        <img
          [src]="getToothImage()"
          [alt]="'Diente ' + tooth.number"
          class="tooth-image"
          [class.flipped]="!isUpperTooth"
        />

        <!-- Status overlay icons -->
        @if (tooth.status === 'missing' || tooth.status === 'extracted') {
          <div class="status-overlay missing-x">
            <span>X</span>
          </div>
        }

        @if (tooth.status === 'crown') {
          <div class="status-overlay crown-indicator">
            <span class="crown-ring"></span>
          </div>
        }

        @if (tooth.status === 'implant') {
          <div class="status-overlay implant-indicator">
            <span class="implant-screw"></span>
          </div>
        }

        @if (tooth.status === 'root_canal') {
          <div class="status-overlay root-canal-indicator">
            <span class="root-line"></span>
          </div>
        }

        @if (tooth.status === 'to_extract') {
          <div class="status-overlay to-extract-indicator">
            <span>EXT</span>
          </div>
        }
      </div>

      <!-- Tooth number (bottom for upper) -->
      @if (isUpperTooth) {
        <span class="tooth-number bottom">{{ tooth.number }}</span>
      }

      <!-- Status indicator dot -->
      <div
        class="status-dot"
        [style.background-color]="TOOTH_STATUS_COLORS[tooth.status]"
        [title]="getStatusLabel()"
      ></div>
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
    }

    .tooth-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      padding: 4px;
      border-radius: 8px;
      transition: all 0.2s ease;
      position: relative;
      min-width: 50px;

      &:hover {
        background-color: rgba(var(--ion-color-primary-rgb), 0.1);
        transform: scale(1.05);
      }

      &.selected {
        background-color: rgba(var(--ion-color-primary-rgb), 0.2);
        box-shadow: 0 0 8px var(--ion-color-primary);
      }

      &.missing {
        opacity: 0.5;
      }
    }

    .tooth-number {
      font-size: 11px;
      font-weight: bold;
      color: var(--ion-color-dark);

      &.top {
        margin-bottom: 2px;
      }

      &.bottom {
        margin-top: 2px;
      }
    }

    .tooth-image-wrapper {
      position: relative;
      width: 40px;
      height: 55px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      padding: 2px;
      transition: background-color 0.3s;
    }

    .tooth-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
      filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.2));
      transition: transform 0.2s;

      &.flipped {
        transform: scaleY(-1);
      }
    }

    .status-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }

    .missing-x span {
      font-size: 32px;
      font-weight: bold;
      color: #F44336;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
    }

    .crown-indicator .crown-ring {
      width: 30px;
      height: 30px;
      border: 3px dashed #9C27B0;
      border-radius: 50%;
    }

    .implant-indicator .implant-screw {
      width: 8px;
      height: 25px;
      background: linear-gradient(180deg, #FF9800 0%, #E65100 100%);
      border-radius: 2px;
      position: relative;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 12px;
        height: 4px;
        background: #E65100;
        border-radius: 2px;
      }
    }

    .root-canal-indicator .root-line {
      width: 3px;
      height: 30px;
      background: #795548;
      border-radius: 1px;
    }

    .to-extract-indicator span {
      font-size: 10px;
      font-weight: bold;
      color: white;
      background: #FF5722;
      padding: 2px 4px;
      border-radius: 4px;
    }

    .status-dot {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      border: 1px solid white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
  `]
})
export class ToothImageComponent {
  @Input() tooth!: ToothImageData;
  @Input() selected = false;
  @Input() isUpperTooth = true;

  @Output() toothClick = new EventEmitter<ToothImageData>();

  TOOTH_STATUS_COLORS = TOOTH_STATUS_COLORS;

  private toothTypeMap: Record<number, ToothType> = {
    1: 'incisor',
    2: 'incisor',
    3: 'canine',
    4: 'premolar',
    5: 'premolar',
    6: 'molar',
    7: 'molar',
    8: 'molar'
  };

  getToothType(): ToothType {
    const position = this.tooth.number % 10;
    return this.toothTypeMap[position] || 'molar';
  }

  getToothImage(): string {
    const type = this.getToothType();
    return `assets/teeth/${type}.svg`;
  }

  getStatusColor(): string {
    if (this.tooth.status === 'healthy') {
      return 'transparent';
    }
    // Return lighter version of status color for background
    const color = TOOTH_STATUS_COLORS[this.tooth.status];
    return color ? `${color}20` : 'transparent'; // 20 = 12.5% opacity in hex
  }

  getStatusLabel(): string {
    const labels: Record<ToothStatus, string> = {
      healthy: 'Sano',
      caries: 'Caries',
      filled: 'Obturado',
      crown: 'Corona',
      implant: 'Implante',
      missing: 'Ausente',
      root_canal: 'Endodoncia',
      fractured: 'Fracturado',
      mobile: 'Movilidad',
      to_extract: 'A Extraer',
      extracted: 'Extraído'
    };
    return labels[this.tooth.status] || this.tooth.status;
  }

  onToothClick(): void {
    this.toothClick.emit(this.tooth);
  }
}
