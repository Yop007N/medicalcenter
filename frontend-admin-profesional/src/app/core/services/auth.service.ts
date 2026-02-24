import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { map, tap, switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../api/api-endpoints';
import { ApiClientService } from '../api/api-client.service';
import { StorageService } from './storage.service';
import { LoggerService } from './logger.service';
import { User, LoginRequest, LoginResponse, RegisterRequest } from '../../models';

const LOG_SOURCE = 'AuthService';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiClient = inject(ApiClientService);
  private storage = inject(StorageService);
  private logger = inject(LoggerService);

  private _currentUser = new BehaviorSubject<User | null>(null);
  private _isAuthenticated = new BehaviorSubject<boolean>(false);

  currentUser$: Observable<User | null> = this._currentUser.asObservable();
  isAuthenticated$: Observable<boolean> = this._isAuthenticated.asObservable();

  constructor() {
    this.loadStoredAuth();
  }

  private async loadStoredAuth(): Promise<void> {
    this.logger.debug(LOG_SOURCE, 'Loading stored auth...');
    const token = await this.storage.get<string>(environment.tokenKey);
    const user = await this.storage.get<User>('current_user');

    if (token && user) {
      this.logger.info(LOG_SOURCE, 'Found stored auth, restoring session', { email: user.email });
      this._currentUser.next(user);
      this._isAuthenticated.next(true);
    } else {
      this.logger.debug(LOG_SOURCE, 'No stored auth found');
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    this.logger.info(LOG_SOURCE, 'Login initiated', { email: credentials.email });
    return this.apiClient.post<LoginResponse>(API_ENDPOINTS.auth.login, credentials).pipe(
      tap((response) => this.logger.info(LOG_SOURCE, 'Server response received', {
        email: response.user?.email,
        hasAccessToken: !!response.access_token,
        hasRefreshToken: !!response.refresh_token
      })),
      switchMap(async (response) => {
        this.logger.debug(LOG_SOURCE, 'Saving tokens to storage...');
        // Importante: usar switchMap con async para esperar que se guarden los tokens
        await this.storage.set(environment.tokenKey, response.access_token);
        this.logger.debug(LOG_SOURCE, 'Access token saved');
        await this.storage.set(environment.refreshTokenKey, response.refresh_token);
        this.logger.debug(LOG_SOURCE, 'Refresh token saved');
        await this.storage.set('current_user', response.user);
        this.logger.debug(LOG_SOURCE, 'User saved to storage');
        this._currentUser.next(response.user);
        this._isAuthenticated.next(true);
        this.logger.info(LOG_SOURCE, 'Login complete - isAuthenticated set to TRUE');
        return response;
      })
    );
  }

  register(data: RegisterRequest): Observable<{ msg: string; user: User }> {
    this.logger.info(LOG_SOURCE, 'Registration initiated', { email: data.email });
    return this.apiClient.post<{ msg: string; user: User }>(API_ENDPOINTS.auth.register, data).pipe(
      tap((response) => this.logger.info(LOG_SOURCE, 'Registration successful', { email: response.user?.email })),
      catchError((error) => {
        this.logger.error(LOG_SOURCE, 'Registration failed', error);
        throw error;
      })
    );
  }

  logout(): Observable<void> {
    this.logger.info(LOG_SOURCE, 'Logout initiated');
    return this.apiClient.post<void>(API_ENDPOINTS.auth.logout, {}).pipe(
      catchError((error) => {
        this.logger.warn(LOG_SOURCE, 'Logout API call failed, clearing local auth anyway', error);
        return of(undefined);
      }),
      switchMap(async () => {
        await this.clearAuth();
        this.logger.info(LOG_SOURCE, 'Logout complete');
      })
    );
  }

  async clearAuth(): Promise<void> {
    this.logger.debug(LOG_SOURCE, 'Clearing auth data...');
    await this.storage.remove(environment.tokenKey);
    await this.storage.remove(environment.refreshTokenKey);
    await this.storage.remove('current_user');
    this._currentUser.next(null);
    this._isAuthenticated.next(false);
    this.logger.info(LOG_SOURCE, 'Auth data cleared');
  }

  refreshToken(): Observable<string> {
    this.logger.debug(LOG_SOURCE, 'Token refresh initiated');
    return from(this.storage.get<string>(environment.refreshTokenKey)).pipe(
      switchMap((refreshToken) => {
        if (!refreshToken) {
          this.logger.error(LOG_SOURCE, 'No refresh token available');
          throw new Error('No refresh token available');
        }
        this.logger.debug(LOG_SOURCE, 'Calling refresh token API');
        return this.apiClient.post<{ access_token: string }>(
          API_ENDPOINTS.auth.refresh,
          {},
          { headers: { Authorization: `Bearer ${refreshToken}` } }
        );
      }),
      tap(async (response) => {
        this.logger.debug(LOG_SOURCE, 'Token refreshed, saving new access token');
        await this.storage.set(environment.tokenKey, response.access_token);
      }),
      map((response) => response.access_token),
      catchError((error) => {
        this.logger.error(LOG_SOURCE, 'Token refresh failed', error);
        throw error;
      })
    );
  }

  getToken(): Observable<string | null> {
    return from(this.storage.get<string>(environment.tokenKey));
  }

  async getTokenSync(): Promise<string | null> {
    return this.storage.get<string>(environment.tokenKey);
  }

  get currentUser(): User | null {
    return this._currentUser.value;
  }

  get isAuthenticated(): boolean {
    return this._isAuthenticated.value;
  }
}
