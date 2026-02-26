import { Routes } from '@angular/router';

export const OPHTHALMOLOGY_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () => import('./ophthalmology-home/ophthalmology-home.page').then((m) => m.OphthalmologyHomePage)
      },
      {
        path: 'workspace',
        loadComponent: () =>
          import('../specialties/specialty-module/specialty-module.page').then(
            (m) => m.SpecialtyModulePage
          ),
        data: { specialtyKey: 'ophthalmology' }
      }
    ]
  }
];
