import { Routes } from '@angular/router';
import { AuthGuard } from './core/auth/auth.guard';
import {
  ODONTOLOGY_SPECIALTIES,
  PSYCHOLOGY_SPECIALTIES,
  PSYCHOPEDAGOGY_SPECIALTIES
} from './core/auth/specialty-access.service';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/auth-login.page').then((m) => m.AuthLoginPage)
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    data: { roles: ['professional'] },
    loadComponent: () => import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage)
  },
  {
    path: 'patients',
    canActivate: [AuthGuard],
    data: { roles: ['professional'] },
    loadComponent: () => import('./features/patients/patients.page').then((m) => m.PatientsPage)
  },
  {
    path: 'appointments',
    canActivate: [AuthGuard],
    data: { roles: ['professional'] },
    loadComponent: () => import('./features/appointments/appointments.page').then((m) => m.AppointmentsPage)
  },
  {
    path: 'medical-records',
    canActivate: [AuthGuard],
    data: { roles: ['professional'] },
    loadComponent: () => import('./features/medical-records/medical-records.page').then((m) => m.MedicalRecordsPage)
  },
  {
    path: 'budgets',
    canActivate: [AuthGuard],
    data: { roles: ['professional'] },
    loadComponent: () => import('./features/budgets/budgets.page').then((m) => m.BudgetsPage)
  },
  {
    path: 'files',
    canActivate: [AuthGuard],
    data: { roles: ['professional'] },
    loadComponent: () => import('./features/files/files.page').then((m) => m.FilesPage)
  },
  {
    path: 'payments',
    canActivate: [AuthGuard],
    data: { roles: ['professional'] },
    loadComponent: () => import('./features/payments/payments.page').then((m) => m.PaymentsPage)
  },
  {
    path: 'odontology',
    canActivate: [AuthGuard],
    data: {
      roles: ['professional'],
      specialties: ODONTOLOGY_SPECIALTIES
    },
    loadComponent: () => import('./features/odontology/odontology.page').then((m) => m.OdontologyPage)
  },
  {
    path: 'mental-health',
    canActivate: [AuthGuard],
    data: {
      roles: ['professional'],
      specialties: [...PSYCHOLOGY_SPECIALTIES, ...PSYCHOPEDAGOGY_SPECIALTIES]
    },
    loadComponent: () => import('./features/mental-health/mental-health.page').then((m) => m.MentalHealthPage)
  },
  {
    path: 'specialties/:specialtyKey',
    canActivate: [AuthGuard],
    data: { roles: ['professional'] },
    loadComponent: () => import('./features/specialty-module/specialty-module.page').then((m) => m.SpecialtyModulePage)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
