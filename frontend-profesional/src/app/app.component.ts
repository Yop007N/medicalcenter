import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { combineLatest, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';
import { AuthService } from './core/auth/auth.service';
import { SessionUser } from './core/auth/session-store.service';
import { SpecialtyAccessService, SpecialtyModuleDefinition } from './core/auth/specialty-access.service';
import { SpecialtyModuleService } from './core/services/specialty-module.service';
import { LoadingBarComponent } from './shared/components/loading-bar/loading-bar.component';

type NavItem = {
  path: string;
  label: string;
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LoadingBarComponent, AsyncPipe],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  private readonly authService = inject(AuthService);
  private readonly specialtyAccess = inject(SpecialtyAccessService);
  private readonly specialtyModuleService = inject(SpecialtyModuleService);
  private readonly router = inject(Router);

  readonly currentUser$ = this.authService.currentUser$;
  readonly isAuthenticated$ = this.currentUser$.pipe(map((user) => Boolean(user)));

  readonly specialtyModule$ = this.currentUser$.pipe(
    switchMap((user) => {
      if (!user || user.role !== 'professional') {
        return of(null as SpecialtyModuleDefinition | null);
      }
      return this.specialtyModuleService.getMyModule().pipe(
        map((payload) => payload.module),
        catchError(() => of(this.specialtyAccess.resolveSpecialtyModule(user.specialty)))
      );
    }),
    shareReplay(1)
  );

  readonly visibleNavItems$ = combineLatest([this.currentUser$, this.specialtyModule$]).pipe(
    map(([user, specialtyModule]) => {
      if (!user) {
        return [];
      }
      return this.buildNavItems(user, specialtyModule);
    })
  );

  private buildNavItems(
    user: SessionUser,
    specialtyModule: SpecialtyModuleDefinition | null
  ): NavItem[] {
    const items: NavItem[] = [];
    if (user.role !== 'professional') {
      return items;
    }

    if (specialtyModule) {
      items.push({
        path: specialtyModule.route,
        label: specialtyModule.label
      });
    }

    items.push(
      { path: '/dashboard', label: 'Dashboard' },
      { path: '/patients', label: 'Pacientes' },
      { path: '/appointments', label: 'Citas' },
      { path: '/medical-records', label: 'Registros' }
    );

    return items;
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/auth/login']);
  }
}
