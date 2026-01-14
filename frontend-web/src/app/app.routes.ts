import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    // TODO: Restore when auth feature is implemented
    // loadChildren: () => import('./features/auth/auth-routing.module').then(m => m.AuthRoutingModule)
    loadComponent: () => import('./core/pages/not-found/not-found.component').then(m => m.NotFoundComponent)
  },
  {
    path: 'dashboard',
    // TODO: Restore when dashboard feature is implemented
    // loadChildren: () => import('./features/dashboard/dashboard-routing.module').then(m => m.DashboardRoutingModule)
    loadComponent: () => import('./core/pages/not-found/not-found.component').then(m => m.NotFoundComponent)
  },
  {
    path: 'professionals',
    // TODO: Restore when professionals feature is implemented
    // loadChildren: () => import('./features/professionals/professionals-routing.module').then(m => m.ProfessionalsRoutingModule)
    loadComponent: () => import('./core/pages/not-found/not-found.component').then(m => m.NotFoundComponent)
  },
  {
    path: 'patients',
    // TODO: Restore when patients feature is implemented
    // loadChildren: () => import('./features/patients/patients-routing.module').then(m => m.PatientsRoutingModule)
    loadComponent: () => import('./core/pages/not-found/not-found.component').then(m => m.NotFoundComponent)
  },
  {
    path: 'appointments',
    // TODO: Restore when appointments feature is implemented
    // loadChildren: () => import('./features/appointments/appointments-routing.module').then(m => m.AppointmentsRoutingModule)
    loadComponent: () => import('./core/pages/not-found/not-found.component').then(m => m.NotFoundComponent)
  },
  {
    path: 'medical-records',
    // TODO: Restore when medical-records feature is implemented
    // loadChildren: () => import('./features/medical-records/medical-records-routing.module').then(m => m.MedicalRecordsRoutingModule)
    loadComponent: () => import('./core/pages/not-found/not-found.component').then(m => m.NotFoundComponent)
  },
  {
    path: 'budgets',
    // TODO: Restore when budgets feature is implemented
    // loadChildren: () => import('./features/budgets/budgets-routing.module').then(m => m.BudgetsRoutingModule)
    loadComponent: () => import('./core/pages/not-found/not-found.component').then(m => m.NotFoundComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./core/pages/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
