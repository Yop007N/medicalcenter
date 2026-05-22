import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonIcon,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, saveOutline, trashOutline } from 'ionicons/icons';
import { ToothStatus, TOOTH_STATUS_COLORS } from '../../../../models/odontology.model';
import { ToothImageData } from '../../odontogram/tooth-image.component';

@Component({
  selector: 'app-tooth-action-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonList,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonIcon
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Diente #{{ tooth.number }}</ion-title>
        <ion-buttons slot="end">
          <ion-button aria-label="Cerrar" (click)="dismiss()">
            <ion-icon name="close-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-list>
        <ion-item>
          <ion-label position="stacked">Estado</ion-label>
          <ion-select [(ngModel)]="status" interface="action-sheet" placeholder="Seleccionar estado">
            @for (s of toothStatuses; track s.value) {
              <ion-select-option [value]="s.value">
                {{ s.label }}
              </ion-select-option>
            }
          </ion-select>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Notas</ion-label>
          <ion-textarea
            [(ngModel)]="notes"
            placeholder="Observaciones sobre este diente..."
            rows="4"
          ></ion-textarea>
        </ion-item>
      </ion-list>

      <div class="ion-padding">
        <ion-button expand="block" (click)="save()">
          <ion-icon name="save-outline" slot="start"></ion-icon>
          Guardar Cambios
        </ion-button>
        
        @if (status !== 'healthy' || notes) {
          <ion-button expand="block" color="medium" fill="outline" class="ion-margin-top" (click)="reset()">
            <ion-icon name="trash-outline" slot="start"></ion-icon>
            Restablecer a Sano
          </ion-button>
        }
      </div>
    </ion-content>
  `
})
export class ToothActionModalComponent implements OnInit {
  private modalCtrl = inject(ModalController);

  @Input() tooth!: ToothImageData;

  status: ToothStatus = 'healthy';
  notes = '';

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
    addIcons({ closeOutline, saveOutline, trashOutline });
  }

  ngOnInit(): void {
    if (this.tooth) {
      this.status = this.tooth.status;
      this.notes = this.tooth.notes || '';
    }
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  save() {
    this.modalCtrl.dismiss({
      status: this.status,
      notes: this.notes
    }, 'confirm');
  }

  reset() {
    this.status = 'healthy';
    this.notes = '';
    this.save();
  }
}
