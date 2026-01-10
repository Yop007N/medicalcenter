import { Routes } from '@angular/router';

export const PAYMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./payments-list/payments-list.page').then(m => m.PaymentsListPage)
  },
  {
    path: 'new',
    loadComponent: () => import('./payment-form/payment-form.page').then(m => m.PaymentFormPage)
  },
  {
    path: ':id',
    loadComponent: () => import('./payment-detail/payment-detail.page').then(m => m.PaymentDetailPage)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./payment-form/payment-form.page').then(m => m.PaymentFormPage)
  }
];
