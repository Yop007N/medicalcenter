import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { OfflineService } from './offline.service';
import { ApiClientService } from './api-client.service';
import { API_ENDPOINTS } from './api-endpoints';

export interface SyncChange {
  entity_type: string;
  operation: 'create' | 'update' | 'delete';
  entity_id?: number | string | null;
  data?: Record<string, unknown>;
  idempotency_key?: string;
}

export interface SyncPushPayload {
  changes: SyncChange[];
}

export interface SyncPushResponse {
  synced: Array<{
    local_id: unknown;
    server_id: unknown;
    idempotent?: boolean;
  }>;
  conflicts: Array<{
    local_id: unknown;
    error: string;
  }>;
}

export interface SyncPullResponse {
  changes: Array<{
    entity_type: string;
    operation: string;
    data: Record<string, unknown>;
  }>;
  timestamp: string;
}

export interface SyncStatus {
  pending: number;
  failed: number;
  completed: number;
  last_sync: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private readonly pendingChangesKey = 'pending_sync_changes';

  constructor(
    private apiClient: ApiClientService,
    private offlineService: OfflineService
  ) {
    this.offlineService.online$.subscribe((online) => {
      if (online) {
        this.syncPendingChanges();
      }
    });
  }

  queueChange(change: SyncChange): void {
    const pendingChanges = this.getPendingChanges();
    pendingChanges.push({
      ...change,
      idempotency_key: change.idempotency_key ?? this.generateIdempotencyKey()
    });
    localStorage.setItem(this.pendingChangesKey, JSON.stringify(pendingChanges));
  }

  getPendingChanges(): SyncChange[] {
    const raw = localStorage.getItem(this.pendingChangesKey);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as SyncChange[]) : [];
    } catch {
      return [];
    }
  }

  clearPendingChanges(): void {
    localStorage.removeItem(this.pendingChangesKey);
  }

  syncPendingChanges(): void {
    if (this.offlineService.isOffline) {
      return;
    }

    const pendingChanges = this.getPendingChanges();
    if (pendingChanges.length === 0) {
      return;
    }

    this.pushToServer({ changes: pendingChanges })
      .pipe(
        catchError((error) => {
          console.error('Sync push failed', error);
          return of(null);
        })
      )
      .subscribe((response) => {
        if (!response) {
          return;
        }

        if (response.conflicts.length > 0) {
          console.warn('Sync conflicts detected', response.conflicts);
          return;
        }

        this.clearPendingChanges();

        this.pullFromServer()
          .pipe(
            catchError((error) => {
              console.error('Sync pull failed after push', error);
              return of(null);
            })
          )
          .subscribe();
      });
  }

  getSyncStatus(): Observable<SyncStatus> {
    return this.apiClient.get<SyncStatus>(API_ENDPOINTS.sync.status);
  }

  pullFromServer(since?: string): Observable<SyncPullResponse> {
    return this.apiClient.get<SyncPullResponse>(API_ENDPOINTS.sync.pull, {
      since
    });
  }

  pushToServer(payload: SyncPushPayload): Observable<SyncPushResponse> {
    return this.apiClient.post<SyncPushResponse>(API_ENDPOINTS.sync.push, payload);
  }

  private generateIdempotencyKey(): string {
    const randomPart = Math.random().toString(36).slice(2, 10);
    return `sync-${Date.now()}-${randomPart}`;
  }
}
