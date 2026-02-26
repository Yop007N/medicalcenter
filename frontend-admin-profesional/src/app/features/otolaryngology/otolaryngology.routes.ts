import { Routes } from '@angular/router';

export const OTOLARYNGOLOGY_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () => import('./otolaryngology-home/otolaryngology-home.page').then((m) => m.OtolaryngologyHomePage)
      },
      {
        path: 'workspace',
        loadComponent: () =>
          import('../specialties/specialty-module/specialty-module.page').then(
            (m) => m.SpecialtyModulePage
          ),
        data: { specialtyKey: 'otolaryngology' }
      }
    ]
  }
];
