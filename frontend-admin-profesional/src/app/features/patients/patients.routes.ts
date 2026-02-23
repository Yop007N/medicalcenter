import { Routes } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { PatientsEffects } from '../../store/patients/patients.effects';

export const PATIENTS_ROUTES: Routes = [
  {
    path: '',
    providers: [provideEffects(PatientsEffects)],
    children: [
      {
        path: '',
        loadComponent: () => import('./patients-list/patients-list.page').then(m => m.PatientsListPage)
      },
      {
        path: 'new',
        loadComponent: () => import('./patient-form/patient-form.page').then(m => m.PatientFormPage)
      },
      {
        path: ':id',
        loadComponent: () => import('./patient-detail/patient-detail.page').then(m => m.PatientDetailPage)
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./patient-form/patient-form.page').then(m => m.PatientFormPage)
      }
    ]
  }
];
