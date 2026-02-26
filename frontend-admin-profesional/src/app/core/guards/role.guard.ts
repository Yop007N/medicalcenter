import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';
import { NotificationService } from '../services/notification.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notification = inject(NotificationService);

  const allowedRoles = route.data['roles'] as string[];

  return authService.currentUser$.pipe(
    take(1),
    map((user) => {
      if (!user) {
        router.navigate(['/auth/login']);
        return false;
      }

      if (allowedRoles && allowedRoles.length > 0) {
        if (allowedRoles.includes(user.role)) {
          return true;
        }
        notification.showError('No tiene permisos para acceder a esta sección');
        router.navigate(['/auth/login'], {
          queryParams: { reason: 'role' }
        });
        return false;
      }

      return true;
    })
  );
};
