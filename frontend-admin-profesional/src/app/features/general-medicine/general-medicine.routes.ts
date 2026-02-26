import { Routes } from '@angular/router';

export const GENERAL_MEDICINE_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () => import('./general-medicine-home/general-medicine-home.page').then((m) => m.GeneralMedicineHomePage)
      },
      {
        path: 'workspace',
        loadComponent: () =>
          import('../specialties/specialty-module/specialty-module.page').then(
            (m) => m.SpecialtyModulePage
          ),
        data: { specialtyKey: 'general-medicine' }
      }
    ]
  }
];
