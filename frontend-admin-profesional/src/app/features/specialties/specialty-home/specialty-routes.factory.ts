import { Routes } from '@angular/router';

export function buildSpecialtyHomeRoutes(specialtyKey: string): Routes {
  return [
    {
      path: '',
      children: [
        {
          path: '',
          loadComponent: () =>
            import('./specialty-home.page').then((m) => m.SpecialtyHomePage),
          data: { specialtyKey },
        },
        {
          path: 'workspace',
          loadComponent: () =>
            import('../specialty-module/specialty-module.page').then(
              (m) => m.SpecialtyModulePage,
            ),
          data: { specialtyKey },
        },
      ],
    },
  ];
}

