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
    loadComponent: () => import('./pages/auth-login.page').then((m) => m.AuthLoginPage)
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    data: { roles: ['professional'] },
    loadComponent: () => import('./pages/dashboard.page').then((m) => m.DashboardPage)
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
      specialties: ODONTOLOGY_SPECIALTIES
    },
    loadComponent: () => import('./pages/odontology.page').then((m) => m.OdontologyPage)
  },
  {
    path: 'mental-health',
    canActivate: [AuthGuard],
    data: {
      roles: ['professional'],
      specialties: [...PSYCHOLOGY_SPECIALTIES, ...PSYCHOPEDAGOGY_SPECIALTIES]
    },
    loadComponent: () => import('./pages/mental-health.page').then((m) => m.MentalHealthPage)
  },
  {
    path: 'specialties/:specialtyKey',
    canActivate: [AuthGuard],
    data: { roles: ['professional'] },
    loadComponent: () => import('./pages/specialty-module.page').then((m) => m.SpecialtyModulePage)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
