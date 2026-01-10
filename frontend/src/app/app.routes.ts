import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: '',
    loadComponent: () => import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
      },
      {
        path: 'patients',
        loadChildren: () => import('./features/patients/patients.routes').then(m => m.PATIENTS_ROUTES)
      },
      {
        path: 'professionals',
        loadChildren: () => import('./features/professionals/professionals.routes').then(m => m.PROFESSIONALS_ROUTES)
      },
      {
        path: 'appointments',
        loadChildren: () => import('./features/appointments/appointments.routes').then(m => m.APPOINTMENTS_ROUTES)
      },
      {
        path: 'medical-records',
        loadChildren: () => import('./features/medical-records/medical-records.routes').then(m => m.MEDICAL_RECORDS_ROUTES)
      },
      {
        path: 'budgets',
        loadChildren: () => import('./features/budgets/budgets.routes').then(m => m.BUDGETS_ROUTES)
      },
      {
        path: 'payments',
        loadChildren: () => import('./features/payments/payments.routes').then(m => m.PAYMENTS_ROUTES)
      },
      {
        path: 'odontology',
        loadChildren: () => import('./features/odontology/odontology.routes').then(m => m.ODONTOLOGY_ROUTES)
      },
      {
        path: 'psychology',
        loadChildren: () => import('./features/psychology/psychology.routes').then(m => m.PSYCHOLOGY_ROUTES)
      },
      {
        path: 'psychopedagogy',
        loadChildren: () => import('./features/psychopedagogy/psychopedagogy.routes').then(m => m.PSYCHOPEDAGOGY_ROUTES)
      },
      {
        path: 'reports',
        loadChildren: () => import('./features/reports/reports.routes').then(m => m.REPORTS_ROUTES)
      },
      {
        path: 'audit',
        loadChildren: () => import('./features/audit/audit.routes').then(m => m.AUDIT_ROUTES)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
