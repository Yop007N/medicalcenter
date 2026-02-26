import { Routes } from '@angular/router';

export const UROLOGY_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () => import('./urology-home/urology-home.page').then((m) => m.UrologyHomePage)
      },
      {
        path: 'workspace',
        loadComponent: () =>
          import('../specialties/specialty-module/specialty-module.page').then(
            (m) => m.SpecialtyModulePage
          ),
        data: { specialtyKey: 'urology' }
      }
    ]
  }
];
