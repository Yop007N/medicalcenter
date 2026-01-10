import { Injectable } from '@angular/core';
import { Network, ConnectionStatus } from '@capacitor/network';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NetworkService {
  private _isOnline = new BehaviorSubject<boolean>(true);
  private _connectionType = new BehaviorSubject<string>('unknown');

  isOnline$: Observable<boolean> = this._isOnline.asObservable();
  connectionType$: Observable<string> = this._connectionType.asObservable();

  constructor() {
    this.initNetworkListener();
  }

  private async initNetworkListener(): Promise<void> {
    try {
      const status = await Network.getStatus();
      this.updateStatus(status);

      Network.addListener('networkStatusChange', (status) => {
        this.updateStatus(status);
      });
    } catch (error) {
      console.warn('Network plugin not available, assuming online:', error);
      this._isOnline.next(true);
    }
  }

  private updateStatus(status: ConnectionStatus): void {
    this._isOnline.next(status.connected);
    this._connectionType.next(status.connectionType);

    if (status.connected) {
      console.log('Network connected:', status.connectionType);
    } else {
      console.log('Network disconnected');
    }
  }

  get isOnline(): boolean {
    return this._isOnline.value;
  }

  get connectionType(): string {
    return this._connectionType.value;
  }

  async getStatus(): Promise<ConnectionStatus> {
    return Network.getStatus();
  }
}
