import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { SessionUser } from './session-store.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!this.authService.isAuthenticated()) {
      // Not logged in, redirect to login page
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    const user = this.authService.currentUserValue;
    const allowedRoles = (route.data['roles'] as string[] | undefined) ?? [];
    const allowedSpecialties = (route.data['specialties'] as string[] | undefined) ?? [];

    if (user && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      this.authService.logout();
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: state.url, access: 'denied-role' }
      });
      return false;
    }

    if (user && allowedSpecialties.length > 0 && !this.hasSpecialtyAccess(user, allowedSpecialties)) {
      this.router.navigate(['/dashboard']);
      return false;
    }

    return true;
  }

  private hasSpecialtyAccess(user: SessionUser, specialties: string[]): boolean {
    if (user.role === 'admin') {
      return true;
    }
    if (user.role !== 'professional') {
      return false;
    }

    const current = this.normalize(user.specialty);
    if (!current) {
      return false;
    }

    return specialties.some((candidate) => current.includes(this.normalize(candidate)));
  }

  private normalize(value: string | null | undefined): string {
    return (value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
