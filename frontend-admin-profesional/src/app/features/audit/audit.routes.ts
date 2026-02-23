import { Routes } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { AuditEffects } from '../../store/audit/audit.effects';

export const AUDIT_ROUTES: Routes = [
  {
    path: '',
    providers: [provideEffects(AuditEffects)],
    loadComponent: () => import('./audit-logs/audit-logs.page').then(m => m.AuditLogsPage)
  }
];
