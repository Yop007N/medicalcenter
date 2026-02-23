import { Component } from '@angular/core';
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
  schoolOutline,
  clipboardOutline,
  calendarOutline,
  addCircleOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-psychopedagogy-home',
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
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Psicopedagogía</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="school-outline"></ion-icon>
            Módulo de Psicopedagogía
          </ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>Gestión de evaluaciones psicopedagógicas y sesiones de intervención.</p>
        </ion-card-content>
      </ion-card>

      <ion-list>
        <ion-item routerLink="/psychopedagogy/evaluations" detail>
          <ion-icon name="clipboard-outline" slot="start" color="primary"></ion-icon>
          <ion-label>
            <h2>Evaluaciones Psicopedagógicas</h2>
            <p>Evaluaciones de aprendizaje</p>
          </ion-label>
        </ion-item>
        <ion-item routerLink="/psychopedagogy/sessions" detail>
          <ion-icon name="calendar-outline" slot="start" color="primary"></ion-icon>
          <ion-label>
            <h2>Sesiones de Intervención</h2>
            <p>Registro de sesiones de apoyo</p>
          </ion-label>
        </ion-item>
      </ion-list>

      <ion-button expand="block" routerLink="/psychopedagogy/evaluations/new" class="ion-margin-top">
        <ion-icon slot="start" name="add-circle-outline"></ion-icon>
        Nueva Evaluación
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
export class PsychopedagogyHomePage {
  constructor() {
    addIcons({ schoolOutline, clipboardOutline, calendarOutline, addCircleOutline });
  }
}
