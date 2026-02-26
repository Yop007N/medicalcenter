import { Routes } from '@angular/router';

export const GASTROENTEROLOGY_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () => import('./gastroenterology-home/gastroenterology-home.page').then((m) => m.GastroenterologyHomePage)
      },
      {
        path: 'workspace',
        loadComponent: () =>
          import('../specialties/specialty-module/specialty-module.page').then(
            (m) => m.SpecialtyModulePage
          ),
        data: { specialtyKey: 'gastroenterology' }
      }
    ]
  }
];
