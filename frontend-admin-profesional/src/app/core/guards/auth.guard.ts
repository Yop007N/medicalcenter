import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';
import { map, take, tap } from 'rxjs/operators';

const LOG_SOURCE = 'AuthGuard';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const logger = inject(LoggerService);

  logger.debug(LOG_SOURCE, 'Checking auth for route', { url: state.url });
  logger.debug(LOG_SOURCE, 'Sync isAuthenticated value', { isAuthenticated: authService.isAuthenticated });

  return authService.isAuthenticated$.pipe(
    take(1),
    tap((isAuthenticated) => logger.debug(LOG_SOURCE, 'isAuthenticated$ value', { isAuthenticated })),
    map((isAuthenticated) => {
      if (isAuthenticated) {
        logger.info(LOG_SOURCE, 'Access granted', { url: state.url });
        return true;
      }
      logger.warn(LOG_SOURCE, 'Access denied, redirecting to login', { url: state.url });
      router.navigate(['/auth/login']);
      return false;
    })
  );
};

export const noAuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const logger = inject(LoggerService);

  logger.debug(LOG_SOURCE, 'NoAuthGuard checking route', { url: state.url });

  return authService.isAuthenticated$.pipe(
    take(1),
    tap((isAuthenticated) => logger.debug(LOG_SOURCE, 'NoAuthGuard isAuthenticated$ value', { isAuthenticated })),
    map((isAuthenticated) => {
      if (!isAuthenticated) {
        logger.debug(LOG_SOURCE, 'NoAuthGuard: User not authenticated, access granted', { url: state.url });
        return true;
      }
      logger.info(LOG_SOURCE, 'NoAuthGuard: User already authenticated, redirecting to dashboard');
      router.navigate(['/dashboard']);
      return false;
    })
  );
};
