import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  IonSplitPane,
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonListHeader,
  IonItem,
  IonIcon,
  IonLabel,
  IonMenuToggle,
  IonRouterOutlet,
  IonFooter,
  IonAvatar,
  IonChip,
  IonButtons,
  IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  peopleOutline,
  medkitOutline,
  calendarOutline,
  documentTextOutline,
  walletOutline,
  cardOutline,
  folderOutline,
  fitnessOutline,
  happyOutline,
  schoolOutline,
  statsChartOutline,
  shieldOutline,
  settingsOutline,
  logOutOutline,
  personCircleOutline,
  chevronForwardOutline,
  notificationsOutline,
  helpCircleOutline
} from 'ionicons/icons';
import { selectUser } from '../../store/auth/auth.selectors';
import * as AuthActions from '../../store/auth/auth.actions';
import { OfflineIndicatorComponent } from '../../shared/components/offline-indicator/offline-indicator.component';

interface MenuItem {
  title: string;
  url: string;
  icon: string;
  badge?: number;
  roles?: string[];
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonSplitPane,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonListHeader,
    IonItem,
    IonIcon,
    IonLabel,
    IonMenuToggle,
    IonRouterOutlet,
    IonFooter,
    IonAvatar,
    IonChip,
    IonButtons,
    IonBadge,
    OfflineIndicatorComponent
  ],
  template: `
    <ion-split-pane contentId="main-content" [when]="'lg'">
      <ion-menu contentId="main-content" type="overlay" class="medical-menu">
        <!-- Menu Header -->
        <div class="menu-header">
          <div class="brand">
            <div class="brand-icon">
              <ion-icon name="medkit-outline"></ion-icon>
            </div>
            <div class="brand-text">
              <span class="brand-name">Medical</span>
              <span class="brand-tagline">Services</span>
            </div>
          </div>
          <app-offline-indicator></app-offline-indicator>
        </div>

        <ion-content class="menu-content">
          <!-- User Profile Card -->
          @if (user$ | async; as user) {
            <div class="user-card">
              <ion-avatar class="user-avatar">
                <ion-icon name="person-circle-outline"></ion-icon>
              </ion-avatar>
              <div class="user-info">
                <span class="user-name">{{ user.email.split('@')[0] }}</span>
                <span class="user-email">{{ user.email }}</span>
              </div>
              <div class="user-role" [attr.data-role]="user.role">
                {{ getRoleLabel(user.role) }}
              </div>
            </div>
          }

          <!-- Navigation Groups -->
          @for (group of menuGroups; track group.title) {
            <div class="menu-group">
              <div class="group-title">{{ group.title }}</div>
              <ion-list lines="none">
                @for (item of group.items; track item.url) {
                  <ion-menu-toggle auto-hide="false">
                    <ion-item
                      [routerLink]="item.url"
                      routerLinkActive="active"
                      [routerLinkActiveOptions]="{exact: item.url === '/dashboard'}"
                      class="menu-item"
                    >
                      <div class="item-icon-wrapper" slot="start">
                        <ion-icon [name]="item.icon"></ion-icon>
                      </div>
                      <ion-label>{{ item.title }}</ion-label>
                      @if (item.badge) {
                        <ion-badge slot="end" color="danger">{{ item.badge }}</ion-badge>
                      }
                      <ion-icon name="chevron-forward-outline" slot="end" class="chevron"></ion-icon>
                    </ion-item>
                  </ion-menu-toggle>
                }
              </ion-list>
            </div>
          }
        </ion-content>

        <!-- Menu Footer -->
        <ion-footer class="menu-footer">
          <ion-list lines="none">
            <ion-item button class="menu-item help-item">
              <div class="item-icon-wrapper" slot="start">
                <ion-icon name="help-circle-outline"></ion-icon>
              </div>
              <ion-label>Centro de ayuda</ion-label>
            </ion-item>
            <ion-item button (click)="logout()" class="menu-item logout-item">
              <div class="item-icon-wrapper danger" slot="start">
                <ion-icon name="log-out-outline"></ion-icon>
              </div>
              <ion-label color="danger">Cerrar sesión</ion-label>
            </ion-item>
          </ion-list>
        </ion-footer>
      </ion-menu>

      <ion-router-outlet id="main-content"></ion-router-outlet>
    </ion-split-pane>
  `,
  styles: [`
    .medical-menu {
      --width: 280px;
      --background: var(--medical-bg-card);
    }

    /* Menu Header */
    .menu-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 16px;
      background: var(--medical-gradient-primary);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-icon {
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: var(--medical-radius);
      display: flex;
      align-items: center;
      justify-content: center;

      ion-icon {
        font-size: 22px;
        color: white;
      }
    }

    .brand-text {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }

    .brand-name {
      font-size: 18px;
      font-weight: 700;
      color: white;
    }

    .brand-tagline {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.8);
      font-weight: 500;
    }

    /* Menu Content */
    .menu-content {
      --background: var(--medical-bg-card);
    }

    /* User Card */
    .user-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 16px 20px;
      background: linear-gradient(180deg, rgba(var(--ion-color-primary-rgb), 0.05) 0%, transparent 100%);
      border-bottom: 1px solid var(--medical-border-light);
      margin-bottom: 8px;
    }

    .user-avatar {
      width: 64px;
      height: 64px;
      background: var(--medical-gradient-primary);
      margin-bottom: 12px;

      ion-icon {
        font-size: 36px;
        color: white;
      }
    }

    .user-info {
      text-align: center;
      margin-bottom: 8px;
    }

    .user-name {
      display: block;
      font-size: 16px;
      font-weight: 600;
      color: var(--ion-color-dark);
      margin-bottom: 2px;
      text-transform: capitalize;
    }

    .user-email {
      display: block;
      font-size: 12px;
      color: var(--ion-color-medium);
    }

    .user-role {
      display: inline-flex;
      padding: 4px 12px;
      border-radius: var(--medical-radius-full);
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;

      &[data-role="admin"] {
        background: rgba(var(--ion-color-danger-rgb), 0.1);
        color: var(--ion-color-danger);
      }

      &[data-role="professional"] {
        background: rgba(var(--ion-color-primary-rgb), 0.1);
        color: var(--ion-color-primary);
      }

      &[data-role="patient"] {
        background: rgba(var(--ion-color-success-rgb), 0.1);
        color: var(--ion-color-success);
      }
    }

    /* Menu Groups */
    .menu-group {
      padding: 8px 12px;
    }

    .group-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--ion-color-medium);
      padding: 12px 12px 8px;
    }

    /* Menu Items */
    ion-list {
      padding: 0;
      background: transparent;
    }

    .menu-item {
      --background: transparent;
      --background-hover: var(--medical-bg-hover);
      --background-activated: var(--medical-bg-hover);
      --border-radius: var(--medical-radius);
      --min-height: 44px;
      --padding-start: 12px;
      --padding-end: 12px;
      --inner-padding-end: 0;
      margin: 2px 0;

      .item-icon-wrapper {
        width: 36px;
        height: 36px;
        border-radius: var(--medical-radius);
        background: var(--medical-bg-light);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;

        ion-icon {
          font-size: 18px;
          color: var(--ion-color-medium);
        }

        &.danger {
          background: rgba(var(--ion-color-danger-rgb), 0.1);

          ion-icon {
            color: var(--ion-color-danger);
          }
        }
      }

      ion-label {
        font-size: 14px;
        font-weight: 500;
        color: var(--ion-color-dark);
      }

      .chevron {
        font-size: 16px;
        color: var(--ion-color-medium);
        opacity: 0;
        transition: opacity 0.2s ease;
      }

      &:hover .chevron {
        opacity: 0.5;
      }

      ion-badge {
        font-size: 10px;
        min-width: 18px;
        height: 18px;
        margin-right: 8px;
      }

      &.active {
        --background: rgba(var(--ion-color-primary-rgb), 0.1);

        .item-icon-wrapper {
          background: var(--medical-gradient-primary);

          ion-icon {
            color: white;
          }
        }

        ion-label {
          color: var(--ion-color-primary);
          font-weight: 600;
        }

        .chevron {
          opacity: 1;
          color: var(--ion-color-primary);
        }
      }
    }

    /* Menu Footer */
    .menu-footer {
      background: var(--medical-bg-card);
      border-top: 1px solid var(--medical-border-light);

      ion-list {
        padding: 8px 12px;
      }

      .help-item {
        margin-bottom: 4px;
      }

      .logout-item {
        ion-label {
          color: var(--ion-color-danger);
        }
      }
    }

    /* Responsive */
    @media (prefers-color-scheme: dark) {
      .menu-header {
        background: var(--medical-gradient-primary);
      }

      .user-card {
        background: linear-gradient(180deg, rgba(var(--ion-color-primary-rgb), 0.1) 0%, transparent 100%);
      }
    }
  `]
})
export class MainLayoutComponent {
  private store = inject(Store);

