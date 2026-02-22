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
    loadComponent: () => import('./pages/dashboard.page').then((m) => m.DashboardPage)
  },
  {
    path: 'professionals',
    canActivate: [AuthGuard],
    loadComponent: () => import('./pages/professionals.page').then((m) => m.ProfessionalsPage)
  },
  {
    path: 'patients',
    canActivate: [AuthGuard],
    loadComponent: () => import('./pages/patients.page').then((m) => m.PatientsPage)
  },
  {
    path: 'appointments',
    canActivate: [AuthGuard],
    loadComponent: () => import('./pages/appointments.page').then((m) => m.AppointmentsPage)
  },
  {
    path: 'medical-records',
    canActivate: [AuthGuard],
    loadComponent: () => import('./pages/medical-records.page').then((m) => m.MedicalRecordsPage)
  },
  {
    path: 'budgets',
    canActivate: [AuthGuard],
    loadComponent: () => import('./pages/budgets.page').then((m) => m.BudgetsPage)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
