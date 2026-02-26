import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  Output,
  EventEmitter,
  Input,
  OnDestroy,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonButton,
  IonIcon,
  IonText,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trashOutline, checkmarkOutline, closeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-signature-pad',
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon, IonText],
  template: `
    <div class="signature-container">
      <div class="signature-header">
        <h3>{{ title }}</h3>
        @if (subtitle) {
          <p class="subtitle">{{ subtitle }}</p>
        }
      </div>

      <div class="canvas-container" [class.has-signature]="hasSignature">
        <canvas
          #signatureCanvas
          (mousedown)="startDrawing($event)"
          (mousemove)="draw($event)"
          (mouseup)="stopDrawing()"
          (mouseleave)="stopDrawing()"
          (touchstart)="startDrawingTouch($event)"
          (touchmove)="drawTouch($event)"
          (touchend)="stopDrawing()">
        </canvas>
        @if (!hasSignature) {
          <div class="placeholder-text">
            <ion-text color="medium">Firme aquí</ion-text>
          </div>
        }
      </div>

      <div class="signature-actions">
        <ion-button fill="outline" color="medium" (click)="clear()">
          <ion-icon slot="start" name="trash-outline"></ion-icon>
          Limpiar
        </ion-button>

        @if (showCancelButton) {
          <ion-button fill="outline" color="danger" (click)="cancel()">
            <ion-icon slot="start" name="close-outline"></ion-icon>
            Cancelar
          </ion-button>
        }

        <ion-button color="success" (click)="save()" [disabled]="!hasSignature">
          <ion-icon slot="start" name="checkmark-outline"></ion-icon>
          {{ saveButtonText }}
        </ion-button>
      </div>
    </div>
  `,
  styles: [`
    .signature-container {
      padding: 16px;
      background: var(--ion-background-color);
      border-radius: 12px;
    }

    .signature-header {
      text-align: center;
      margin-bottom: 16px;
    }

    .signature-header h3 {
      margin: 0 0 4px 0;
      font-size: 18px;
      font-weight: 500;
    }

    .subtitle {
      margin: 0;
      font-size: 14px;
      color: var(--ion-color-medium);
    }

    .canvas-container {
      position: relative;
      border: 2px dashed var(--ion-color-medium);
      border-radius: 8px;
      background: white;
      margin-bottom: 16px;
      overflow: hidden;
      touch-action: none;
    }

    .canvas-container.has-signature {
      border-style: solid;
      border-color: var(--ion-color-primary);
    }

    canvas {
      display: block;
      width: 100%;
      height: 200px;
      cursor: crosshair;
    }

    .placeholder-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      font-size: 16px;
    }

    .signature-actions {
      display: flex;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    @media (max-width: 480px) {
      .signature-actions {
        flex-direction: column;
      }

      .signature-actions ion-button {
        width: 100%;
      }
    }
  `]
})
export class SignaturePadComponent implements AfterViewInit, OnDestroy {
  @ViewChild('signatureCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() title = 'Firma';
  @Input() subtitle = '';
  @Input() saveButtonText = 'Guardar Firma';
  @Input() showCancelButton = true;
  @Input() lineWidth = 2;
  @Input() lineColor = '#233142';

  @Output() signatureSaved = new EventEmitter<string>();
  @Output() signatureCancelled = new EventEmitter<void>();

  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private isDrawing = false;
  private lastX = 0;
  private lastY = 0;
  private modalController = inject(ModalController);

  hasSignature = false;

  constructor() {
    addIcons({ trashOutline, checkmarkOutline, closeOutline });
  }

  ngAfterViewInit(): void {
    this.initCanvas();
    window.addEventListener('resize', this.resizeCanvas.bind(this));
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeCanvas.bind(this));
  }

  private initCanvas(): void {
    this.canvas = this.canvasRef.nativeElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.resizeCanvas();
    this.setupContext();
  }

  private resizeCanvas(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Save current content if any
    const imageData = this.hasSignature ? this.canvas.toDataURL() : null;

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;

    this.ctx.scale(dpr, dpr);
    this.setupContext();

    // Restore content if there was any
    if (imageData) {
      const img = new Image();
      img.onload = () => {
        this.ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = imageData;
    }
  }

  private setupContext(): void {
    this.ctx.strokeStyle = this.lineColor;
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  private getCanvasCoordinates(event: MouseEvent | Touch): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  startDrawing(event: MouseEvent): void {
    this.isDrawing = true;
    const coords = this.getCanvasCoordinates(event);
    this.lastX = coords.x;
    this.lastY = coords.y;
  }

  startDrawingTouch(event: TouchEvent): void {
    event.preventDefault();
    if (event.touches.length > 0) {
      this.isDrawing = true;
      const coords = this.getCanvasCoordinates(event.touches[0]);
      this.lastX = coords.x;
      this.lastY = coords.y;
    }
  }

  draw(event: MouseEvent): void {
    if (!this.isDrawing) return;

    const coords = this.getCanvasCoordinates(event);
    this.drawLine(this.lastX, this.lastY, coords.x, coords.y);
    this.lastX = coords.x;
    this.lastY = coords.y;
    this.hasSignature = true;
  }

  drawTouch(event: TouchEvent): void {
    event.preventDefault();
    if (!this.isDrawing || event.touches.length === 0) return;

    const coords = this.getCanvasCoordinates(event.touches[0]);
    this.drawLine(this.lastX, this.lastY, coords.x, coords.y);
    this.lastX = coords.x;
    this.lastY = coords.y;
    this.hasSignature = true;
  }

  private drawLine(x1: number, y1: number, x2: number, y2: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
  }

  stopDrawing(): void {
    this.isDrawing = false;
  }

  clear(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.clearRect(0, 0, rect.width, rect.height);
    this.hasSignature = false;
  }

  save(): void {
    if (!this.hasSignature) return;

    // Get the signature as base64 PNG
    const signatureData = this.canvas.toDataURL('image/png');
    this.signatureSaved.emit(signatureData);

    // If used in a modal, dismiss it
    this.modalController.dismiss(signatureData, 'confirm');
  }

  cancel(): void {
    this.signatureCancelled.emit();
    this.modalController.dismiss(null, 'cancel');
  }

  // Method to get signature without emitting/dismissing
  getSignatureData(): string | null {
    if (!this.hasSignature) return null;
    return this.canvas.toDataURL('image/png');
  }

  // Method to load an existing signature
  loadSignature(base64Image: string): void {
    const img = new Image();
    img.onload = () => {
      const rect = this.canvas.getBoundingClientRect();
      this.ctx.drawImage(img, 0, 0, rect.width, rect.height);
      this.hasSignature = true;
    };
    img.src = base64Image;
  }
}