  user$ = this.store.select(selectUser);

  menuGroups: MenuGroup[] = [
    {
      title: 'Principal',
      items: [
        { title: 'Dashboard', url: '/dashboard', icon: 'home-outline' }
      ]
    },
    {
      title: 'Gestión',
      items: [
        { title: 'Pacientes', url: '/patients', icon: 'people-outline' },
        { title: 'Profesionales', url: '/professionals', icon: 'medkit-outline' },
        { title: 'Citas', url: '/appointments', icon: 'calendar-outline', badge: 3 },
        { title: 'Historiales', url: '/medical-records', icon: 'document-text-outline' },
        { title: 'Presupuestos', url: '/budgets', icon: 'wallet-outline' },
        { title: 'Pagos', url: '/payments', icon: 'card-outline' },
        { title: 'Archivos', url: '/files', icon: 'folder-outline' }
      ]
    },
    {
      title: 'Especialidades',
      items: [
        { title: 'Odontología', url: '/odontology', icon: 'fitness-outline' },
        { title: 'Psicología', url: '/psychology', icon: 'happy-outline' },
        { title: 'Psicopedagogía', url: '/psychopedagogy', icon: 'school-outline' }
      ]
    },
    {
      title: 'Administración',
      items: [
        { title: 'Reportes', url: '/reports', icon: 'stats-chart-outline' },
        { title: 'Auditoría', url: '/audit', icon: 'shield-outline' },
        { title: 'Configuración', url: '/settings', icon: 'settings-outline' }
      ]
    }
  ];

  constructor() {
    addIcons({
      homeOutline,
      peopleOutline,
      medkitOutline,
      calendarOutline,
      documentTextOutline,
      walletOutline,
      cardOutline,
      folderOutline,
      fitnessOutline,
      happyOutline,
      schoolOutline,
      statsChartOutline,
      shieldOutline,
      settingsOutline,
      logOutOutline,
      personCircleOutline,
      chevronForwardOutline,
      notificationsOutline,
      helpCircleOutline
    });
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'professional': return 'Profesional';
      case 'patient': return 'Paciente';
      default: return role;
    }
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
