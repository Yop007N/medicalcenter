import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { ApiClientService } from './api-client.service';
import { SessionStoreService } from './session-store.service';
import { API_ENDPOINTS } from './api-endpoints';

export interface AuthUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly currentUserSubject = new BehaviorSubject<AuthUser | null>(null);

  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private apiClient: ApiClientService,
    private sessionStore: SessionStoreService
  ) {
    this.currentUserSubject.next(this.sessionStore.getCurrentUser());
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.apiClient
      .post<LoginResponse>(API_ENDPOINTS.auth.login, { email, password })
      .pipe(
        tap((response) => {
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
    const hasToken = Boolean(this.sessionStore.getAccessToken());

    if (!hasToken) {
      this.sessionStore.clear();
      this.currentUserSubject.next(null);
      return;
    }

    this.apiClient
      .post<{ msg: string }>(API_ENDPOINTS.auth.logout, {})
      .pipe(
        catchError(() => of(null)),
        finalize(() => {
          this.sessionStore.clear();
          this.currentUserSubject.next(null);
        })
      )
      .subscribe();
  }

  getToken(): string | null {
    return this.sessionStore.getAccessToken();
  }

  isAuthenticated(): boolean {
    return Boolean(this.getToken());
  }

  get currentUserValue(): AuthUser | null {
    return this.currentUserSubject.value;
  }
}
