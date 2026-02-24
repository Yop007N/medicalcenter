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
    loadComponent: () => import('./pages/login.page').then((m) => m.LoginPage)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard.page').then((m) => m.DashboardPage)
  },
  {
    path: 'my-appointments',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/my-appointments.page').then((m) => m.MyAppointmentsPage)
  },
  {
    path: 'my-budgets',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/my-budgets.page').then((m) => m.MyBudgetsPage)
  },
  {
    path: 'my-history',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/my-history.page').then((m) => m.MyHistoryPage)
  },
  {
    path: 'my-profile',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/my-profile.page').then((m) => m.MyProfilePage)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
