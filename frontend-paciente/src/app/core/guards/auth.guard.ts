import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

const normalizeRole = (role: string | undefined | null): string =>
  (role ?? '').trim().toLowerCase();

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  const user = authService.currentUserValue;
  const allowedRoles = ((route.data?.['roles'] as string[] | undefined) ?? ['patient']).map(
    (role) => normalizeRole(role)
  );
  const userRole = normalizeRole(user?.role);

  if (!allowedRoles.includes(userRole)) {
    authService.logout();
    return router.createUrlTree(['/auth/login'], {
      queryParams: { returnUrl: state.url, reason: 'role' }
    });
  }

  return true;
};
