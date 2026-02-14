import { Routes } from '@angular/router';

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
    loadComponent: () => import('./pages/dashboard.page').then((m) => m.DashboardPage)
  },
  {
    path: 'professionals',
    loadComponent: () => import('./pages/professionals.page').then((m) => m.ProfessionalsPage)
  },
  {
    path: 'patients',
    loadComponent: () => import('./pages/patients.page').then((m) => m.PatientsPage)
  },
  {
    path: 'appointments',
    loadComponent: () => import('./pages/appointments.page').then((m) => m.AppointmentsPage)
  },
  {
    path: 'medical-records',
    loadComponent: () => import('./pages/medical-records.page').then((m) => m.MedicalRecordsPage)
  },
  {
    path: 'budgets',
    loadComponent: () => import('./pages/budgets.page').then((m) => m.BudgetsPage)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
