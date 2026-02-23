import { Routes } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { PaymentsEffects } from '../../store/payments/payments.effects';

export const PAYMENTS_ROUTES: Routes = [
  {
    path: '',
    providers: [provideEffects(PaymentsEffects)],
    children: [
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
    ]
  }
];
