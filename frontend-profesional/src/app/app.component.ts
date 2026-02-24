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
    { path: '/budgets', label: 'Presupuestos' },
    { path: '/payments', label: 'Pagos' },
    { path: '/reports', label: 'Reportes' }
  ];

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/auth/login']);
  }
}
