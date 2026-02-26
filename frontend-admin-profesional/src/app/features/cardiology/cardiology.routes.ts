import { Routes } from '@angular/router';

export const CARDIOLOGY_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () => import('./cardiology-home/cardiology-home.page').then((m) => m.CardiologyHomePage)
      },
      {
        path: 'workspace',
        loadComponent: () =>
          import('../specialties/specialty-module/specialty-module.page').then(
            (m) => m.SpecialtyModulePage
          ),
        data: { specialtyKey: 'cardiology' }
      }
    ]
  }
];
