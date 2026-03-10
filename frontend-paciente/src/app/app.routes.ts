import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login.page').then((m) => m.LoginPage)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    data: { roles: ['patient'] },
    loadComponent: () => import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage)
  },
  {
    path: 'my-appointments',
    canActivate: [authGuard],
    data: { roles: ['patient'] },
    loadComponent: () => import('./features/appointments/my-appointments.page').then((m) => m.MyAppointmentsPage)
  },
  {
    path: 'my-budgets',
    canActivate: [authGuard],
    data: { roles: ['patient'] },
    loadComponent: () => import('./features/budgets/my-budgets.page').then((m) => m.MyBudgetsPage)
  },
  {
    path: 'my-history',
    canActivate: [authGuard],
    data: { roles: ['patient'] },
    loadComponent: () => import('./features/history/my-history.page').then((m) => m.MyHistoryPage)
  },
  {
    path: 'my-care-plan',
    canActivate: [authGuard],
    data: { roles: ['patient'] },
    loadComponent: () => import('./features/care-plan/my-care-plan.page').then((m) => m.MyCarePlanPage)
  },
  {
    path: 'my-profile',
    canActivate: [authGuard],
    data: { roles: ['patient'] },
    loadComponent: () => import('./features/profile/my-profile.page').then((m) => m.MyProfilePage)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
