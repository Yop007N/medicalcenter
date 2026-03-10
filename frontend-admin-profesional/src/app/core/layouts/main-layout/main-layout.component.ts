import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, of } from 'rxjs';
import { catchError, distinctUntilChanged, map, shareReplay, switchMap } from 'rxjs/operators';
import {
  IonSplitPane,
  IonMenu,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonMenuToggle,
  IonRouterOutlet,
  IonFooter,
  IonAvatar,
  IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  peopleOutline,
  medkitOutline,
  calendarOutline,
  documentTextOutline,
  folderOpenOutline,
  walletOutline,
  cardOutline,
  fitnessOutline,
  happyOutline,
  schoolOutline,
  statsChartOutline,
  shieldOutline,
  logOutOutline,
  personCircleOutline,
  chevronBackOutline,
  chevronForwardOutline,
  notificationsOutline,
  helpCircleOutline,
  menuOutline
} from 'ionicons/icons';
import { MenuController } from '@ionic/angular';
import { selectUser } from '../../../store/auth/auth.selectors';
import * as AuthActions from '../../../store/auth/auth.actions';
import { PwaUpdateService } from '../../services/pwa-update.service';
import { ConnectivityService } from '../../services/connectivity.service';
import { PushNotificationsService } from '../../services/push-notifications.service';
import { AuthService } from '../../services/auth.service';
import {
  SpecialtiesApiService,
  SpecialtyModuleDefinition
} from '../../services/specialties-api.service';
import {
  resolveSpecialtyFrontendRoute,
  resolveSpecialtyMenuIcon,
} from '../../constants/specialty-navigation';
import { OfflineIndicatorComponent } from '../../../shared/components/offline-indicator/offline-indicator.component';
import { User } from '../../../models';

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
    IonContent,
    IonList,
    IonItem,
    IonIcon,
    IonLabel,
    IonMenuToggle,
    IonRouterOutlet,
    IonFooter,
    IonAvatar,
    IonBadge,
    OfflineIndicatorComponent
  ],
  template: `
    <ion-split-pane contentId="main-content" [when]="'lg'">
      <ion-menu contentId="main-content" type="overlay" class="medical-menu" [disabled]="!isSidebarVisible">
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
          <div class="menu-header-actions">
            <app-offline-indicator></app-offline-indicator>
            <button
              type="button"
              class="menu-visibility-toggle"
              (click)="toggleSidebar()"
              aria-label="Ocultar menú lateral"
              title="Ocultar menú lateral"
            >
              <ion-icon name="chevron-back-outline"></ion-icon>
            </button>
          </div>
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
          @for (group of (visibleMenuGroups$ | async) ?? []; track group.title) {
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

      @if (!isSidebarVisible) {
        <button
          type="button"
          class="sidebar-reopen-button"
          (click)="showSidebar()"
          aria-label="Mostrar menú lateral"
        >
          <ion-icon name="menu-outline"></ion-icon>
        </button>
      }

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
      justify-content: flex-start;
      gap: 8px;
      padding: 20px 16px;
      background: var(--medical-bg-card);
      border-bottom: 1px solid var(--medical-border-light);
    }

    .menu-header-actions {
      align-items: center;
      display: inline-flex;
      gap: 8px;
      margin-left: auto;
    }

    .menu-visibility-toggle {
      align-items: center;
      background: rgba(var(--ion-color-primary-rgb), 0.08);
      border: 1px solid var(--medical-border-light);
      border-radius: 999px;
      color: var(--ion-color-medium);
      cursor: pointer;
      display: inline-flex;
      height: 34px;
      justify-content: center;
      min-width: 34px;
      padding: 0;
      transition: all 0.2s ease;
      width: 34px;

      ion-icon {
        font-size: 16px;
      }

      &:hover {
        border-color: rgba(var(--ion-color-primary-rgb), 0.35);
        color: var(--ion-color-primary);
        transform: translateX(-1px);
      }
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-icon {
      width: 40px;
      height: 40px;
      background: rgba(var(--ion-color-primary-rgb), 0.12);
      border-radius: var(--medical-radius);
      display: flex;
      align-items: center;
      justify-content: center;

      ion-icon {
        font-size: 22px;
        color: var(--ion-color-primary);
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
      color: var(--ion-color-dark);
    }

    .brand-tagline {
      font-size: 12px;
      color: var(--ion-color-medium);
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
      background: rgba(var(--ion-color-primary-rgb), 0.14);
      margin-bottom: 12px;

      ion-icon {
        font-size: 36px;
        color: var(--ion-color-primary);
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
        --background: rgba(var(--ion-color-primary-rgb), 0.08);

        .item-icon-wrapper {
          background: rgba(var(--ion-color-primary-rgb), 0.14);

          ion-icon {
            color: var(--ion-color-primary);
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

    .sidebar-reopen-button {
      align-items: center;
      background: var(--medical-bg-card);
      border: 1px solid var(--medical-border-light);
      border-radius: 999px;
      box-shadow: var(--medical-shadow-sm);
      color: var(--ion-color-primary);
      cursor: pointer;
      display: inline-flex;
      height: 36px;
      justify-content: center;
      left: 10px;
      position: fixed;
      top: calc(var(--ion-safe-area-top, 0px) + 76px);
      width: 36px;
      z-index: 250;

      ion-icon {
        font-size: 18px;
      }
    }

    @media (max-width: 991.98px) {
      .menu-visibility-toggle,
      .sidebar-reopen-button {
        display: none;
      }
    }

    /* Theme is fixed to light from global stylesheet */
  `]
})
export class MainLayoutComponent {
  private store = inject(Store);
  private readonly menuController = inject(MenuController);
  private readonly authService = inject(AuthService);
  private readonly specialtiesApi = inject(SpecialtiesApiService);
  private readonly pwaUpdateService = inject(PwaUpdateService);
  private readonly connectivityService = inject(ConnectivityService);
  private readonly pushNotificationsService = inject(PushNotificationsService);
  private readonly sidebarStorageKey = 'ms.admin.sidebar.visible';

