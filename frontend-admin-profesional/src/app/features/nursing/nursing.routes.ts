import { Routes } from '@angular/router';

export const NURSING_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () => import('./nursing-home/nursing-home.page').then((m) => m.NursingHomePage)
      },
      {
        path: 'workspace',
        loadComponent: () =>
          import('../specialties/specialty-module/specialty-module.page').then(
            (m) => m.SpecialtyModulePage
          ),
        data: { specialtyKey: 'nursing' }
      }
    ]
  }
];
