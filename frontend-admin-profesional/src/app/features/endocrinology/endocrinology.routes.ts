import { Routes } from '@angular/router';

export const ENDOCRINOLOGY_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () => import('./endocrinology-home/endocrinology-home.page').then((m) => m.EndocrinologyHomePage)
      },
      {
        path: 'workspace',
        loadComponent: () =>
          import('../specialties/specialty-module/specialty-module.page').then(
            (m) => m.SpecialtyModulePage
          ),
        data: { specialtyKey: 'endocrinology' }
      }
    ]
  }
];
