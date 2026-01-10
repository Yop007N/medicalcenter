import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PaymentsState } from './payments.reducer';

export const selectPaymentsState = createFeatureSelector<PaymentsState>('payments');

export const selectAllPayments = createSelector(
  selectPaymentsState,
  state => state.payments
);

export const selectSelectedPayment = createSelector(
  selectPaymentsState,
  state => state.selectedPayment
);

export const selectPaymentsLoading = createSelector(
  selectPaymentsState,
  state => state.loading
);

export const selectPaymentsError = createSelector(
  selectPaymentsState,
  state => state.error
);

export const selectPaymentsByBudget = (budgetId: number) => createSelector(
  selectAllPayments,
  payments => payments.filter(p => p.budget_id === budgetId)
);

export const selectPaymentsByStatus = (status: string) => createSelector(
  selectAllPayments,
  payments => payments.filter(p => p.payment_status === status)
);

export const selectTotalPayments = createSelector(
  selectAllPayments,
  payments => payments.reduce((sum, p) => sum + Number(p.amount), 0)
);
