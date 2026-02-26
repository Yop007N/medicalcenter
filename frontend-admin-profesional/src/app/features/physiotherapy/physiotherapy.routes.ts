import { Routes } from '@angular/router';

export const PHYSIOTHERAPY_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () => import('./physiotherapy-home/physiotherapy-home.page').then((m) => m.PhysiotherapyHomePage)
      },
      {
        path: 'workspace',
        loadComponent: () =>
          import('../specialties/specialty-module/specialty-module.page').then(
            (m) => m.SpecialtyModulePage
          ),
        data: { specialtyKey: 'physiotherapy' }
      }
    ]
  }
];
