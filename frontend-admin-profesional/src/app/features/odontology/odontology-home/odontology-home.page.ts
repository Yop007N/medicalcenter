import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  fitnessOutline,
  personOutline,
  listOutline,
  addCircleOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-odontology-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonMenuButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonButton
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button aria-label="Abrir menu principal"></ion-menu-button>
        </ion-buttons>
        <ion-title>Odontología</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="fitness-outline"></ion-icon>
            Módulo de Odontología
          </ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>Gestión de odontogramas y tratamientos dentales.</p>
        </ion-card-content>
      </ion-card>

      <ion-list>
        <ion-item routerLink="/odontology/odontograms" detail>
          <ion-icon name="person-outline" slot="start" color="primary"></ion-icon>
          <ion-label>
            <h2>Odontogramas</h2>
            <p>Ver y gestionar odontogramas de pacientes</p>
          </ion-label>
        </ion-item>
        <ion-item routerLink="/odontology/treatments" detail>
          <ion-icon name="list-outline" slot="start" color="primary"></ion-icon>
          <ion-label>
            <h2>Tratamientos Dentales</h2>
            <p>Historial de tratamientos realizados</p>
          </ion-label>
        </ion-item>
      </ion-list>

      <ion-button expand="block" routerLink="/odontology/treatments/new" class="ion-margin-top">
        <ion-icon slot="start" name="add-circle-outline"></ion-icon>
        Nuevo Tratamiento
      </ion-button>
    </ion-content>
  `,
  styles: [`
    ion-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class OdontologyHomePage {
  constructor() {
    addIcons({ fitnessOutline, personOutline, listOutline, addCircleOutline });
  }
}