  isSidebarVisible = this.getInitialSidebarVisibility();

  user$ = combineLatest([
    this.store.select(selectUser),
    this.authService.currentUser$
  ]).pipe(
    map(([storeUser, runtimeUser]) => this.resolveUser(storeUser, runtimeUser)),
    distinctUntilChanged(
      (prev, curr) =>
        prev?.id === curr?.id &&
        prev?.role === curr?.role &&
        prev?.specialty === curr?.specialty
    ),
    shareReplay(1)
  );

  specialtyCatalog$ = this.specialtiesApi.getCatalog().pipe(
    catchError(() => of([] as SpecialtyModuleDefinition[])),
    shareReplay(1)
  );

  mySpecialtyModule$ = this.user$.pipe(
    switchMap((user) => {
      if (user?.role !== 'professional') {
        return of(null as SpecialtyModuleDefinition | null);
      }
      return this.specialtiesApi.getMyModule().pipe(
        map((response) => response.module),
        catchError(() => of(null as SpecialtyModuleDefinition | null))
      );
    }),
    shareReplay(1)
  );

  visibleMenuGroups$ = combineLatest([
    this.user$,
    this.specialtyCatalog$,
    this.mySpecialtyModule$
  ]).pipe(
    map(([user, catalog, myModule]) => this.buildMenuGroups(user, catalog, myModule))
  );

