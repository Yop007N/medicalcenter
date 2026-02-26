import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonList,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-infectology-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonList,
  ],
  template: `
    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Módulo de Infectología</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          Flujo clínico especializado para infectología.
        </ion-card-content>
      </ion-card>

      <ion-list>
        <ion-item routerLink="/infectology/workspace" detail>
          <ion-label>
            <h2>Panel clínico de Infectología</h2>
            <p>Acceso a atenciones, trazabilidad y seguimiento del módulo.</p>
          </ion-label>
        </ion-item>
        <ion-item routerLink="/patients" detail>
          <ion-label>
            <h2>Pacientes</h2>
            <p>Listado y detalle de pacientes asociados.</p>
          </ion-label>
        </ion-item>
        <ion-item routerLink="/appointments" detail>
          <ion-label>
            <h2>Citas</h2>
            <p>Agenda de consultas y estados operativos.</p>
          </ion-label>
        </ion-item>
        <ion-item routerLink="/medical-records" detail>
          <ion-label>
            <h2>Historiales</h2>
            <p>Registro clínico y evolución por paciente.</p>
          </ion-label>
        </ion-item>
      </ion-list>

      <ion-button expand="block" routerLink="/infectology/workspace" class="ion-margin-top">
        Abrir módulo de Infectología
      </ion-button>
    </ion-content>
  `,
})
export class InfectologyHomePage {}
