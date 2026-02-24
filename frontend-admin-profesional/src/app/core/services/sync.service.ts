import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { OfflineStorageService, SyncQueueItem } from './offline-storage.service';
import { ConnectivityService } from './connectivity.service';
import { ToastController } from '@ionic/angular/standalone';
import { ApiClientService } from '../api/api-client.service';

export interface SyncStatus {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: number | null;
  lastSyncError: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private apiClient = inject(ApiClientService);
  private offlineStorage = inject(OfflineStorageService);
  private connectivity = inject(ConnectivityService);
  private toastController = inject(ToastController);

  private syncStatusSubject = new BehaviorSubject<SyncStatus>({
    isSyncing: false,
    pendingCount: 0,
    lastSyncTime: null,
    lastSyncError: null
  });

  syncStatus$ = this.syncStatusSubject.asObservable();

  private syncInProgress = false;
  private readonly MAX_RETRIES = 3;

  constructor() {
    this.initAutoSync();
    this.updatePendingCount();
  }

  private initAutoSync(): void {
    // Sync when coming back online
    this.connectivity.online$.subscribe(async (isOnline) => {
      if (isOnline) {
        await this.syncAll();
      }
    });
  }

  async updatePendingCount(): Promise<void> {
    const count = await this.offlineStorage.getSyncQueueCount();
    this.syncStatusSubject.next({
      ...this.syncStatusSubject.value,
      pendingCount: count
    });
  }

  async queueOperation(
    action: 'create' | 'update' | 'delete',
    entityType: string,
    endpoint: string,
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    data: any,
    entityId?: number
  ): Promise<string> {
    const id = await this.offlineStorage.addToSyncQueue({
      action,
      entityType,
      entityId,
      data,
      endpoint,
      method
    });

    await this.updatePendingCount();

    // Try to sync immediately if online
    if (this.connectivity.isOnline()) {
      this.syncAll();
    }

    return id;
  }

  async syncAll(): Promise<void> {
    if (this.syncInProgress || !this.connectivity.isOnline()) {
      return;
    }

    this.syncInProgress = true;
    this.syncStatusSubject.next({
      ...this.syncStatusSubject.value,
      isSyncing: true,
      lastSyncError: null
    });

    try {
      const queue = await this.offlineStorage.getSyncQueue();

      for (const item of queue) {
        await this.syncItem(item);
      }

      this.syncStatusSubject.next({
        ...this.syncStatusSubject.value,
        isSyncing: false,
        lastSyncTime: Date.now(),
        lastSyncError: null
      });

      await this.updatePendingCount();

      if (queue.length > 0) {
        await this.showSyncCompleteToast(queue.length);
      }
    } catch (error) {
      this.syncStatusSubject.next({
        ...this.syncStatusSubject.value,
        isSyncing: false,
        lastSyncError: error instanceof Error ? error.message : 'Error de sincronización'
      });
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncItem(item: SyncQueueItem): Promise<void> {
    try {
      await firstValueFrom(
        this.apiClient.request(item.method, item.endpoint, item.data)
      );

      // Success - remove from queue
      await this.offlineStorage.removeFromSyncQueue(item.id);
    } catch (error) {
      // Increment retry count
      item.retryCount++;

      if (item.retryCount >= this.MAX_RETRIES) {
        // Max retries reached, remove from queue and log error
        console.error(`Failed to sync item after ${this.MAX_RETRIES} retries:`, item);
        await this.offlineStorage.removeFromSyncQueue(item.id);
      } else {
        // Update retry count
        await this.offlineStorage.updateSyncQueueItem(item);
      }

      throw error;
    }
  }

  private async showSyncCompleteToast(count: number): Promise<void> {
    const toast = await this.toastController.create({
      message: `${count} operación${count > 1 ? 'es' : ''} sincronizada${count > 1 ? 's' : ''} correctamente`,
      duration: 2000,
      position: 'bottom',
      color: 'success',
      icon: 'checkmark-circle-outline'
    });
    await toast.present();
  }

  getPendingCount(): Observable<number> {
    return new Observable(subscriber => {
      this.syncStatus$.subscribe(status => {
        subscriber.next(status.pendingCount);
      });
    });
  }
}
