import { Routes } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { ProfessionalsEffects } from '../../store/professionals/professionals.effects';

export const PROFESSIONALS_ROUTES: Routes = [
  {
    path: '',
    providers: [provideEffects(ProfessionalsEffects)],
    children: [
      {
        path: '',
        loadComponent: () => import('./professionals-list/professionals-list.page').then(m => m.ProfessionalsListPage)
      },
      {
        path: 'new',
        loadComponent: () => import('./professional-form/professional-form.page').then(m => m.ProfessionalFormPage)
      },
      {
        path: ':id',
        loadComponent: () => import('./professional-detail/professional-detail.page').then(m => m.ProfessionalDetailPage)
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./professional-form/professional-form.page').then(m => m.ProfessionalFormPage)
      }
    ]
  }
];
