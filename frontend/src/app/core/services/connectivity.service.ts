import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent, merge } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { ToastController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root'
})
export class ConnectivityService {
  private toastController = inject(ToastController);

  private onlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
  online$ = this.onlineSubject.asObservable();

  constructor() {
    this.initConnectivityListeners();
  }

  private initConnectivityListeners(): void {
    const online$ = fromEvent(window, 'online').pipe(map(() => true));
    const offline$ = fromEvent(window, 'offline').pipe(map(() => false));

    merge(online$, offline$)
      .pipe(startWith(navigator.onLine))
      .subscribe(async (isOnline) => {
        this.onlineSubject.next(isOnline);
        await this.showConnectivityToast(isOnline);
      });
  }

  private async showConnectivityToast(isOnline: boolean): Promise<void> {
    const toast = await this.toastController.create({
      message: isOnline
        ? 'Conexión restaurada. Sincronizando datos...'
        : 'Sin conexión. Trabajando en modo offline.',
      duration: 3000,
      position: 'bottom',
      color: isOnline ? 'success' : 'warning',
      icon: isOnline ? 'cloud-done-outline' : 'cloud-offline-outline'
    });
    await toast.present();
  }

  isOnline(): boolean {
    return this.onlineSubject.value;
  }

  checkConnection(): Observable<boolean> {
    return this.online$;
  }
}
