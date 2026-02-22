import { Routes } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { MedicalRecordsEffects } from '../../store/medical-records/medical-records.effects';

export const MEDICAL_RECORDS_ROUTES: Routes = [
  {
    path: '',
    providers: [provideEffects(MedicalRecordsEffects)],
    children: [
      {
        path: '',
        loadComponent: () => import('./medical-records-list/medical-records-list.page').then(m => m.MedicalRecordsListPage)
      },
      {
        path: 'new',
        loadComponent: () => import('./medical-record-form/medical-record-form.page').then(m => m.MedicalRecordFormPage)
      },
      {
        path: ':id',
        loadComponent: () => import('./medical-record-detail/medical-record-detail.page').then(m => m.MedicalRecordDetailPage)
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./medical-record-form/medical-record-form.page').then(m => m.MedicalRecordFormPage)
      }
    ]
  }
];
