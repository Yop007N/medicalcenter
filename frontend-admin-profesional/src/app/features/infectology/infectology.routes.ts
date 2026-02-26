import { Routes } from '@angular/router';

export const INFECTOLOGY_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () => import('./infectology-home/infectology-home.page').then((m) => m.InfectologyHomePage)
      },
      {
        path: 'workspace',
        loadComponent: () =>
          import('../specialties/specialty-module/specialty-module.page').then(
            (m) => m.SpecialtyModulePage
          ),
        data: { specialtyKey: 'infectology' }
      }
    ]
  }
];