  private readonly baseMenuGroups: MenuGroup[] = [
    {
      title: 'Principal',
      items: [
        { title: 'Dashboard', url: '/dashboard', icon: 'home-outline' }
      ]
    },
    {
      title: 'Gestion',
      items: [
        { title: 'Pacientes', url: '/patients', icon: 'people-outline', roles: ['admin'] },
        { title: 'Profesionales', url: '/professionals', icon: 'medkit-outline', roles: ['admin'] },
        { title: 'Citas', url: '/appointments', icon: 'calendar-outline', badge: 3, roles: ['admin'] },
        { title: 'Historiales', url: '/medical-records', icon: 'document-text-outline', roles: ['admin'] },
        { title: 'Archivos', url: '/files', icon: 'folder-open-outline', roles: ['admin'] },
        { title: 'Presupuestos', url: '/budgets', icon: 'wallet-outline', roles: ['admin'] },
        { title: 'Pagos', url: '/payments', icon: 'card-outline', roles: ['admin'] }
      ]
    },
    {
      title: 'Administracion',
      items: [
        { title: 'Reportes', url: '/reports', icon: 'stats-chart-outline', roles: ['admin'] },
        { title: 'Auditoria', url: '/audit', icon: 'shield-outline', roles: ['admin'] }
      ]
    }
  ];

  constructor() {
    void this.initializeShellServices();

    addIcons({
      homeOutline,
      peopleOutline,
      medkitOutline,
      calendarOutline,
      documentTextOutline,
      folderOpenOutline,
      walletOutline,
      cardOutline,
      fitnessOutline,
      happyOutline,
      schoolOutline,
      statsChartOutline,
      shieldOutline,
      logOutOutline,
      personCircleOutline,
      chevronForwardOutline,
      notificationsOutline,
      chevronBackOutline,
      helpCircleOutline,
      menuOutline
    });
  }

  private getInitialSidebarVisibility(): boolean {
    if (typeof window === 'undefined') {
      return true;
    }
    return window.localStorage.getItem(this.sidebarStorageKey) !== 'false';
  }

  private persistSidebarVisibility(): void {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(this.sidebarStorageKey, String(this.isSidebarVisible));
  }

  toggleSidebar(): void {
    this.isSidebarVisible = !this.isSidebarVisible;
    this.persistSidebarVisibility();

    if (!this.isSidebarVisible) {
      void this.menuController.close();
    }
  }

  showSidebar(): void {
    if (!this.isSidebarVisible) {
      this.isSidebarVisible = true;
      this.persistSidebarVisibility();
    }
  }

  private async initializeShellServices(): Promise<void> {
    void this.pwaUpdateService;
    void this.connectivityService;

    try {
      await this.pushNotificationsService.initialize();
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  }

  private buildMenuGroups(
    user: User | null,
    catalog: SpecialtyModuleDefinition[],
    myModule: SpecialtyModuleDefinition | null
  ): MenuGroup[] {
    const groups = this.baseMenuGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => this.canAccess(item.roles, user?.role))
      }))
      .filter((group) => group.items.length > 0);

    const specialtyItems = this.buildSpecialtyMenuItems(user, catalog, myModule);
    if (specialtyItems.length > 0) {
      groups.splice(2, 0, {
        title: 'Especialidades',
        items: specialtyItems
      });
    }

    return groups;
  }

  private buildSpecialtyMenuItems(
    user: User | null,
    catalog: SpecialtyModuleDefinition[],
    myModule: SpecialtyModuleDefinition | null
  ): MenuItem[] {
    if (!user || !this.canAccess(['admin'], user.role)) {
      return [];
    }

    const sourceModules = user.role === 'admin' ? catalog : myModule ? [myModule] : [];

    return sourceModules.map((module) => ({
      title: module.label,
      url: resolveSpecialtyFrontendRoute(module.key),
      icon: resolveSpecialtyMenuIcon(module.key),
      roles: ['admin']
    }));
  }

  private canAccess(roles: string[] | undefined, role?: string): boolean {
    if (!roles || roles.length === 0) {
      return true;
    }
    return !!role && roles.includes(role);
  }

  private resolveUser(storeUser: User | null, runtimeUser: User | null): User | null {
    if (storeUser?.role) {
      return storeUser;
    }
    if (runtimeUser?.role) {
      return runtimeUser;
    }
    return storeUser ?? runtimeUser ?? null;
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
