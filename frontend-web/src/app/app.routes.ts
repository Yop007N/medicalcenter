import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth-routing.module').then(m => m.AuthRoutingModule)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard-routing.module').then(m => m.DashboardRoutingModule)
  },
  {
    path: 'professionals',
    loadChildren: () => import('./features/professionals/professionals-routing.module').then(m => m.ProfessionalsRoutingModule)
  },
  {
    path: 'patients',
    loadChildren: () => import('./features/patients/patients-routing.module').then(m => m.PatientsRoutingModule)
  },
  {
    path: 'appointments',
    loadChildren: () => import('./features/appointments/appointments-routing.module').then(m => m.AppointmentsRoutingModule)
  },
  {
    path: 'medical-records',
    loadChildren: () => import('./features/medical-records/medical-records-routing.module').then(m => m.MedicalRecordsRoutingModule)
  },
  {
    path: 'budgets',
    loadChildren: () => import('./features/budgets/budgets-routing.module').then(m => m.BudgetsRoutingModule)
  },
  {
    path: '**',
    loadComponent: () => import('./core/components/page-not-found/page-not-found.component').then(m => m.PageNotFoundComponent)
  }
];
