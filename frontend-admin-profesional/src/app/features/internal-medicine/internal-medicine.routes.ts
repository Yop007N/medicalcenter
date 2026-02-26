import { Routes } from '@angular/router';

export const INTERNAL_MEDICINE_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () => import('./internal-medicine-home/internal-medicine-home.page').then((m) => m.InternalMedicineHomePage)
      },
      {
        path: 'workspace',
        loadComponent: () =>
          import('../specialties/specialty-module/specialty-module.page').then(
            (m) => m.SpecialtyModulePage
          ),
        data: { specialtyKey: 'internal-medicine' }
      }
    ]
  }
];
