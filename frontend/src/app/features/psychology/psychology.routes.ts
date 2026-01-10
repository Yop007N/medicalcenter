import { Routes } from '@angular/router';

export const PSYCHOLOGY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./psychology-home/psychology-home.page').then(m => m.PsychologyHomePage)
  },
  {
    path: 'evaluations',
    loadComponent: () => import('./psychology-home/psychology-home.page').then(m => m.PsychologyHomePage) // Placeholder
  },
  {
    path: 'evaluations/new',
    loadComponent: () => import('./psychology-home/psychology-home.page').then(m => m.PsychologyHomePage) // Placeholder
  },
  {
    path: 'evaluations/:id',
    loadComponent: () => import('./psychology-home/psychology-home.page').then(m => m.PsychologyHomePage) // Placeholder
  },
  {
    path: 'sessions',
    loadComponent: () => import('./psychology-home/psychology-home.page').then(m => m.PsychologyHomePage) // Placeholder
  },
  {
    path: 'sessions/:id',
    loadComponent: () => import('./psychology-home/psychology-home.page').then(m => m.PsychologyHomePage) // Placeholder
  }
];
