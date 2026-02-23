import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonBadge, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cloudOfflineOutline, cloudDoneOutline, syncOutline } from 'ionicons/icons';
import { ConnectivityService } from '../../../core/services/connectivity.service';
import { SyncService, SyncStatus } from '../../../core/services/sync.service';

@Component({
  selector: 'app-offline-indicator',
  standalone: true,
  imports: [CommonModule, IonBadge, IonIcon, IonSpinner],
  template: `
    <div class="offline-indicator" *ngIf="(connectivity.online$ | async) === false || (syncStatus$ | async)?.pendingCount">
      <ng-container *ngIf="(connectivity.online$ | async) === false">
        <div class="indicator offline">
          <ion-icon name="cloud-offline-outline"></ion-icon>
          <span>Sin conexión</span>
        </div>
      </ng-container>

      <ng-container *ngIf="syncStatus$ | async as status">
        <div class="indicator syncing" *ngIf="status.isSyncing">
          <ion-spinner name="dots"></ion-spinner>
          <span>Sincronizando...</span>
        </div>

        <div class="indicator pending" *ngIf="!status.isSyncing && status.pendingCount > 0">
          <ion-icon name="sync-outline"></ion-icon>
          <ion-badge color="warning">{{ status.pendingCount }}</ion-badge>
          <span>Pendientes</span>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .offline-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .indicator {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
    }

    .indicator.offline {
      background-color: var(--ion-color-danger-tint);
      color: var(--ion-color-danger-contrast);
    }

    .indicator.syncing {
      background-color: var(--ion-color-primary-tint);
      color: var(--ion-color-primary-contrast);
    }

    .indicator.pending {
      background-color: var(--ion-color-warning-tint);
      color: var(--ion-color-warning-contrast);
    }

    ion-icon {
      font-size: 16px;
    }

    ion-spinner {
      width: 16px;
      height: 16px;
    }

    ion-badge {
      font-size: 10px;
      padding: 2px 6px;
    }
  `]
})
export class OfflineIndicatorComponent {
  connectivity = inject(ConnectivityService);
  private syncService = inject(SyncService);

  syncStatus$ = this.syncService.syncStatus$;

  constructor() {
    addIcons({ cloudOfflineOutline, cloudDoneOutline, syncOutline });
  }
}
