import { Routes } from '@angular/router';

export const PSYCHOPEDAGOGY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./psychopedagogy-home/psychopedagogy-home.page').then(m => m.PsychopedagogyHomePage)
  },
  {
    path: 'evaluations',
    loadComponent: () => import('./psychopedagogy-home/psychopedagogy-home.page').then(m => m.PsychopedagogyHomePage) // Placeholder
  },
  {
    path: 'evaluations/new',
    loadComponent: () => import('./psychopedagogy-home/psychopedagogy-home.page').then(m => m.PsychopedagogyHomePage) // Placeholder
  },
  {
    path: 'evaluations/:id',
    loadComponent: () => import('./psychopedagogy-home/psychopedagogy-home.page').then(m => m.PsychopedagogyHomePage) // Placeholder
  },
  {
    path: 'sessions',
    loadComponent: () => import('./psychopedagogy-home/psychopedagogy-home.page').then(m => m.PsychopedagogyHomePage) // Placeholder
  },
  {
    path: 'sessions/:id',
    loadComponent: () => import('./psychopedagogy-home/psychopedagogy-home.page').then(m => m.PsychopedagogyHomePage) // Placeholder
  }
];
