import { Routes } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { PsychopedagogyEffects } from '../../store/psychopedagogy/psychopedagogy.effects';

export const PSYCHOPEDAGOGY_ROUTES: Routes = [
  {
    path: '',
    providers: [provideEffects(PsychopedagogyEffects)],
    children: [
      {
        path: '',
        loadComponent: () => import('./psychopedagogy-home/psychopedagogy-home.page').then(m => m.PsychopedagogyHomePage)
      },
      {
        path: 'evaluations',
        loadComponent: () => import('./psychopedagogy-home/psychopedagogy-home.page').then(m => m.PsychopedagogyHomePage)
      },
      {
        path: 'evaluations/new',
        loadComponent: () => import('./psychopedagogy-home/psychopedagogy-home.page').then(m => m.PsychopedagogyHomePage)
      },
      {
        path: 'evaluations/:id',
        loadComponent: () => import('./psychopedagogy-home/psychopedagogy-home.page').then(m => m.PsychopedagogyHomePage)
      },
      {
        path: 'sessions',
        loadComponent: () => import('./psychopedagogy-home/psychopedagogy-home.page').then(m => m.PsychopedagogyHomePage)
      },
      {
        path: 'sessions/:id',
        loadComponent: () => import('./psychopedagogy-home/psychopedagogy-home.page').then(m => m.PsychopedagogyHomePage)
      }
    ]
  }
];
