import { Routes } from '@angular/router';

export const PEDIATRICS_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () => import('./pediatrics-home/pediatrics-home.page').then((m) => m.PediatricsHomePage)
      },
      {
        path: 'workspace',
        loadComponent: () =>
          import('../specialties/specialty-module/specialty-module.page').then(
            (m) => m.SpecialtyModulePage
          ),
        data: { specialtyKey: 'pediatrics' }
      }
    ]
  }
];
