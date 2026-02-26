import { Routes } from '@angular/router';

export const GYNECOLOGY_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () => import('./gynecology-home/gynecology-home.page').then((m) => m.GynecologyHomePage)
      },
      {
        path: 'workspace',
        loadComponent: () =>
          import('../specialties/specialty-module/specialty-module.page').then(
            (m) => m.SpecialtyModulePage
          ),
        data: { specialtyKey: 'gynecology' }
      }
    ]
  }
];
