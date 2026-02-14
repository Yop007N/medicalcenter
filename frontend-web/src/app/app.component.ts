import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LoadingBarComponent } from './shared/components/loading-bar/loading-bar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LoadingBarComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/professionals', label: 'Profesionales' },
    { path: '/patients', label: 'Pacientes' },
    { path: '/appointments', label: 'Citas' },
    { path: '/medical-records', label: 'Registros' },
    { path: '/budgets', label: 'Presupuestos' }
  ];
}
