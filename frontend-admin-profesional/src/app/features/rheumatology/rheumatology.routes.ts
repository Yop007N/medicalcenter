import { Routes } from '@angular/router';

export const RHEUMATOLOGY_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () => import('./rheumatology-home/rheumatology-home.page').then((m) => m.RheumatologyHomePage)
      },
      {
        path: 'workspace',
        loadComponent: () =>
          import('../specialties/specialty-module/specialty-module.page').then(
            (m) => m.SpecialtyModulePage
          ),
        data: { specialtyKey: 'rheumatology' }
      }
    ]
  }
];
