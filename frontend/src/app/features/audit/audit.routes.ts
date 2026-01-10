import { Routes } from '@angular/router';

export const AUDIT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./audit-logs/audit-logs.page').then(m => m.AuditLogsPage)
  }
];
