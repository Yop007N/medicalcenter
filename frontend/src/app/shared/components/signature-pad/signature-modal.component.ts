import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  ModalController
} from '@ionic/angular/standalone';
import { SignaturePadComponent } from './signature-pad.component';

@Component({
  selector: 'app-signature-modal',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    SignaturePadComponent
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ modalTitle }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">Cerrar</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <app-signature-pad
        [title]="signatureTitle"
        [subtitle]="signatureSubtitle"
        [saveButtonText]="saveButtonText"
        [showCancelButton]="showCancelButton"
        (signatureSaved)="onSignatureSaved($event)"
        (signatureCancelled)="dismiss()">
      </app-signature-pad>
    </ion-content>
  `
})
export class SignatureModalComponent {
  @Input() modalTitle = 'Captura de Firma';
  @Input() signatureTitle = 'Firma';
  @Input() signatureSubtitle = '';
  @Input() saveButtonText = 'Guardar Firma';
  @Input() showCancelButton = true;
  private modalController = inject(ModalController);

  onSignatureSaved(signatureData: string): void {
    this.modalController.dismiss(signatureData, 'confirm');
  }

  dismiss(): void {
    this.modalController.dismiss(null, 'cancel');
  }
}
