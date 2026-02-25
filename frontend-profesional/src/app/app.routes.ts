import { Routes } from '@angular/router';
import { AuthGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./pages/auth-login.page').then((m) => m.AuthLoginPage)
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    data: { roles: ['professional'] },
    loadComponent: () => import('./pages/dashboard.page').then((m) => m.DashboardPage)
  },
  {
    path: 'professionals',
    canActivate: [AuthGuard],
    data: { roles: ['professional'] },
    loadComponent: () => import('./pages/professionals.page').then((m) => m.ProfessionalsPage)
  },
  {
    path: 'patients',
    canActivate: [AuthGuard],
    data: { roles: ['professional'] },
    loadComponent: () => import('./pages/patients.page').then((m) => m.PatientsPage)
  },
  {
    path: 'appointments',
    canActivate: [AuthGuard],
    data: { roles: ['professional'] },
    loadComponent: () => import('./pages/appointments.page').then((m) => m.AppointmentsPage)
  },
  {
    path: 'medical-records',
    canActivate: [AuthGuard],
    data: { roles: ['professional'] },
    loadComponent: () => import('./pages/medical-records.page').then((m) => m.MedicalRecordsPage)
  },
  {
    path: 'odontology',
    canActivate: [AuthGuard],
    data: {
      roles: ['professional'],
      specialties: ['odontologia', 'odontology', 'ortodoncia', 'odontopediatria']
    },
    loadComponent: () => import('./pages/odontology.page').then((m) => m.OdontologyPage)
  },
  {
    path: 'mental-health',
    canActivate: [AuthGuard],
    data: {
      roles: ['professional'],
      specialties: ['psicologia', 'psychology', 'psicopedagogia', 'psychopedagogy', 'psiquiatria']
    },
    loadComponent: () => import('./pages/mental-health.page').then((m) => m.MentalHealthPage)
  },
  {
    path: 'budgets',
    canActivate: [AuthGuard],
    data: { roles: ['professional'] },
    loadComponent: () => import('./pages/budgets.page').then((m) => m.BudgetsPage)
  },
  {
    path: 'files',
    canActivate: [AuthGuard],
    data: { roles: ['professional'] },
    loadComponent: () => import('./pages/files.page').then((m) => m.FilesPage)
  },
  {
    path: 'payments',
    canActivate: [AuthGuard],
    data: { roles: ['professional'] },
    loadComponent: () => import('./pages/payments.page').then((m) => m.PaymentsPage)
  },
  {
    path: 'reports',
    canActivate: [AuthGuard],
    data: { roles: ['professional'] },
    loadComponent: () => import('./pages/reports.page').then((m) => m.ReportsPage)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
