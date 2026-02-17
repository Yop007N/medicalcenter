import { Routes } from '@angular/router';
import { PlaceholderComponent } from './shared/components/placeholder/placeholder.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    component: PlaceholderComponent
  },
  {
    path: 'dashboard',
    component: PlaceholderComponent
  },
  {
    path: 'professionals',
    component: PlaceholderComponent
  },
  {
    path: 'patients',
    component: PlaceholderComponent
  },
  {
    path: 'appointments',
    component: PlaceholderComponent
  },
  {
    path: 'medical-records',
    component: PlaceholderComponent
  },
  {
    path: 'budgets',
    component: PlaceholderComponent
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
