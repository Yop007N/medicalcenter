import { Routes } from '@angular/router';

export const NEPHROLOGY_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () => import('./nephrology-home/nephrology-home.page').then((m) => m.NephrologyHomePage)
      },
      {
        path: 'workspace',
        loadComponent: () =>
          import('../specialties/specialty-module/specialty-module.page').then(
            (m) => m.SpecialtyModulePage
          ),
        data: { specialtyKey: 'nephrology' }
      }
    ]
  }
];
