import { Routes } from '@angular/router';

export const NUTRITION_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () => import('./nutrition-home/nutrition-home.page').then((m) => m.NutritionHomePage)
      },
      {
        path: 'workspace',
        loadComponent: () =>
          import('../specialties/specialty-module/specialty-module.page').then(
            (m) => m.SpecialtyModulePage
          ),
        data: { specialtyKey: 'nutrition' }
      }
    ]
  }
];
