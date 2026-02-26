import { Routes } from '@angular/router';

export const NEUROLOGY_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () => import('./neurology-home/neurology-home.page').then((m) => m.NeurologyHomePage)
      },
      {
        path: 'workspace',
        loadComponent: () =>
          import('../specialties/specialty-module/specialty-module.page').then(
            (m) => m.SpecialtyModulePage
          ),
        data: { specialtyKey: 'neurology' }
      }
    ]
  }
];
