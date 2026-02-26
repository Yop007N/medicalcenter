import { Routes } from '@angular/router';

export const PULMONOLOGY_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () => import('./pulmonology-home/pulmonology-home.page').then((m) => m.PulmonologyHomePage)
      },
      {
        path: 'workspace',
        loadComponent: () =>
          import('../specialties/specialty-module/specialty-module.page').then(
            (m) => m.SpecialtyModulePage
          ),
        data: { specialtyKey: 'pulmonology' }
      }
    ]
  }
];
