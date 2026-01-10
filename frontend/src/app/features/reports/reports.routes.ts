import { Routes } from '@angular/router';

export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./reports-home/reports-home.page').then(m => m.ReportsHomePage)
  }
];
