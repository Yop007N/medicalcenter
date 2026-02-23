import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToothStatus, SurfaceCondition, TOOTH_STATUS_COLORS } from '../../../models/odontology.model';

export interface ToothSurface {
  surface: 'mesial' | 'distal' | 'oclusal' | 'vestibular' | 'lingual';
  condition: SurfaceCondition;
}

export interface ToothData {
  number: number;
  status: ToothStatus;
  surfaces: {
    mesial?: SurfaceCondition;
    distal?: SurfaceCondition;
    oclusal?: SurfaceCondition;
    vestibular?: SurfaceCondition;
    lingual?: SurfaceCondition;
  };
}

type ToothShape = 'incisor' | 'canine' | 'premolar' | 'molar';

@Component({
  selector: 'app-tooth-svg',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg
      [attr.width]="width"
      [attr.height]="height"
      viewBox="0 0 60 80"
      class="tooth-svg"
      [class.selected]="selected"
      [class.missing]="tooth.status === 'missing' || tooth.status === 'extracted'"
    >
      <!-- Tooth outline based on type -->
      @switch (toothShape) {
        @case ('incisor') {
          <!-- Incisor shape -->
          <g class="tooth-body">
            <!-- Root -->
            <path
              [attr.d]="'M25,50 L20,75 Q30,80 40,75 L35,50 Z'"
              [attr.fill]="getRootColor()"
              stroke="#666"
              stroke-width="1"
            />
            <!-- Crown -->
            <rect
              x="15" y="5" width="30" height="45" rx="3"
              [attr.fill]="getCrownColor()"
              stroke="#333"
              stroke-width="1.5"
            />
            <!-- Surfaces -->
            <g class="surfaces">
              <!-- Mesial -->
              <rect
                x="15" y="15" width="8" height="25"
                [attr.fill]="getSurfaceColor('mesial')"
                class="surface"
                (click)="onSurfaceClick('mesial', $event)"
              />
              <!-- Distal -->
              <rect
                x="37" y="15" width="8" height="25"
                [attr.fill]="getSurfaceColor('distal')"
                class="surface"
                (click)="onSurfaceClick('distal', $event)"
              />
              <!-- Oclusal/Incisal -->
              <rect
                x="23" y="5" width="14" height="10"
                [attr.fill]="getSurfaceColor('oclusal')"
                class="surface"
                (click)="onSurfaceClick('oclusal', $event)"
              />
              <!-- Vestibular -->
              <rect
                x="23" y="15" width="14" height="12"
                [attr.fill]="getSurfaceColor('vestibular')"
                class="surface"
                (click)="onSurfaceClick('vestibular', $event)"
              />
              <!-- Lingual -->
              <rect
                x="23" y="28" width="14" height="12"
                [attr.fill]="getSurfaceColor('lingual')"
                class="surface"
                (click)="onSurfaceClick('lingual', $event)"
              />
            </g>
          </g>
        }
        @case ('canine') {
          <!-- Canine shape -->
          <g class="tooth-body">
            <!-- Root (longer) -->
            <path
              [attr.d]="'M25,48 L22,78 Q30,82 38,78 L35,48 Z'"
              [attr.fill]="getRootColor()"
              stroke="#666"
              stroke-width="1"
            />
            <!-- Crown (pointed) -->
            <path
              [attr.d]="'M15,48 L15,20 Q15,5 30,3 Q45,5 45,20 L45,48 Z'"
              [attr.fill]="getCrownColor()"
              stroke="#333"
              stroke-width="1.5"
            />
            <!-- Surfaces -->
            <g class="surfaces">
              <!-- Mesial -->
              <path
                d="M15,20 L15,38 L23,38 L23,15 Z"
                [attr.fill]="getSurfaceColor('mesial')"
                class="surface"
                (click)="onSurfaceClick('mesial', $event)"
              />
              <!-- Distal -->
              <path
                d="M37,15 L37,38 L45,38 L45,20 Z"
                [attr.fill]="getSurfaceColor('distal')"
                class="surface"
                (click)="onSurfaceClick('distal', $event)"
              />
              <!-- Oclusal/Cusp -->
              <path
                d="M23,8 Q30,3 37,8 L37,15 L23,15 Z"
                [attr.fill]="getSurfaceColor('oclusal')"
                class="surface"
                (click)="onSurfaceClick('oclusal', $event)"
              />
              <!-- Vestibular -->
              <rect
                x="23" y="15" width="14" height="12"
                [attr.fill]="getSurfaceColor('vestibular')"
                class="surface"
                (click)="onSurfaceClick('vestibular', $event)"
              />
              <!-- Lingual -->
              <rect
                x="23" y="27" width="14" height="11"
                [attr.fill]="getSurfaceColor('lingual')"
                class="surface"
                (click)="onSurfaceClick('lingual', $event)"
              />
            </g>
          </g>
        }
        @case ('premolar') {
          <!-- Premolar shape -->
          <g class="tooth-body">
            <!-- Roots (2) -->
            <path
              [attr.d]="'M22,50 L18,75 Q22,78 26,75 L28,50 Z'"
              [attr.fill]="getRootColor()"
              stroke="#666"
              stroke-width="1"
            />
            <path
              [attr.d]="'M32,50 L34,75 Q38,78 42,75 L38,50 Z'"
              [attr.fill]="getRootColor()"
              stroke="#666"
              stroke-width="1"
            />
            <!-- Crown -->
            <rect
              x="12" y="5" width="36" height="45" rx="5"
              [attr.fill]="getCrownColor()"
              stroke="#333"
              stroke-width="1.5"
            />
            <!-- Surfaces -->
            <g class="surfaces">
              <!-- Mesial -->
              <rect
                x="12" y="15" width="10" height="25"
                [attr.fill]="getSurfaceColor('mesial')"
                class="surface"
                (click)="onSurfaceClick('mesial', $event)"
              />
              <!-- Distal -->
              <rect
                x="38" y="15" width="10" height="25"
                [attr.fill]="getSurfaceColor('distal')"
                class="surface"
                (click)="onSurfaceClick('distal', $event)"
              />
              <!-- Oclusal (with cusps) -->
              <ellipse
                cx="30" cy="12" rx="12" ry="6"
                [attr.fill]="getSurfaceColor('oclusal')"
                class="surface"
                (click)="onSurfaceClick('oclusal', $event)"
              />
              <!-- Vestibular -->
              <rect
                x="22" y="18" width="16" height="10"
                [attr.fill]="getSurfaceColor('vestibular')"
                class="surface"
                (click)="onSurfaceClick('vestibular', $event)"
              />
              <!-- Lingual -->
              <rect
                x="22" y="30" width="16" height="10"
                [attr.fill]="getSurfaceColor('lingual')"
                class="surface"
                (click)="onSurfaceClick('lingual', $event)"
              />
            </g>
          </g>
        }
        @case ('molar') {
          <!-- Molar shape -->
          <g class="tooth-body">
            <!-- Roots (3) -->
            <path
              [attr.d]="'M18,50 L12,75 Q17,78 22,75 L25,50 Z'"
              [attr.fill]="getRootColor()"
              stroke="#666"
              stroke-width="1"
            />
            <path
              [attr.d]="'M27,50 L30,78 Q33,80 36,78 L33,50 Z'"
              [attr.fill]="getRootColor()"
              stroke="#666"
              stroke-width="1"
            />
            <path
              [attr.d]="'M35,50 L38,75 Q43,78 48,75 L42,50 Z'"
              [attr.fill]="getRootColor()"
              stroke="#666"
              stroke-width="1"
            />
            <!-- Crown (larger) -->
            <rect
              x="8" y="5" width="44" height="45" rx="6"
              [attr.fill]="getCrownColor()"
              stroke="#333"
              stroke-width="1.5"
            />
            <!-- Surfaces -->
            <g class="surfaces">
              <!-- Mesial -->
              <rect
                x="8" y="15" width="12" height="25"
                [attr.fill]="getSurfaceColor('mesial')"
                class="surface"
                (click)="onSurfaceClick('mesial', $event)"
              />
              <!-- Distal -->
              <rect
                x="40" y="15" width="12" height="25"
                [attr.fill]="getSurfaceColor('distal')"
                class="surface"
                (click)="onSurfaceClick('distal', $event)"
              />
              <!-- Oclusal (with multiple cusps) -->
              <path
                d="M20,8 Q25,5 30,8 Q35,5 40,8 L40,18 L20,18 Z"
                [attr.fill]="getSurfaceColor('oclusal')"
                class="surface"
                (click)="onSurfaceClick('oclusal', $event)"
              />
              <!-- Vestibular -->
              <rect
                x="20" y="18" width="20" height="10"
                [attr.fill]="getSurfaceColor('vestibular')"
                class="surface"
                (click)="onSurfaceClick('vestibular', $event)"
              />
              <!-- Lingual -->
              <rect
                x="20" y="30" width="20" height="10"
                [attr.fill]="getSurfaceColor('lingual')"
                class="surface"
                (click)="onSurfaceClick('lingual', $event)"
              />
            </g>
          </g>
        }
      }

      <!-- Status overlay for special conditions -->
      @if (tooth.status === 'missing' || tooth.status === 'extracted') {
        <line x1="10" y1="10" x2="50" y2="70" stroke="#FF0000" stroke-width="3"/>
        <line x1="50" y1="10" x2="10" y2="70" stroke="#FF0000" stroke-width="3"/>
      }

      @if (tooth.status === 'crown') {
        <circle cx="30" cy="25" r="18" fill="none" stroke="#9C27B0" stroke-width="2" stroke-dasharray="4,2"/>
      }

      @if (tooth.status === 'implant') {
        <rect x="25" y="50" width="10" height="25" fill="#FF9800" stroke="#E65100" stroke-width="1"/>
        <circle cx="30" cy="55" r="3" fill="#E65100"/>
      }

      @if (tooth.status === 'root_canal') {
        <line x1="30" y1="50" x2="30" y2="75" stroke="#795548" stroke-width="3"/>
      }

      @if (tooth.status === 'to_extract') {
        <text x="30" y="45" text-anchor="middle" fill="#FF5722" font-size="24" font-weight="bold">X</text>
      }

      <!-- Tooth number -->
      <text
        x="30"
        [attr.y]="isUpperTooth ? 78 : 2"
        text-anchor="middle"
        [attr.dominant-baseline]="isUpperTooth ? 'auto' : 'hanging'"
        font-size="10"
        font-weight="bold"
        fill="#333"
      >
        {{ tooth.number }}
      </text>
    </svg>
  `,
  styles: [`
    :host {
      display: inline-block;
      cursor: pointer;
    }

    .tooth-svg {
      transition: transform 0.2s, filter 0.2s;

      &:hover {
        transform: scale(1.1);
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
      }

      &.selected {
        filter: drop-shadow(0 0 6px var(--ion-color-primary));
      }

      &.missing {
        opacity: 0.5;
      }
    }

    .surface {
      cursor: pointer;
      opacity: 0.9;
      stroke: rgba(0,0,0,0.2);
      stroke-width: 0.5;
      transition: opacity 0.2s;

      &:hover {
        opacity: 1;
        stroke: rgba(0,0,0,0.5);
        stroke-width: 1;
      }
    }

    .tooth-body {
      transition: all 0.2s;
    }
  `]
})
export class ToothSvgComponent {
  @Input() tooth!: ToothData;
  @Input() width = 60;
  @Input() height = 80;
  @Input() selected = false;
  @Input() isUpperTooth = true;

  @Output() toothClick = new EventEmitter<ToothData>();
  @Output() surfaceClick = new EventEmitter<{ tooth: ToothData; surface: string }>();

  private surfaceColors: Record<SurfaceCondition, string> = {
    healthy: '#FFFFFF',
    caries: '#F44336',
    filled: '#2196F3',
    composite: '#90CAF9',
    amalgam: '#607D8B'
  };

  get toothShape(): ToothShape {
    const num = this.tooth.number;
    // FDI notation
    const toothInQuadrant = num % 10;

    if (toothInQuadrant === 1 || toothInQuadrant === 2) return 'incisor';
    if (toothInQuadrant === 3) return 'canine';
    if (toothInQuadrant === 4 || toothInQuadrant === 5) return 'premolar';
    return 'molar'; // 6, 7, 8
  }

  getCrownColor(): string {
    if (this.tooth.status === 'healthy') return '#FFFDE7';
    return TOOTH_STATUS_COLORS[this.tooth.status] || '#FFFDE7';
  }

  getRootColor(): string {
    if (this.tooth.status === 'missing' || this.tooth.status === 'extracted') {
      return '#E0E0E0';
    }
    return '#FFF8E1';
  }

  getSurfaceColor(surface: 'mesial' | 'distal' | 'oclusal' | 'vestibular' | 'lingual'): string {
    const condition = this.tooth.surfaces[surface];
    if (!condition || condition === 'healthy') return '#FFFFFF';
    return this.surfaceColors[condition] || '#FFFFFF';
  }

  @HostListener('click', ['$event'])
  onClick(event: Event): void {
    event.stopPropagation();
    this.toothClick.emit(this.tooth);
  }

  onSurfaceClick(surface: string, event: Event): void {
    event.stopPropagation();
    this.surfaceClick.emit({ tooth: this.tooth, surface });
  }
}
