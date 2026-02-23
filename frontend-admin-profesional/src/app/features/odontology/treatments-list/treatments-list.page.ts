import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonSpinner,
  IonText,
  IonRefresher,
  IonRefresherContent,
  IonBadge,
  IonFab,
  IonFabButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, fitnessOutline } from 'ionicons/icons';
import * as OdontologyActions from '../../../store/odontology/odontology.actions';
import { selectDentalTreatments, selectOdontologyLoading, selectOdontologyError } from '../../../store/odontology/odontology.selectors';
import { TreatmentStatus, TREATMENT_TYPES } from '../../../models/odontology.model';

@Component({
  selector: 'app-treatments-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonSpinner,
    IonText,
    IonRefresher,
    IonRefresherContent,
    IonBadge,
    IonFab,
    IonFabButton
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/odontology"></ion-back-button>
        </ion-buttons>
        <ion-title>Tratamientos Dentales</ion-title>
        <ion-buttons slot="end">
          <ion-button routerLink="/odontology/treatments/new">
            <ion-icon slot="icon-only" name="add-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      @if (loading$ | async) {
        <div class="ion-text-center ion-padding">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Cargando tratamientos...</p>
        </div>
      } @else if (error$ | async; as error) {
        <div class="ion-text-center ion-padding">
          <ion-text color="danger">
            <p>{{ error }}</p>
          </ion-text>
          <ion-button fill="outline" (click)="loadTreatments()">Reintentar</ion-button>
        </div>
      } @else {
        @if ((treatments$ | async)?.length === 0) {
          <div class="ion-text-center ion-padding">
            <ion-icon name="fitness-outline" style="font-size: 64px; color: var(--ion-color-medium);"></ion-icon>
            <p>No hay tratamientos</p>
            <ion-button routerLink="/odontology/treatments/new">
              <ion-icon slot="start" name="add-outline"></ion-icon>
              Nuevo Tratamiento
            </ion-button>
          </div>
        } @else {
          <ion-list>
            @for (treatment of treatments$ | async; track treatment.id) {
              <ion-item [routerLink]="['/odontology/treatments', treatment.id]" detail>
                <ion-icon name="fitness-outline" slot="start" color="primary"></ion-icon>
                <ion-label>
                  <h2>{{ getTreatmentLabel(treatment.treatment_type) }}</h2>
                  <p>
                    @if (treatment.patient) {
                      {{ treatment.patient.first_name }} {{ treatment.patient.last_name }}
                    }
                  </p>
                  <p>{{ treatment.treatment_date | date:'dd/MM/yyyy' }}</p>
                </ion-label>
                <ion-badge slot="end" [color]="getStatusColor(treatment.status)">
                  {{ getStatusLabel(treatment.status) }}
                </ion-badge>
              </ion-item>
            }
          </ion-list>
        }
      }

      <!-- FAB para crear (mobile) -->
      <ion-fab slot="fixed" vertical="bottom" horizontal="end" class="hide-desktop">
        <ion-fab-button routerLink="/odontology/treatments/new">
          <ion-icon name="add-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- Boton para crear (desktop) -->
      <div class="desktop-create-btn hide-mobile">
        <ion-button routerLink="/odontology/treatments/new" shape="round" expand="block">
          <ion-icon slot="start" name="add-outline"></ion-icon>
          Nuevo Tratamiento
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    /* FAB */
    ion-fab-button {
      --background: var(--medical-gradient-primary);
      --box-shadow: var(--medical-shadow-lg);
    }

    /* Desktop create button */
    .desktop-create-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 1000;

      ion-button {
        --border-radius: 25px;
        --box-shadow: var(--medical-shadow-lg);
        height: 48px;
        font-weight: 600;
      }
    }

    .hide-mobile {
      display: none;
    }

    .hide-desktop {
      display: block;
    }

    @media (min-width: 768px) {
      .hide-mobile {
        display: block;
      }

      .hide-desktop {
        display: none;
      }
    }
  `]
})
export class TreatmentsListPage implements OnInit {
  private store = inject(Store);

  treatments$ = this.store.select(selectDentalTreatments).pipe(
    map(treatments => Array.isArray(treatments) ? treatments : [])
  );
  loading$ = this.store.select(selectOdontologyLoading);
  error$ = this.store.select(selectOdontologyError);

  constructor() {
    addIcons({ addOutline, fitnessOutline });
  }

  ngOnInit(): void {
    this.loadTreatments();
  }

  loadTreatments(): void {
    this.store.dispatch(OdontologyActions.loadDentalTreatments({}));
  }

  doRefresh(event: any): void {
    this.loadTreatments();
    setTimeout(() => event.target.complete(), 1000);
  }

  getTreatmentLabel(type: string): string {
    const found = TREATMENT_TYPES.find(t => t.value === type);
    return found ? found.label : type;
  }

  getStatusColor(status: TreatmentStatus): string {
    switch (status) {
      case 'planned': return 'warning';
      case 'in_progress': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      case 'postponed': return 'medium';
      default: return 'medium';
    }
  }

  getStatusLabel(status: TreatmentStatus): string {
    switch (status) {
      case 'planned': return 'Planificado';
      case 'in_progress': return 'En Progreso';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      case 'postponed': return 'Pospuesto';
      default: return status;
    }
  }
}
