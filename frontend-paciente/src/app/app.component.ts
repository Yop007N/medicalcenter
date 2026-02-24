import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  template: `
    <ion-app>
      @if (isAuthenticated$ | async) {
        <ion-split-pane contentId="main-content">
          <ion-menu contentId="main-content" type="overlay">
            <ion-header>
              <ion-toolbar color="primary">
                <ion-title>Medical Services</ion-title>
              </ion-toolbar>
            </ion-header>

            <ion-content>
              @if (currentUser$ | async; as user) {
                <section class="menu-user ion-padding">
                  <strong>{{ user.first_name }} {{ user.last_name }}</strong>
                  <p>{{ user.email }}</p>
                  <ion-chip color="tertiary">Paciente</ion-chip>
                </section>
              }

              <ion-list lines="none" class="menu-list">
                @for (item of appPages; track item.url) {
                  <ion-menu-toggle auto-hide="false">
                    <ion-item
                      [routerLink]="item.url"
                      routerDirection="root"
                      [class.selected]="isSelected(item.url)"
                      detail="false"
                      button
                    >
                      <ion-label>{{ item.title }}</ion-label>
                    </ion-item>
                  </ion-menu-toggle>
                }
              </ion-list>

              <ion-button expand="block" fill="outline" class="ion-margin" (click)="logout()">
                Cerrar sesion
              </ion-button>
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
      .menu-user {
        border-bottom: 1px solid #e2e8f0;
      }

      .menu-user strong {
        color: #0f172a;
        display: block;
        font-size: 0.95rem;
      }

      .menu-user p {
        color: #475569;
        font-size: 0.8rem;
        margin: 4px 0 8px;
      }

      .menu-list {
        padding-top: 8px;
      }

      ion-item.selected {
        --background: #e0ecff;
        --color: #1d4ed8;
        font-weight: 600;
      }
    `
  ]
})
export class AppComponent {
  readonly currentUser$ = this.authService.currentUser$;
  readonly isAuthenticated$ = this.currentUser$.pipe(map((user) => Boolean(user)));

  readonly appPages = [
    { title: 'Mi panel', url: '/dashboard' },
    { title: 'Mis turnos', url: '/my-appointments' },
    { title: 'Mis presupuestos', url: '/my-budgets' },
    { title: 'Mi historia clinica', url: '/my-history' },
    { title: 'Mi perfil', url: '/my-profile' }
  ];

  private selectedPath = '/dashboard';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
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
