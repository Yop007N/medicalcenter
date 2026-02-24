import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap, catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';
import { NotificationService } from '../services/notification.service';
import { Router } from '@angular/router';
import { API_ENDPOINTS } from '../api/api-endpoints';

const LOG_SOURCE = 'AuthInterceptor';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const logger = inject(LoggerService);
  const notification = inject(NotificationService);

  // Skip auth header for login/register endpoints and logs endpoint
  if (req.url.includes(API_ENDPOINTS.auth.login) ||
      req.url.includes(API_ENDPOINTS.auth.register) ||
      req.url.includes(API_ENDPOINTS.logs.frontend)) {
    // No loguear para evitar ruido
    return next(req);
  }

  return from(authService.getTokenSync()).pipe(
    switchMap((token) => {
      if (token) {
        // No loguear cada petición para evitar ruido
        req = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
      } else {
        // Solo loguear cuando NO hay token (posible problema)
        logger.warn(LOG_SOURCE, `No token available for request: ${req.method} ${req.url}`);
      }

      return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
          logger.error(LOG_SOURCE, `HTTP Error ${error.status}: ${req.method} ${req.url}`, {
            status: error.status,
            message: error.message,
            error: error.error
          });

          if (error.status === 401 && !req.url.includes(API_ENDPOINTS.auth.refresh)) {
            logger.info(LOG_SOURCE, 'Token expired, attempting refresh...');
            return authService.refreshToken().pipe(
              switchMap((newToken) => {
                logger.info(LOG_SOURCE, 'Token refreshed successfully');
                req = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${newToken}`
                  }
                });
                return next(req);
              }),
              catchError((refreshError) => {
                logger.error(LOG_SOURCE, 'Token refresh failed, redirecting to login', refreshError);
                notification.showWarning('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', 5000);
                authService.clearAuth();
                router.navigate(['/auth/login']);
                return throwError(() => error);
              })
            );
          }
          return throwError(() => error);
        })
      );
    })
  );
};
