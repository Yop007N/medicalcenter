import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OfflineService } from './offline.service';

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private readonly API_URL = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private offlineService: OfflineService
  ) {
    // Listen to online status and sync when back online
    this.offlineService.online$.subscribe(online => {
      if (online) {
        this.syncPendingChanges();
      }
    });
  }

  syncPendingChanges(): void {
    // TODO: Implement sync logic
    // 1. Get pending changes from IndexedDB
    // 2. Send to server
    // 3. Update local storage
    console.log('Syncing pending changes...');
  }

  getSyncStatus(): Observable<any> {
    return this.http.get(`${this.API_URL}/sync/status`);
  }

  pullFromServer(): Observable<any> {
    return this.http.post(`${this.API_URL}/sync/pull`, {});
  }

  pushToServer(data: any): Observable<any> {
    return this.http.post(`${this.API_URL}/sync/push`, data);
  }
}
