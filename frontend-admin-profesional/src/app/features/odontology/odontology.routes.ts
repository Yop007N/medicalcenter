import { Routes } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { OdontologyEffects } from '../../store/odontology/odontology.effects';

export const ODONTOLOGY_ROUTES: Routes = [
  {
    path: '',
    providers: [provideEffects(OdontologyEffects)],
    children: [
      {
        path: '',
        loadComponent: () => import('./odontology-home/odontology-home.page').then(m => m.OdontologyHomePage)
      },
      // Clinical history
      {
        path: 'clinical-history/:patientId',
        loadComponent: () => import('./clinical-history/clinical-history.page').then(m => m.ClinicalHistoryPage)
      },
      {
        path: 'treatments',
        loadComponent: () => import('./treatments-list/treatments-list.page').then(m => m.TreatmentsListPage)
      },
      {
        path: 'treatments/new',
        loadComponent: () => import('./treatment-form/treatment-form.page').then(m => m.TreatmentFormPage)
      },
      {
        path: 'treatments/:id',
        loadComponent: () => import('./treatment-detail/treatment-detail.page').then(m => m.TreatmentDetailPage)
      },
      {
        path: 'treatments/:id/edit',
        loadComponent: () => import('./treatment-form/treatment-form.page').then(m => m.TreatmentFormPage)
      },
      {
        path: 'odontograms',
        loadComponent: () => import('./odontogram/odontogram-visual.page').then(m => m.OdontogramVisualPage)
      },
      {
        path: 'odontograms/new/:patientId',
        loadComponent: () => import('./odontogram/odontogram-visual.page').then(m => m.OdontogramVisualPage)
      },
      {
        path: 'odontograms/:id',
        loadComponent: () => import('./odontogram/odontogram-visual.page').then(m => m.OdontogramVisualPage)
      },
      {
        path: 'odontograms/:id/patient/:patientId',
        loadComponent: () => import('./odontogram/odontogram-visual.page').then(m => m.OdontogramVisualPage)
      },
      // Detailed SVG view
      {
        path: 'odontograms-detail',
        loadComponent: () => import('./odontogram/odontogram.page').then(m => m.OdontogramPage)
      },
      {
        path: 'odontograms-detail/:id',
        loadComponent: () => import('./odontogram/odontogram.page').then(m => m.OdontogramPage)
      }
    ]
  }
];
