import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  chevronForwardOutline,
  documentTextOutline,
  homeOutline,
  logOutOutline,
  medkitOutline,
  pulseOutline,
  personOutline,
  walletOutline
} from 'ionicons/icons';
import { filter, map } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  template: `
    <ion-app>
      @if (isAuthenticated$ | async) {
        <ion-split-pane contentId="main-content" when="lg">
          <ion-menu contentId="main-content" type="overlay" class="patient-menu">
            <ion-content class="menu-content">
              <section class="menu-brand">
                <div class="menu-brand__icon">
                  <ion-icon name="medkit-outline"></ion-icon>
                </div>
                <div class="menu-brand__text">
                  <strong>Medical Services</strong>
                  <span>Portal Paciente</span>
                </div>
              </section>

              @if (currentUser$ | async; as user) {
                <section class="menu-user">
                  <strong>{{ user.first_name }} {{ user.last_name }}</strong>
                  <p>{{ user.email }}</p>
                  <ion-chip color="primary">Paciente</ion-chip>
                </section>
              }

              <ion-list lines="none" class="menu-list">
                @for (item of appPages; track item.url) {
                  <ion-menu-toggle auto-hide="false">
                    <ion-item
                      [routerLink]="item.url"
                      routerDirection="root"
                      [class.selected]="isSelected(item.url)"
                      class="menu-item"
                      detail="false"
                      button
                    >
                      <div class="menu-item__icon" slot="start">
                        <ion-icon [name]="item.icon"></ion-icon>
                      </div>
                      <ion-label>{{ item.title }}</ion-label>
                      <ion-icon name="chevron-forward-outline" class="menu-item__chevron" slot="end"></ion-icon>
                    </ion-item>
                  </ion-menu-toggle>
                }
              </ion-list>

              <section class="menu-footer">
                <ion-button expand="block" fill="solid" color="primary" (click)="logout()">
                  <ion-icon name="log-out-outline" slot="start"></ion-icon>
                  Cerrar sesion
                </ion-button>
              </section>
            </ion-content>
          </ion-menu>

          <ion-router-outlet id="main-content"></ion-router-outlet>
        </ion-split-pane>
      } @else {
        <ion-router-outlet id="main-content"></ion-router-outlet>
      }
    </ion-app>
  `,
  styles: [
    `
      .patient-menu {
        --background: var(--patient-surface);
        --width: 304px;
      }

      .menu-content {
        --background: var(--patient-surface);
      }

      .menu-brand {
        align-items: center;
        background: var(--patient-gradient);
        border-radius: 0 0 var(--patient-radius-lg) var(--patient-radius-lg);
        color: var(--ion-color-primary-contrast);
        display: flex;
        gap: 12px;
        margin-bottom: 8px;
        padding: 18px 14px;
      }

      .menu-brand__icon {
        align-items: center;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        display: flex;
        height: 40px;
        justify-content: center;
        width: 40px;
      }

      .menu-brand__icon ion-icon {
        font-size: 21px;
      }

      .menu-brand__text {
        display: flex;
        flex-direction: column;
        line-height: 1.2;
      }

      .menu-brand__text strong {
        font-size: 0.95rem;
        font-weight: 700;
      }

      .menu-brand__text span {
        font-size: 0.72rem;
        opacity: 0.88;
      }

      .menu-user {
        background: var(--patient-surface-soft);
        border: 1px solid var(--patient-border);
        border-radius: 12px;
        margin: 0 14px 10px;
        padding: 12px;
      }

      .menu-user strong {
        color: var(--ion-color-dark);
        display: block;
        font-size: 0.9rem;
      }

      .menu-user p {
        color: var(--ion-color-medium);
        font-size: 0.76rem;
        margin: 4px 0 8px;
      }

      .menu-list {
        padding: 4px 10px 0;
      }

      .menu-item {
        --background: transparent;
        --color: var(--ion-color-dark);
        --min-height: 46px;
        --padding-start: 10px;
        --padding-end: 10px;
        --inner-padding-end: 8px;
        border-radius: 12px;
        margin-bottom: 4px;
        transition: background-color 0.2s ease;
      }

      .menu-item__icon {
        align-items: center;
        background: var(--patient-surface-soft);
        border-radius: 10px;
        display: flex;
        height: 32px;
        justify-content: center;
        width: 32px;
      }

      .menu-item__icon ion-icon {
        color: var(--ion-color-medium);
        font-size: 16px;
      }

      .menu-item ion-label {
        font-size: 0.84rem;
        font-weight: 600;
      }

      .menu-item__chevron {
        color: var(--ion-color-medium);
        font-size: 15px;
        opacity: 0.45;
      }

      .menu-item.selected {
        --background: rgba(var(--ion-color-primary-rgb), 0.1);
        --color: var(--ion-color-primary);
        font-weight: 600;
      }

      .menu-item.selected .menu-item__icon {
        background: rgba(var(--ion-color-primary-rgb), 0.18);
      }

      .menu-item.selected .menu-item__icon ion-icon,
      .menu-item.selected .menu-item__chevron {
        color: var(--ion-color-primary);
        opacity: 1;
      }

      .menu-footer {
        margin-top: 10px;
        padding: 0 14px 18px;
      }

      .menu-footer ion-button {
        margin: 0;
      }
    `
  ]
})
export class AppComponent {
  readonly currentUser$ = this.authService.currentUser$;
  readonly isAuthenticated$ = this.currentUser$.pipe(map((user) => Boolean(user)));

  readonly appPages = [
    { title: 'Mi panel', url: '/dashboard', icon: 'home-outline' },
    { title: 'Mis turnos', url: '/my-appointments', icon: 'calendar-outline' },
    { title: 'Plan de cuidado', url: '/my-care-plan', icon: 'pulse-outline' },
    { title: 'Mis presupuestos', url: '/my-budgets', icon: 'wallet-outline' },
    { title: 'Mi historia clinica', url: '/my-history', icon: 'document-text-outline' },
    { title: 'Mi perfil', url: '/my-profile', icon: 'person-outline' }
  ];

  private selectedPath = '/dashboard';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({
      calendarOutline,
      chevronForwardOutline,
      documentTextOutline,
      homeOutline,
      logOutOutline,
      medkitOutline,
      pulseOutline,
      personOutline,
      walletOutline
    });

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.selectedPath = event.urlAfterRedirects.split('?')[0];
      });
  }

  isSelected(url: string): boolean {
    return this.selectedPath === url;
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/auth/login']);
  }
}
