import { createAction, props } from '@ngrx/store';
import { Payment, PaymentCreate } from '../../models/budget.model';

// Load Payments
export const loadPayments = createAction(
  '[Payments] Load Payments',
  props<{ budgetId?: number }>()
);
export const loadPaymentsSuccess = createAction(
  '[Payments] Load Payments Success',
  props<{ payments: Payment[] }>()
);
export const loadPaymentsFailure = createAction(
  '[Payments] Load Payments Failure',
  props<{ error: string }>()
);

// Load Single Payment
export const loadPayment = createAction(
  '[Payments] Load Payment',
  props<{ id: number }>()
);
export const loadPaymentSuccess = createAction(
  '[Payments] Load Payment Success',
  props<{ payment: Payment }>()
);
export const loadPaymentFailure = createAction(
  '[Payments] Load Payment Failure',
  props<{ error: string }>()
);

// Create Payment
export const createPayment = createAction(
  '[Payments] Create Payment',
  props<{ payment: PaymentCreate }>()
);
export const createPaymentSuccess = createAction(
  '[Payments] Create Payment Success',
  props<{ payment: Payment }>()
);
export const createPaymentFailure = createAction(
  '[Payments] Create Payment Failure',
  props<{ error: string }>()
);

// Update Payment
export const updatePayment = createAction(
  '[Payments] Update Payment',
  props<{ id: number; payment: Partial<PaymentCreate> }>()
);
export const updatePaymentSuccess = createAction(
  '[Payments] Update Payment Success',
  props<{ payment: Payment }>()
);
export const updatePaymentFailure = createAction(
  '[Payments] Update Payment Failure',
  props<{ error: string }>()
);

// Delete Payment
export const deletePayment = createAction(
  '[Payments] Delete Payment',
  props<{ id: number }>()
);
export const deletePaymentSuccess = createAction(
  '[Payments] Delete Payment Success',
  props<{ id: number }>()
);
export const deletePaymentFailure = createAction(
  '[Payments] Delete Payment Failure',
  props<{ error: string }>()
);

// Process Payment
export const processPayment = createAction(
  '[Payments] Process Payment',
  props<{ id: number }>()
);
export const processPaymentSuccess = createAction(
  '[Payments] Process Payment Success',
  props<{ payment: Payment }>()
);
export const processPaymentFailure = createAction(
  '[Payments] Process Payment Failure',
  props<{ error: string }>()
);

// Clear
export const clearError = createAction('[Payments] Clear Error');
export const clearSelectedPayment = createAction('[Payments] Clear Selected Payment');
