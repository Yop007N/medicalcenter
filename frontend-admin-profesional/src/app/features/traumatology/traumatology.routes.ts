import { Routes } from '@angular/router';

export const TRAUMATOLOGY_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () => import('./traumatology-home/traumatology-home.page').then((m) => m.TraumatologyHomePage)
      },
      {
        path: 'workspace',
        loadComponent: () =>
          import('../specialties/specialty-module/specialty-module.page').then(
            (m) => m.SpecialtyModulePage
          ),
        data: { specialtyKey: 'traumatology' }
      }
    ]
  }
];
