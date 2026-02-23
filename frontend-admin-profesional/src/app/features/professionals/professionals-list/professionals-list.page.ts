import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonIcon,
  IonButtons,
  IonMenuButton,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonChip,
  IonFab,
  IonFabButton,
  IonButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personCircleOutline, callOutline, mailOutline, addOutline, chevronForwardOutline } from 'ionicons/icons';
import { environment } from '../../../../environments/environment';
import { Professional } from '../../../models';

interface PaginatedProfessionalsResponse {
  items: Professional[];
}

@Component({
  selector: 'app-professionals-list',
  standalone: true, // Updated
  imports: [
    CommonModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonAvatar,
    IonIcon,
    IonButtons,
    IonMenuButton,
    IonRefresher,
    IonRefresherContent,
    IonSkeletonText,
    IonChip,
    IonFab,
    IonFabButton,
    IonButton
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Profesionales</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="onRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      @if (loading) {
        <ion-list>
          @for (i of [1,2,3]; track i) {
            <ion-item>
              <ion-avatar slot="start">
                <ion-skeleton-text [animated]="true"></ion-skeleton-text>
              </ion-avatar>
              <ion-label>
                <ion-skeleton-text [animated]="true" style="width: 70%"></ion-skeleton-text>
                <ion-skeleton-text [animated]="true" style="width: 50%"></ion-skeleton-text>
              </ion-label>
            </ion-item>
          }
        </ion-list>
      } @else if (errorMessage) {
        <div class="empty-state">
          <ion-icon name="person-circle-outline"></ion-icon>
          <p>{{ errorMessage }}</p>
          <ion-button fill="outline" (click)="loadProfessionals()">
            Reintentar
          </ion-button>
        </div>
      } @else {
        <ion-list>
          @for (professional of professionals; track professional.id) {
            <ion-item button [routerLink]="['/professionals', professional.id]" detail="true">
              <ion-avatar slot="start">
                <ion-icon name="person-circle-outline" class="avatar-icon"></ion-icon>
              </ion-avatar>
              <ion-label>
                <h2>{{ professional.first_name }} {{ professional.last_name }}</h2>
                <p>{{ professional.email }}</p>
              </ion-label>
              <ion-chip slot="end" color="primary">{{ professional.specialty || 'General' }}</ion-chip>
            </ion-item>
          }
        </ion-list>

        @if (professionals.length === 0) {
          <div class="empty-state">
            <ion-icon name="person-circle-outline"></ion-icon>
            <p>No hay profesionales registrados</p>
            <ion-button fill="outline" routerLink="/professionals/new">
              Agregar Profesional
            </ion-button>
          </div>
        }
      }

      <!-- FAB para crear nuevo profesional (mobile) -->
      <ion-fab slot="fixed" vertical="bottom" horizontal="end" class="hide-desktop">
        <ion-fab-button routerLink="/professionals/new">
          <ion-icon name="add-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- Boton para crear nuevo profesional (desktop) -->
      <div class="desktop-create-btn hide-mobile">
        <ion-button routerLink="/professionals/new" shape="round" expand="block">
          <ion-icon slot="start" name="add-outline"></ion-icon>
          Crear Profesional
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .avatar-icon {
      font-size: 40px;
      color: var(--ion-color-primary);
    }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 16px;
      text-align: center;
    }
    .empty-state ion-icon {
      font-size: 64px;
      color: var(--ion-color-medium);
      margin-bottom: 16px;
    }
    .empty-state p {
      color: var(--ion-color-medium);
      margin-bottom: 16px;
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
export class ProfessionalsListPage implements OnInit {
  private http = inject(HttpClient);

  professionals: Professional[] = [];
  loading = true;
  errorMessage: string | null = null;

  constructor() {
    addIcons({ personCircleOutline, callOutline, mailOutline, addOutline, chevronForwardOutline });
  }

  ngOnInit(): void {
    this.loadProfessionals();
  }

  loadProfessionals(): void {
    this.loading = true;
    this.errorMessage = null;
    this.http.get<Professional[] | PaginatedProfessionalsResponse>(`${environment.apiUrl}/professionals`).subscribe({
      next: (response) => {
        const data = Array.isArray(response) ? response : (response.items || []);
        this.professionals = data;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.msg || err.error?.message || 'No se pudo cargar la lista de profesionales';
      }
    });
  }

  onRefresh(event: any): void {
    this.loadProfessionals();
    setTimeout(() => event.target.complete(), 1000);
  }
}
