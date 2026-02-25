import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from '../api/api.service';
import { API_ENDPOINTS } from '../api/api-endpoints';
import { SessionStoreService, SessionUser } from './session-store.service';

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    specialty?: string | null;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<SessionUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private api: ApiService,
    private sessionStore: SessionStoreService
  ) {
    this.currentUserSubject.next(this.sessionStore.getCurrentUser());
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.api.post<LoginResponse>(API_ENDPOINTS.auth.login, { email, password })
      .pipe(
        tap(response => {
          this.sessionStore.storeSession({
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
            user: response.user
          });
          this.currentUserSubject.next(response.user);
        })
      );
  }

  logout(): void {
    this.sessionStore.clear();
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return this.sessionStore.getAccessToken();
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  get currentUserValue(): SessionUser | null {
    return this.currentUserSubject.value;
  }
}
