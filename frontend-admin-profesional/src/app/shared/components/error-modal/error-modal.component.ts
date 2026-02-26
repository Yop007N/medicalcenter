import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-error-modal',
  standalone: true,
  imports: [CommonModule, IonButton],
  template: `
    <div class="error-modal-overlay" (click)="dismiss()">
      <div class="error-modal-container" (click)="$event.stopPropagation()">
        <div class="error-icon-container">
          <div class="error-icon-circle">
            <svg class="error-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle class="error-circle" cx="26" cy="26" r="25" fill="none"/>
              <path class="error-x" fill="none" d="M16 16 L36 36 M36 16 L16 36"/>
            </svg>
          </div>
        </div>
        <h2 class="error-title">Error</h2>
        <p class="error-message">{{ message }}</p>
        <ion-button expand="block" class="error-btn" (click)="dismiss()">
          Aceptar
        </ion-button>
      </div>
    </div>
  `,
  styles: [`
    .error-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      animation: fadeIn 0.2s ease-out;
    }

    .error-modal-container {
      background: var(--medical-bg-card);
      border-radius: 20px;
      padding: 32px 24px 24px;
      max-width: 320px;
      width: 90%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      animation: scaleIn 0.3s ease-out;
    }

    .error-icon-container {
      margin-bottom: 20px;
    }

    .error-icon-circle {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, var(--ion-color-danger-tint) 0%, var(--ion-color-danger-shade) 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
      box-shadow: 0 10px 25px -5px rgba(var(--ion-color-danger-rgb), 0.35);
      animation: shake 0.5s ease-in-out;
    }

    .error-icon {
      width: 40px;
      height: 40px;
      stroke: var(--ion-color-primary-contrast);
      stroke-width: 3;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .error-circle {
      stroke: rgba(255, 255, 255, 0.3);
      stroke-dasharray: 166;
      stroke-dashoffset: 166;
      animation: strokeCircle 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
    }

    .error-x {
      stroke: var(--ion-color-primary-contrast);
      stroke-dasharray: 56;
      stroke-dashoffset: 56;
      animation: strokeX 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.4s forwards;
    }

    .error-title {
      font-size: 20px;
      font-weight: 700;
      color: var(--ion-color-dark);
      margin: 0 0 8px 0;
    }

    .error-message {
      font-size: 14px;
      color: var(--ion-color-medium);
      margin: 0 0 24px 0;
      line-height: 1.5;
    }

    .error-btn {
      --background: linear-gradient(135deg, var(--ion-color-danger-tint) 0%, var(--ion-color-danger-shade) 100%);
      --border-radius: 12px;
      --box-shadow: 0 4px 14px 0 rgba(var(--ion-color-danger-rgb), 0.32);
      font-weight: 600;
      height: 48px;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes scaleIn {
      0% {
        transform: scale(0.8);
        opacity: 0;
      }
      50% {
        transform: scale(1.02);
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
      20%, 40%, 60%, 80% { transform: translateX(4px); }
    }

    @keyframes strokeCircle {
      100% {
        stroke-dashoffset: 0;
      }
    }

    @keyframes strokeX {
      100% {
        stroke-dashoffset: 0;
      }
    }
  `]
})
export class ErrorModalComponent {
  @Input() message: string = '';
  private modalController = inject(ModalController);

  dismiss() {
    this.modalController.dismiss();
  }
}
