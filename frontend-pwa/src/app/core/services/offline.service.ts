import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent, merge, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class OfflineService {
  private onlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
  public online$ = this.onlineSubject.asObservable();

  constructor() {
    // Listen to online/offline events
    merge(
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    ).subscribe(online => {
      this.onlineSubject.next(online);
    });
  }

  get isOnline(): boolean {
    return this.onlineSubject.value;
  }

  get isOffline(): boolean {
    return !this.onlineSubject.value;
  }
}
