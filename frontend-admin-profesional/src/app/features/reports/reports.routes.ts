import { Routes } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { ReportsEffects } from '../../store/reports/reports.effects';

export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    providers: [provideEffects(ReportsEffects)],
    loadComponent: () => import('./reports-home/reports-home.page').then(m => m.ReportsHomePage)
  }
];
