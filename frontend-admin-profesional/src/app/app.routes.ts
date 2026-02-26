import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: '',
    loadComponent: () => import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
      },
      {
        path: 'patients',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/patients/patients.routes').then(m => m.PATIENTS_ROUTES)
      },
      {
        path: 'professionals',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/professionals/professionals.routes').then(m => m.PROFESSIONALS_ROUTES)
      },
      {
        path: 'appointments',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/appointments/appointments.routes').then(m => m.APPOINTMENTS_ROUTES)
      },
      {
        path: 'medical-records',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/medical-records/medical-records.routes').then(m => m.MEDICAL_RECORDS_ROUTES)
      },
      {
        path: 'budgets',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/budgets/budgets.routes').then(m => m.BUDGETS_ROUTES)
      },
      {
        path: 'payments',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/payments/payments.routes').then(m => m.PAYMENTS_ROUTES)
      },
      {
        path: 'files',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/files/files.routes').then(m => m.FILES_ROUTES)
      },
      {
        path: 'odontology',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/odontology/odontology.routes').then(m => m.ODONTOLOGY_ROUTES)
      },
      {
        path: 'psychology',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/psychology/psychology.routes').then(m => m.PSYCHOLOGY_ROUTES)
      },
      {
        path: 'psychopedagogy',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/psychopedagogy/psychopedagogy.routes').then(m => m.PSYCHOPEDAGOGY_ROUTES)
      },
      {
        path: 'cardiology',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/cardiology/cardiology.routes').then(m => m.CARDIOLOGY_ROUTES)
      },
      {
        path: 'pediatrics',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/pediatrics/pediatrics.routes').then(m => m.PEDIATRICS_ROUTES)
      },
      {
        path: 'gynecology',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/gynecology/gynecology.routes').then(m => m.GYNECOLOGY_ROUTES)
      },
      {
        path: 'traumatology',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/traumatology/traumatology.routes').then(m => m.TRAUMATOLOGY_ROUTES)
      },
      {
        path: 'neurology',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/neurology/neurology.routes').then(m => m.NEUROLOGY_ROUTES)
      },
      {
        path: 'internal-medicine',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/internal-medicine/internal-medicine.routes').then(m => m.INTERNAL_MEDICINE_ROUTES)
      },
      {
        path: 'dermatology',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/dermatology/dermatology.routes').then(m => m.DERMATOLOGY_ROUTES)
      },
      {
        path: 'endocrinology',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/endocrinology/endocrinology.routes').then(m => m.ENDOCRINOLOGY_ROUTES)
      },
      {
        path: 'gastroenterology',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/gastroenterology/gastroenterology.routes').then(m => m.GASTROENTEROLOGY_ROUTES)
      },
      {
        path: 'pulmonology',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/pulmonology/pulmonology.routes').then(m => m.PULMONOLOGY_ROUTES)
      },
      {
        path: 'urology',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/urology/urology.routes').then(m => m.UROLOGY_ROUTES)
      },
      {
        path: 'nephrology',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/nephrology/nephrology.routes').then(m => m.NEPHROLOGY_ROUTES)
      },
      {
        path: 'oncology',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/oncology/oncology.routes').then(m => m.ONCOLOGY_ROUTES)
      },
      {
        path: 'otolaryngology',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/otolaryngology/otolaryngology.routes').then(m => m.OTOLARYNGOLOGY_ROUTES)
      },
      {
        path: 'ophthalmology',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/ophthalmology/ophthalmology.routes').then(m => m.OPHTHALMOLOGY_ROUTES)
      },
      {
        path: 'rheumatology',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/rheumatology/rheumatology.routes').then(m => m.RHEUMATOLOGY_ROUTES)
      },
      {
        path: 'infectology',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/infectology/infectology.routes').then(m => m.INFECTOLOGY_ROUTES)
      },
      {
        path: 'nutrition',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/nutrition/nutrition.routes').then(m => m.NUTRITION_ROUTES)
      },
      {
        path: 'physiotherapy',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/physiotherapy/physiotherapy.routes').then(m => m.PHYSIOTHERAPY_ROUTES)
      },
      {
        path: 'nursing',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/nursing/nursing.routes').then(m => m.NURSING_ROUTES)
      },
      {
        path: 'general-medicine',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/general-medicine/general-medicine.routes').then(m => m.GENERAL_MEDICINE_ROUTES)
      },
      {
        path: 'specialties/:specialtyKey',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadComponent: () =>
          import('./features/specialties/specialty-module/specialty-module.page').then(
            (m) => m.SpecialtyModulePage
          )
      },
      {
        path: 'reports',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/reports/reports.routes').then(m => m.REPORTS_ROUTES)
      },
      {
        path: 'audit',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/audit/audit.routes').then(m => m.AUDIT_ROUTES)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
