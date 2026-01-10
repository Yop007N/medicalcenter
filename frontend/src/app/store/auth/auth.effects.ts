import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { of, from } from 'rxjs';
import { map, exhaustMap, catchError, tap, switchMap } from 'rxjs/operators';
import * as AuthActions from './auth.actions';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { StorageService } from '../../core/services/storage.service';
import { LoggerService } from '../../core/services/logger.service';
import { environment } from '../../../environments/environment';

const LOG_SOURCE = 'AuthEffects';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private router = inject(Router);
  private notification = inject(NotificationService);
  private storage = inject(StorageService);
  private logger = inject(LoggerService);

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      tap(({ credentials }) => this.logger.info(LOG_SOURCE, 'Login action dispatched', { email: credentials.email })),
      exhaustMap(({ credentials }) =>
        this.authService.login(credentials).pipe(
          tap((response) => this.logger.info(LOG_SOURCE, 'Login successful', {
            email: response.user?.email,
            role: response.user?.role
          })),
          map((response) =>
            AuthActions.loginSuccess({
              user: response.user,
              accessToken: response.access_token,
              refreshToken: response.refresh_token
            })
          ),
          catchError((error) => {
            this.logger.error(LOG_SOURCE, 'Login failed', {
              status: error.status,
              message: error.error?.msg || error.message
            });
            return of(AuthActions.loginFailure({
              error: error.error?.msg || 'Error al iniciar sesión'
            }));
          })
        )
      )
    )
  );

  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(({ user, accessToken }) => {
          this.logger.info(LOG_SOURCE, 'loginSuccess action received', {
            userId: user.id,
            email: user.email,
            role: user.role,
            hasToken: !!accessToken
          });
          this.notification.showSuccess(`Bienvenido, ${user.first_name || 'Usuario'}`);
        }),
        // Usar switchMap para esperar que la navegación se complete
        switchMap(() => {
          this.logger.info(LOG_SOURCE, 'Navigating to /dashboard...');
          return from(this.router.navigate(['/dashboard'])).pipe(
            tap((result) => this.logger.info(LOG_SOURCE, 'Navigation result', { success: result }))
          );
        })
      ),
    { dispatch: false }
  );

  loginFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginFailure),
        tap(({ error }) => {
          this.logger.warn(LOG_SOURCE, 'Login failure notification shown', { error });
          this.notification.showError(error);
        })
      ),
    { dispatch: false }
  );

  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.register),
      tap(({ data }) => this.logger.info(LOG_SOURCE, 'Register action dispatched', { email: data.email })),
      exhaustMap(({ data }) =>
        this.authService.register(data).pipe(
          tap((response) => this.logger.info(LOG_SOURCE, 'Registration successful', { email: response.user?.email })),
          map((response) => AuthActions.registerSuccess({ user: response.user })),
          catchError((error) => {
            this.logger.error(LOG_SOURCE, 'Registration failed', {
              status: error.status,
              message: error.error?.msg || error.message
            });
            return of(AuthActions.registerFailure({
              error: error.error?.msg || 'Error al registrarse'
            }));
          })
        )
      )
    )
  );

  registerSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.registerSuccess),
        tap(({ user }) => {
          this.logger.info(LOG_SOURCE, 'Register success, redirecting to login', { email: user?.email });
          this.notification.showSuccess('Registro exitoso. Por favor inicie sesión.');
          this.router.navigate(['/auth/login']);
        })
      ),
    { dispatch: false }
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      tap(() => this.logger.info(LOG_SOURCE, 'Logout action dispatched')),
      exhaustMap(() =>
        this.authService.logout().pipe(
          tap(() => this.logger.info(LOG_SOURCE, 'Logout API call completed')),
          map(() => AuthActions.logoutSuccess()),
          catchError((error) => {
            this.logger.warn(LOG_SOURCE, 'Logout API call failed, completing logout anyway', error);
            return of(AuthActions.logoutSuccess());
          })
        )
      )
    )
  );

  logoutSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logoutSuccess),
        tap(() => {
          this.logger.info(LOG_SOURCE, 'Logout success, redirecting to login');
          this.router.navigate(['/auth/login']);
        })
      ),
    { dispatch: false }
  );

  loadStoredAuth$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadStoredAuth),
      tap(() => this.logger.debug(LOG_SOURCE, 'loadStoredAuth action dispatched')),
      switchMap(() =>
        from(Promise.all([
          this.storage.get<string>(environment.tokenKey),
          this.storage.get('current_user')
        ])).pipe(
          map(([token, user]) => {
            if (token && user) {
              this.logger.info(LOG_SOURCE, 'Stored auth found', { hasToken: true, hasUser: true });
              return AuthActions.loadStoredAuthSuccess({
                user: user as any,
                accessToken: token
              });
            }
            this.logger.debug(LOG_SOURCE, 'No stored auth found');
            return AuthActions.loadStoredAuthFailure();
          }),
          catchError((error) => {
            this.logger.error(LOG_SOURCE, 'Error loading stored auth', error);
            return of(AuthActions.loadStoredAuthFailure());
          })
        )
      )
    )
  );
}
