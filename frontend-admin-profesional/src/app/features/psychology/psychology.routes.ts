import { Routes } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { PsychologyEffects } from '../../store/psychology/psychology.effects';

export const PSYCHOLOGY_ROUTES: Routes = [
  {
    path: '',
    providers: [provideEffects(PsychologyEffects)],
    children: [
      {
        path: '',
        loadComponent: () => import('./psychology-home/psychology-home.page').then(m => m.PsychologyHomePage)
      },
      {
        path: 'evaluations',
        loadComponent: () => import('./psychology-home/psychology-home.page').then(m => m.PsychologyHomePage)
      },
      {
        path: 'evaluations/new',
        loadComponent: () => import('./psychology-home/psychology-home.page').then(m => m.PsychologyHomePage)
      },
      {
        path: 'evaluations/:id',
        loadComponent: () => import('./psychology-home/psychology-home.page').then(m => m.PsychologyHomePage)
      },
      {
        path: 'sessions',
        loadComponent: () => import('./psychology-home/psychology-home.page').then(m => m.PsychologyHomePage)
      },
      {
        path: 'sessions/:id',
        loadComponent: () => import('./psychology-home/psychology-home.page').then(m => m.PsychologyHomePage)
      }
    ]
  }
];
