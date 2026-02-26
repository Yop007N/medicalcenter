import { Routes } from '@angular/router';

export const DERMATOLOGY_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () => import('./dermatology-home/dermatology-home.page').then((m) => m.DermatologyHomePage)
      },
      {
        path: 'workspace',
        loadComponent: () =>
          import('../specialties/specialty-module/specialty-module.page').then(
            (m) => m.SpecialtyModulePage
          ),
        data: { specialtyKey: 'dermatology' }
      }
    ]
  }
];
