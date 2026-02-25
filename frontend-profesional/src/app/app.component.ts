import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthService } from './core/auth/auth.service';
import { LoadingBarComponent } from './shared/components/loading-bar/loading-bar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LoadingBarComponent, AsyncPipe],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly currentUser$ = this.authService.currentUser$;
  readonly isAuthenticated$ = this.currentUser$.pipe(map((user) => Boolean(user)));

  navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/professionals', label: 'Profesionales' },
    { path: '/patients', label: 'Pacientes' },
    { path: '/appointments', label: 'Citas' },
    { path: '/medical-records', label: 'Registros' },
    {
      path: '/odontology',
      label: 'Odontologia',
      specialties: ['odontologia', 'odontology', 'ortodoncia', 'odontopediatria']
    },
    {
      path: '/mental-health',
      label: 'Salud Mental',
      specialties: ['psicologia', 'psychology', 'psicopedagogia', 'psychopedagogy', 'psiquiatria']
    },
    { path: '/budgets', label: 'Presupuestos' },
    { path: '/files', label: 'Archivos' },
    { path: '/payments', label: 'Pagos' },
    { path: '/reports', label: 'Reportes' }
  ];

  readonly visibleNavItems$ = this.currentUser$.pipe(
    map((user) => {
      if (!user) {
        return [];
      }
      return this.navItems.filter((item) => this.hasNavAccess(user.specialty, item.specialties));
    })
  );

  private hasNavAccess(specialty: string | null | undefined, allowed: string[] | undefined): boolean {
    if (!allowed || allowed.length === 0) {
      return true;
    }
    const normalizedSpecialty = this.normalize(specialty);
    if (!normalizedSpecialty) {
      return false;
    }
    return allowed.some((candidate) => normalizedSpecialty.includes(this.normalize(candidate)));
  }

  private normalize(value: string | null | undefined): string {
    return (value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/auth/login']);
  }
}
